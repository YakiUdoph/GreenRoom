import crypto from "node:crypto";
import { isReplyHistoryRow } from "@animocabrands/minds-client-lib";
import {
  buildV2MindPrompt, finalizeAndPersistV2Decision, selectV2Signals,
  V2_MIND_IDENTITY, validateCreatorContext,
} from "./v2-decision.mjs";
import {
  createV2RunId, loadV2Run, markV2RunDecisionPersisted,
  markV2RunParserRejected, markV2RunReplyReceived, markV2RunSubmitted,
  markV2RunTimedOut, prepareV2Run,
} from "./v2-run-lifecycle.mjs";
import { retrieveLiveEvidenceForObjective } from "./live-evidence.mjs";
import {
  collectionDeadlinePassed, collectionDelaySeconds, extractSafeSdkMetadata,
  normalizeMindReply, selectVerifiedHistoryReply, verifyMindIdentity,
} from "./worker-guards.mjs";
import {
  buildPrivateV2Diagnostic, safeQueueTelemetry, safeV2Failure, v2Failure,
} from "./v2-observability.mjs";

const iso = (value = new Date()) => value.toISOString();
const parse = (value, fallback = null) => {
  if (!value) return fallback;
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return fallback; }
};
const hash = value => crypto.createHash("sha256").update(String(value)).digest("hex");
const statusKey = runId => `greenroom:run_status:${runId}`;
const inputKey = runId => `greenroom:v2_input:${runId}`;
const operationalDiagnosticKey = runId => `greenroom:v2_operational_diagnostic:${runId}`;

export function publicV2Run(record) {
  if (!record?.run_id || record.pipeline !== "V2") return null;
  return {
    run_id: record.run_id,
    status: record.status,
    decision_available: record.status === "COMPLETED" && record.decision_status === "PERSISTED",
    created_at: record.created_at || null,
    updated_at: record.updated_at || null,
    completed_at: record.completed_at || null,
    failure_category: record.failure_category || null,
    execution_stage: record.execution_stage || null,
    queue: record.queue ? safeQueueTelemetry(record.queue) : null,
  };
}

export function creatorContextFromProduct({ profile, objective }) {
  const exact = profile?.v2_creator_context_input || {};
  const preferences = [];
  if (exact.preferred_tone) preferences.push(exact.preferred_tone);
  if (Array.isArray(exact.content_wanted)) preferences.push(...exact.content_wanted);
  if (Array.isArray(exact.preferences)) preferences.push(...exact.preferences);
  const constraints = [];
  if (objective.constraints) constraints.push(objective.constraints);
  if (Array.isArray(exact.content_not_wanted)) constraints.push(...exact.content_not_wanted);
  return validateCreatorContext({
    context_version: `creator_context_${objective.fingerprint.slice(0, 16)}`,
    primary_platform: { value: "YOUTUBE", source: "CREATOR_SUPPLIED" },
    primary_goal: { value: objective.title, source: "CREATOR_SUPPLIED" },
    constraints: constraints.map(value => ({ value, source: "CREATOR_SUPPLIED" })),
    creator_supplied_preferences: preferences.map(value => ({ value, source: "CREATOR_SUPPLIED" })),
  });
}

export async function persistPublicV2Status(redis, record) {
  if (["FAILED", "REJECTED", "TIMED_OUT"].includes(record.status) && (!record.failure_category || !record.execution_stage)) {
    throw new Error("Terminal V2 failure requires a category and execution stage");
  }
  await redis.set(statusKey(record.run_id), JSON.stringify(record));
  const recent = parse(await redis.get("greenroom:v2_recent_runs"), []);
  const item = publicV2Run(record);
  await redis.set("greenroom:v2_recent_runs", JSON.stringify([item, ...recent.filter(row => row.run_id !== record.run_id)].slice(0, 20)));
  return record;
}

export async function failV2Run(redis, record, error, fallbackStage = "WORKER_STARTED", now = new Date(), status = "FAILED") {
  const failure = safeV2Failure(error, fallbackStage);
  const timestamp = iso(now);
  const failed = { ...record, pipeline: "V2", status, execution_stage: failure.stage, failure_category: failure.category, updated_at: timestamp, completed_at: timestamp };
  await redis.set(operationalDiagnosticKey(record.run_id), JSON.stringify(buildPrivateV2Diagnostic({ runId: record.run_id, error: error?.cause || error, stage: failure.stage, category: failure.category, timestamp })));
  await persistPublicV2Status(redis, failed);
  return failed;
}

async function markStage(redis, record, executionStage, now = new Date()) {
  return persistPublicV2Status(redis, { ...record, execution_stage: executionStage, updated_at: iso(now) });
}

function decisionFailure(error) {
  const message = String(error?.message || "");
  if (message.startsWith("V2 action ")) return v2Failure("ACTION_QUALITY_REJECTED", "VALIDATING_REPLY", error);
  const parserMarkers = ["V2 Mind response", "V2 decision lacks valid personalization provenance", "WHAT I'D DO NEXT"];
  if (parserMarkers.some(marker => message.startsWith(marker))) return v2Failure("DECISION_PARSE_REJECTED", "VALIDATING_REPLY", error);
  return v2Failure("DECISION_PERSISTENCE_FAILED", "PERSISTING_DECISION", error);
}

export async function initializeV2Run({ redis, objective, now = new Date(), enqueue, targetUrl }) {
  const runId = createV2RunId();
  const createdAt = iso(now);
  let initial = {
    run_record_version: "greenroom_v2_run_v1", pipeline: "V2", run_id: runId,
    objective_snapshot: objective, analytics_import_hash: null,
    creator_context_version: null, selected_signal_ids: [],
    submission_status: "INITIALIZED", reply_status: "NOT_STARTED", parser_status: "NOT_STARTED",
    decision_status: "NOT_PERSISTED", status: "PREPARED", created_at: createdAt,
    updated_at: createdAt, failure_category: null, execution_stage: "PREPARING", queue: safeQueueTelemetry(),
  };
  await persistPublicV2Status(redis, initial);
  let analytics;
  try { analytics = parse(await redis.get("greenroom:v2_analytics:latest")); }
  catch (error) { return publicV2Run(await failV2Run(redis, initial, v2Failure("ANALYTICS_NOT_FOUND", "LOADING_ANALYTICS", error))); }
  if (!analytics) return publicV2Run(await failV2Run(redis, initial, v2Failure("ANALYTICS_NOT_FOUND", "LOADING_ANALYTICS")));
  if (!analytics.content_hash || !Array.isArray(analytics.signals)) return publicV2Run(await failV2Run(redis, initial, v2Failure("ANALYTICS_INVALID", "LOADING_ANALYTICS")));
  let creatorContext;
  try {
    const profile = parse(await redis.get("greenroom:creator_profile"), {});
    creatorContext = creatorContextFromProduct({ profile, objective });
  } catch (error) { return publicV2Run(await failV2Run(redis, initial, v2Failure("CREATOR_CONTEXT_INVALID", "PREPARING", error))); }
  initial = { ...initial, analytics_import_hash: analytics.content_hash, creator_context_version: creatorContext.context_version, execution_stage: "QUEUEING", updated_at: iso() };
  await persistPublicV2Status(redis, initial);
  await redis.set(inputKey(runId), JSON.stringify({ creatorContext, signals: analytics.signals, analyticsImportHash: analytics.content_hash }));
  try {
    const result = await enqueue(targetUrl, { run_id: runId, objective, pipeline: "V2" });
    initial = { ...initial, queue: safeQueueTelemetry(result?.queue || { route: "PRIMARY", primary_result: "ACCEPTED", fallback_result: "NOT_NEEDED", publication_accepted: true }), updated_at: iso() };
    await persistPublicV2Status(redis, initial);
  }
  catch (error) {
    const withQueue = { ...initial, queue: safeQueueTelemetry(error?.queue) };
    const failed = await failV2Run(redis, withQueue, v2Failure("QUEUE_UNAVAILABLE", "QUEUEING", error));
    return publicV2Run(failed);
  }
  return publicV2Run(initial);
}

export async function submitV2Run({ redis, mindsClient, runId, objective, now = new Date(), enqueueCollection, targetUrl, fetchEvidence = retrieveLiveEvidenceForObjective, selectSignals = selectV2Signals, buildPrompt = buildV2MindPrompt, verifyIdentity = verifyMindIdentity }) {
  let current = parse(await redis.get(statusKey(runId)));
  if (!current || current.pipeline !== "V2") throw v2Failure("RUN_NOT_FOUND", "WORKER_STARTED");
  if (current.submission_status !== "INITIALIZED") return { httpStatus: 202, body: publicV2Run(current) };
  const claim = await redis.set(`greenroom:v2_claim:${runId}`, iso(now), { nx: true, ex: 24 * 60 * 60 });
  if (claim === null) return { httpStatus: 202, body: publicV2Run(current) };
  current = await markStage(redis, current, "WORKER_STARTED", now);
  current = await markStage(redis, current, "LOADING_ANALYTICS", now);
  let storedInput;
  try { storedInput = parse(await redis.get(inputKey(runId))); }
  catch (error) { return { httpStatus: 200, body: publicV2Run(await failV2Run(redis, current, v2Failure("ANALYTICS_NOT_FOUND", "LOADING_ANALYTICS", error))) }; }
  if (!storedInput) return { httpStatus: 200, body: publicV2Run(await failV2Run(redis, current, v2Failure("ANALYTICS_NOT_FOUND", "LOADING_ANALYTICS"))) };
  if (!storedInput.analyticsImportHash || !Array.isArray(storedInput.signals)) return { httpStatus: 200, body: publicV2Run(await failV2Run(redis, current, v2Failure("ANALYTICS_INVALID", "LOADING_ANALYTICS"))) };
  try { validateCreatorContext(storedInput.creatorContext); }
  catch (error) { return { httpStatus: 200, body: publicV2Run(await failV2Run(redis, current, v2Failure("CREATOR_CONTEXT_INVALID", "LOADING_ANALYTICS", error))) }; }
  current = await markStage(redis, current, "RETRIEVING_EVIDENCE", now);
  let retrieval;
  try { retrieval = await fetchEvidence({ objective, now }); }
  catch (error) { return { httpStatus: 200, body: publicV2Run(await failV2Run(redis, current, v2Failure("EVIDENCE_UNAVAILABLE", "RETRIEVING_EVIDENCE", error))) }; }
  if (!retrieval.evidence.length) {
    const status = retrieval.status === "UNSUPPORTED_DOMAIN" ? "UNSUPPORTED_DOMAIN" : "NO_RELEVANT_UPDATE";
    const done = await persistPublicV2Status(redis, { ...current, status, updated_at: iso(), failure_category: null });
    return { httpStatus: 200, body: publicV2Run(done) };
  }
  current = await markStage(redis, current, "SELECTING_SIGNALS", now);
  const evidence = retrieval.evidence[0];
  let selection;
  try { selection = selectSignals({ creatorContext: storedInput.creatorContext, externalEvidence: evidence, signals: storedInput.signals }); }
  catch (error) { return { httpStatus: 200, body: publicV2Run(await failV2Run(redis, current, v2Failure("SIGNAL_COMPUTATION_FAILED", "SELECTING_SIGNALS", error))) }; }
  const memoryProvenance = { availability: "UNAVAILABLE", memory_selection_version: "v2_product_context_v1", selected_rule_ids: [], selected_node_ids: [] };
  let prompt;
  try { prompt = buildPrompt({ creatorContext: storedInput.creatorContext, signalSelection: selection, memoryProvenance, externalEvidence: evidence }); }
  catch (error) { return { httpStatus: 200, body: publicV2Run(await failV2Run(redis, current, v2Failure("SIGNAL_COMPUTATION_FAILED", "SELECTING_SIGNALS", error))) }; }
  if (!mindsClient) return { httpStatus: 200, body: publicV2Run(await failV2Run(redis, current, v2Failure("MIND_CONFIGURATION_FAILED", "VERIFYING_MIND"))) };
  current = await markStage(redis, current, "VERIFYING_MIND", now);
  let verified;
  try { verified = verifyIdentity(await mindsClient.getMind(V2_MIND_IDENTITY.mind_id), { mindId: V2_MIND_IDENTITY.mind_id, email: V2_MIND_IDENTITY.email, walletAddress: V2_MIND_IDENTITY.wallet_address }); }
  catch (error) { return { httpStatus: 200, body: publicV2Run(await failV2Run(redis, current, v2Failure("MIND_IDENTITY_FAILED", "VERIFYING_MIND", error))) }; }
  const alias = `greenroom-${runId}`;
  current = await markStage(redis, current, "SUBMITTING_MIND", now);
  let beforeFingerprint; let lifecycle; let sendResult;
  try {
    await mindsClient.ensureConversation(alias, V2_MIND_IDENTITY.mind_id);
    beforeFingerprint = await mindsClient.getLatestHistoryFingerprint(alias);
    lifecycle = await prepareV2Run(redis, { runId, createdAt: current.created_at, creatorContextVersion: storedInput.creatorContext.context_version, promptHash: hash(prompt), analyticsImportHash: storedInput.analyticsImportHash, signalSelection: selection, memoryProvenance, externalEvidence: evidence, verifiedMindIdentity: V2_MIND_IDENTITY });
    sendResult = await mindsClient.sendMessage({ alias, messageText: prompt });
  } catch (error) { return { httpStatus: 200, body: publicV2Run(await failV2Run(redis, current, v2Failure("MIND_SUBMISSION_FAILED", "SUBMITTING_MIND", error))) }; }
  lifecycle = await markV2RunSubmitted(redis, lifecycle, { submittedAt: iso(), transportMetadata: { transport: "MINDS_SDK", sdk_acknowledgement_present: Boolean(sendResult) } });
  await redis.set(inputKey(runId), JSON.stringify({ ...storedInput, signalSelection: selection, memoryProvenance, evidence, alias, beforeFingerprint, submittedPromptHash: hash(prompt), verifiedMindId: verified.mindId || verified.id }));
  const deadline = new Date(Date.parse(lifecycle.submitted_at) + 10 * 60 * 1000).toISOString();
  const waiting = await persistPublicV2Status(redis, { ...current, ...lifecycle, pipeline: "V2", objective_snapshot: objective, status: "WAITING_FOR_MINDS", execution_stage: "WAITING_FOR_REPLY", reply_deadline_at: deadline, updated_at: iso() });
  await enqueueCollection(targetUrl, { run_id: runId, objective, pipeline: "V2", phase: "collect" }, 5);
  return { httpStatus: 202, body: publicV2Run(waiting) };
}

export async function collectV2Run({ redis, mindsClient, runId, objective, now = new Date(), enqueueCollection, targetUrl, normalizeReply = normalizeMindReply, finalizeDecision = finalizeAndPersistV2Decision }) {
  let status = parse(await redis.get(statusKey(runId)));
  if (!status || status.pipeline !== "V2") throw v2Failure("RUN_NOT_FOUND", "WORKER_STARTED");
  if (["COMPLETED", "FAILED", "REJECTED", "TIMED_OUT", "NO_RELEVANT_UPDATE", "UNSUPPORTED_DOMAIN"].includes(status.status)) return { httpStatus: 200, body: publicV2Run(status) };
  if (!mindsClient) return { httpStatus: 200, body: publicV2Run(await failV2Run(redis, status, v2Failure("MIND_CONFIGURATION_FAILED", "WAITING_FOR_REPLY"))) };
  let lifecycle = await loadV2Run(redis, runId);
  if (collectionDeadlinePassed(status.reply_deadline_at, now)) {
    lifecycle = await markV2RunTimedOut(redis, lifecycle, { timeoutAt: iso(now), timeoutSeconds: 600 });
    status = await failV2Run(redis, { ...status, ...lifecycle, objective_snapshot: objective }, v2Failure("MIND_TIMEOUT", "WAITING_FOR_REPLY"), "WAITING_FOR_REPLY", now, "TIMED_OUT");
    return { httpStatus: 200, body: publicV2Run(status) };
  }
  const input = parse(await redis.get(inputKey(runId)));
  const outcome = await mindsClient.waitForReply({ alias: input.alias, timeoutMs: 15000, afterFingerprint: input.beforeFingerprint || undefined }).catch(() => null);
  let reply = outcome?.reply ? selectVerifiedHistoryReply([outcome.reply], { alias: input.alias, afterFingerprint: input.beforeFingerprint, submittedPromptHash: input.submittedPromptHash, hashText: hash }, isReplyHistoryRow) : null;
  if (!reply) {
    try {
      const rows = await mindsClient.getHistory(input.alias, { limit: 50 });
      reply = selectVerifiedHistoryReply(rows, { alias: input.alias, afterFingerprint: input.beforeFingerprint, submittedPromptHash: input.submittedPromptHash, hashText: hash }, isReplyHistoryRow);
    } catch (error) { return { httpStatus: 200, body: publicV2Run(await failV2Run(redis, status, v2Failure("MIND_REPLY_INVALID", "WAITING_FOR_REPLY", error))) }; }
  }
  if (!reply) {
    const delay = collectionDelaySeconds(lifecycle.submitted_at, now);
    await enqueueCollection(targetUrl, { run_id: runId, objective, pipeline: "V2", phase: "collect" }, delay);
    return { httpStatus: 202, body: publicV2Run(status) };
  }
  let normalized;
  try { normalized = normalizeReply({ reply, timedOut: false }); }
  catch (error) { return { httpStatus: 200, body: publicV2Run(await failV2Run(redis, status, v2Failure("MIND_REPLY_INVALID", "VALIDATING_REPLY", error))) }; }
  lifecycle = await markV2RunReplyReceived(redis, lifecycle, { receivedAt: iso(), transportMetadata: { transport: "MINDS_SDK", event_count: 1 } });
  status = await markStage(redis, status, "VALIDATING_REPLY", now);
  try {
    status = await markStage(redis, status, "PERSISTING_DECISION", now);
    const decision = await finalizeDecision({ redis, mindReplyText: normalized.text, promptHash: input.submittedPromptHash, replyProvenance: { transport: "MINDS_SDK", sender_type: reply.senderType, sender_id: reply.senderId, sender_email: reply.senderEmail, fingerprint: reply.fingerprint }, sseMetadata: { event_count: 1, reconstructed_from_field: normalized.source, chunk_count: 1 }, runId, creatorContext: input.creatorContext, analyticsImportHash: input.analyticsImportHash, signalSelection: input.signalSelection, memoryProvenance: input.memoryProvenance, externalEvidence: input.evidence, verifiedMindIdentity: V2_MIND_IDENTITY, completedAt: iso() });
    lifecycle = await markV2RunDecisionPersisted(redis, lifecycle, decision.completed_at);
    status = await persistPublicV2Status(redis, { ...status, ...lifecycle, pipeline: "V2", objective_snapshot: objective, status: "COMPLETED", execution_stage: "COMPLETE", completed_at: decision.completed_at, failure_category: null });
    return { httpStatus: 200, body: publicV2Run(status) };
  } catch (error) {
    const failure = decisionFailure(error);
    const rejected = ["DECISION_PARSE_REJECTED", "ACTION_QUALITY_REJECTED"].includes(failure.v2_category);
    if (rejected) lifecycle = await markV2RunParserRejected(redis, lifecycle, iso());
    status = await failV2Run(redis, { ...status, ...lifecycle, objective_snapshot: objective }, failure, failure.v2_stage, now, rejected ? "REJECTED" : "FAILED");
    return { httpStatus: 200, body: publicV2Run(status) };
  }
}
