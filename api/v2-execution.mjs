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

const iso = (value = new Date()) => value.toISOString();
const parse = (value, fallback = null) => {
  if (!value) return fallback;
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return fallback; }
};
const hash = value => crypto.createHash("sha256").update(String(value)).digest("hex");
const statusKey = runId => `greenroom:run_status:${runId}`;
const inputKey = runId => `greenroom:v2_input:${runId}`;

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

async function persistPublicStatus(redis, record) {
  await redis.set(statusKey(record.run_id), JSON.stringify(record));
  const recent = parse(await redis.get("greenroom:v2_recent_runs"), []);
  const item = publicV2Run(record);
  await redis.set("greenroom:v2_recent_runs", JSON.stringify([item, ...recent.filter(row => row.run_id !== record.run_id)].slice(0, 20)));
  return record;
}

export async function initializeV2Run({ redis, objective, now = new Date(), enqueue, targetUrl }) {
  const analytics = parse(await redis.get("greenroom:v2_analytics:latest"));
  if (!analytics?.content_hash || !Array.isArray(analytics.signals)) throw Object.assign(new Error("Import YouTube Studio analytics before starting a V2 check"), { statusCode: 409 });
  const profile = parse(await redis.get("greenroom:creator_profile"), {});
  const creatorContext = creatorContextFromProduct({ profile, objective });
  const runId = createV2RunId();
  const createdAt = iso(now);
  const initial = {
    run_record_version: "greenroom_v2_run_v1", pipeline: "V2", run_id: runId,
    objective_snapshot: objective, analytics_import_hash: analytics.content_hash,
    creator_context_version: creatorContext.context_version, selected_signal_ids: [],
    submission_status: "INITIALIZED", reply_status: "NOT_STARTED", parser_status: "NOT_STARTED",
    decision_status: "NOT_PERSISTED", status: "PREPARED", created_at: createdAt,
    updated_at: createdAt, failure_category: null,
  };
  await persistPublicStatus(redis, initial);
  await redis.set(inputKey(runId), JSON.stringify({ creatorContext, signals: analytics.signals, analyticsImportHash: analytics.content_hash }));
  try { await enqueue(targetUrl, { run_id: runId, objective, pipeline: "V2" }); }
  catch (error) {
    const failed = await persistPublicStatus(redis, { ...initial, status: "FAILED", updated_at: iso(), failure_category: "QUEUE_UNAVAILABLE" });
    return publicV2Run(failed);
  }
  return publicV2Run(initial);
}

export async function submitV2Run({ redis, mindsClient, runId, objective, now = new Date(), enqueueCollection, targetUrl, fetchEvidence = retrieveLiveEvidenceForObjective }) {
  const current = parse(await redis.get(statusKey(runId)));
  if (!current || current.pipeline !== "V2") throw new Error("V2 run was not initialized");
  if (current.submission_status !== "INITIALIZED") return { httpStatus: 202, body: publicV2Run(current) };
  const claim = await redis.set(`greenroom:v2_claim:${runId}`, iso(now), { nx: true, ex: 24 * 60 * 60 });
  if (claim === null) return { httpStatus: 202, body: publicV2Run(current) };
  let retrieval;
  try { retrieval = await fetchEvidence({ objective, now }); }
  catch { const failed = await persistPublicStatus(redis, { ...current, status: "FAILED", updated_at: iso(), failure_category: "EVIDENCE_UNAVAILABLE" }); return { httpStatus: 200, body: publicV2Run(failed) }; }
  if (!retrieval.evidence.length) {
    const status = retrieval.status === "UNSUPPORTED_DOMAIN" ? "UNSUPPORTED_DOMAIN" : "NO_RELEVANT_UPDATE";
    const done = await persistPublicStatus(redis, { ...current, status, updated_at: iso(), failure_category: null });
    return { httpStatus: 200, body: publicV2Run(done) };
  }
  if (!mindsClient) throw new Error("Verified Udophia client is unavailable");
  const storedInput = parse(await redis.get(inputKey(runId)));
  const evidence = retrieval.evidence[0];
  const selection = selectV2Signals({ creatorContext: storedInput.creatorContext, externalEvidence: evidence, signals: storedInput.signals });
  const memoryProvenance = { availability: "UNAVAILABLE", memory_selection_version: "v2_product_context_v1", selected_rule_ids: [], selected_node_ids: [] };
  const prompt = buildV2MindPrompt({ creatorContext: storedInput.creatorContext, signalSelection: selection, memoryProvenance, externalEvidence: evidence });
  const verified = verifyMindIdentity(await mindsClient.getMind(V2_MIND_IDENTITY.mind_id), { mindId: V2_MIND_IDENTITY.mind_id, email: V2_MIND_IDENTITY.email, walletAddress: V2_MIND_IDENTITY.wallet_address });
  const alias = `greenroom-${runId}`;
  await mindsClient.ensureConversation(alias, V2_MIND_IDENTITY.mind_id);
  const beforeFingerprint = await mindsClient.getLatestHistoryFingerprint(alias);
  let lifecycle = await prepareV2Run(redis, { runId, createdAt: current.created_at, creatorContextVersion: storedInput.creatorContext.context_version, promptHash: hash(prompt), analyticsImportHash: storedInput.analyticsImportHash, signalSelection: selection, memoryProvenance, externalEvidence: evidence, verifiedMindIdentity: V2_MIND_IDENTITY });
  const sendResult = await mindsClient.sendMessage({ alias, messageText: prompt });
  lifecycle = await markV2RunSubmitted(redis, lifecycle, { submittedAt: iso(), transportMetadata: { transport: "MINDS_SDK", sdk_acknowledgement_present: Boolean(sendResult) } });
  await redis.set(inputKey(runId), JSON.stringify({ ...storedInput, signalSelection: selection, memoryProvenance, evidence, alias, beforeFingerprint, submittedPromptHash: hash(prompt), verifiedMindId: verified.mindId || verified.id }));
  const deadline = new Date(Date.parse(lifecycle.submitted_at) + 10 * 60 * 1000).toISOString();
  const waiting = await persistPublicStatus(redis, { ...current, ...lifecycle, pipeline: "V2", objective_snapshot: objective, status: "WAITING_FOR_MINDS", reply_deadline_at: deadline, updated_at: iso() });
  await enqueueCollection(targetUrl, { run_id: runId, objective, pipeline: "V2", phase: "collect" }, 5);
  return { httpStatus: 202, body: publicV2Run(waiting) };
}

export async function collectV2Run({ redis, mindsClient, runId, objective, now = new Date(), enqueueCollection, targetUrl }) {
  let status = parse(await redis.get(statusKey(runId)));
  if (!status || status.pipeline !== "V2") throw new Error("V2 run was not initialized");
  if (["COMPLETED", "FAILED", "NO_RELEVANT_UPDATE", "UNSUPPORTED_DOMAIN"].includes(status.status)) return { httpStatus: 200, body: publicV2Run(status) };
  let lifecycle = await loadV2Run(redis, runId);
  if (collectionDeadlinePassed(status.reply_deadline_at, now)) {
    lifecycle = await markV2RunTimedOut(redis, lifecycle, { timeoutAt: iso(now), timeoutSeconds: 600 });
    status = await persistPublicStatus(redis, { ...status, ...lifecycle, pipeline: "V2", objective_snapshot: objective, status: "FAILED", failure_category: "TIMED_OUT" });
    return { httpStatus: 200, body: publicV2Run(status) };
  }
  const input = parse(await redis.get(inputKey(runId)));
  const outcome = await mindsClient.waitForReply({ alias: input.alias, timeoutMs: 15000, afterFingerprint: input.beforeFingerprint || undefined }).catch(() => null);
  let reply = outcome?.reply ? selectVerifiedHistoryReply([outcome.reply], { alias: input.alias, afterFingerprint: input.beforeFingerprint, submittedPromptHash: input.submittedPromptHash, hashText: hash }, isReplyHistoryRow) : null;
  if (!reply) {
    const rows = await mindsClient.getHistory(input.alias, { limit: 50 });
    reply = selectVerifiedHistoryReply(rows, { alias: input.alias, afterFingerprint: input.beforeFingerprint, submittedPromptHash: input.submittedPromptHash, hashText: hash }, isReplyHistoryRow);
  }
  if (!reply) {
    const delay = collectionDelaySeconds(lifecycle.submitted_at, now);
    await enqueueCollection(targetUrl, { run_id: runId, objective, pipeline: "V2", phase: "collect" }, delay);
    return { httpStatus: 202, body: publicV2Run(status) };
  }
  const normalized = normalizeMindReply({ reply, timedOut: false });
  lifecycle = await markV2RunReplyReceived(redis, lifecycle, { receivedAt: iso(), transportMetadata: { transport: "MINDS_SDK", event_count: 1 } });
  try {
    const decision = await finalizeAndPersistV2Decision({ redis, mindReplyText: normalized.text, promptHash: input.submittedPromptHash, replyProvenance: { transport: "MINDS_SDK", sender_type: reply.senderType, sender_id: reply.senderId, sender_email: reply.senderEmail, fingerprint: reply.fingerprint }, sseMetadata: { event_count: 1, reconstructed_from_field: normalized.source, chunk_count: 1 }, runId, creatorContext: input.creatorContext, analyticsImportHash: input.analyticsImportHash, signalSelection: input.signalSelection, memoryProvenance: input.memoryProvenance, externalEvidence: input.evidence, verifiedMindIdentity: V2_MIND_IDENTITY, completedAt: iso() });
    lifecycle = await markV2RunDecisionPersisted(redis, lifecycle, decision.completed_at);
    status = await persistPublicStatus(redis, { ...status, ...lifecycle, pipeline: "V2", objective_snapshot: objective, status: "COMPLETED", completed_at: decision.completed_at, failure_category: null });
    return { httpStatus: 200, body: publicV2Run(status) };
  } catch {
    lifecycle = await markV2RunParserRejected(redis, lifecycle, iso());
    status = await persistPublicStatus(redis, { ...status, ...lifecycle, pipeline: "V2", objective_snapshot: objective, status: "FAILED", failure_category: "REJECTED" });
    return { httpStatus: 200, body: publicV2Run(status) };
  }
}
