import crypto from "node:crypto";
import { createMindsClient, isReplyHistoryRow } from "@animocabrands/minds-client-lib";
import { Receiver } from "@upstash/qstash";
import { Redis } from "@upstash/redis";
import { buildMindsPrompt, buildMindReplyDiagnostics, classifyObjectiveSignals, collectionDeadlinePassed, extractSafeSdkMetadata, isTerminalRunStatus, normalizeMindReply, parseMindBriefing, resolveIdempotentBriefing, selectVerifiedHistoryReply, updateRecentRunIndex, validateObjectiveSnapshot, validateWorkerConfiguration, verifyMindIdentity } from "./worker-guards.mjs";

export const maxDuration = 60;
export const config = { api: { bodyParser: false } };
const MIND_ID = "8208493e-f36b-1410-8466-00039ce7df11";
const COLLECTION_DELAY_SECONDS = 15;
const DEFAULT_REPLY_DEADLINE_MS = 10 * 60 * 1000;
const isoNow = (now = new Date()) => now.toISOString();
const hashText = (text) => crypto.createHash("sha256").update(String(text)).digest("hex");

async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks).toString("utf-8");
}
function parseStored(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return fallback; }
}
async function loadRunStatus(redis, runId) { return parseStored(await redis.get(`greenroom:run_status:${runId}`)); }
async function persistRunStatus(redis, runId, status) {
  await redis.set(`greenroom:run_status:${runId}`, JSON.stringify(status));
  const recent = parseStored(await redis.get("greenroom:recent_runs"), []);
  await redis.set("greenroom:recent_runs", JSON.stringify(updateRecentRunIndex(recent, status)));
  return status;
}
function assertMatchingRun(status, runId, objective) {
  if (!status?.objective_snapshot) throw new Error(`Run ${runId} has no durable objective snapshot`);
  if (["objective_id", "title", "constraints", "fingerprint"].some((field) => status.objective_snapshot[field] !== objective[field])) {
    throw new Error("QStash objective snapshot does not match the queued run snapshot");
  }
}
async function scheduleCollection(targetUrl, payload, env = process.env) {
  if (!env.QSTASH_TOKEN) throw new Error("QSTASH_TOKEN is required to schedule Minds collection");
  const base = (env.QSTASH_URL || "https://qstash.upstash.io").replace(/\/$/, "");
  const response = await fetch(`${base}/v2/publish/${targetUrl}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.QSTASH_TOKEN}`, "Content-Type": "application/json", "Upstash-Delay": `${COLLECTION_DELAY_SECONDS}s`, "Upstash-Retries": "2" },
    body: JSON.stringify({ ...payload, phase: "collect" }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`QStash collection scheduling failed with HTTP ${response.status}`);
  return extractSafeSdkMetadata(parseStored(text));
}
function stages(status, values) { return { ...(status.stage_timestamps || {}), ...values }; }

function buildBriefing({ runId, objective, status, mindBriefing, mindReplyText, completedAt }) {
  const items = mindBriefing.items.map((item, index) => ({ id: item.id || `opp_${String(index + 1).padStart(3, "0")}`, priority: item.priority || (index ? "WATCH" : "HIGH PRIORITY"), status: item.status || "NEW", ...item }));
  const learnedRules = status.learned_rules_snapshot || [];
  const provenance = { run_id: runId, objective_id: objective.objective_id, objective_fingerprint: objective.fingerprint, created_at: status.started_at, completed_at: completedAt, status: "COMPLETED", signal_source: "Demo Dataset (Simulated)", signal_mode: "DEMO", signal_classification: status.signal_classification, analysis_provider: "Animoca Minds", mind_id: MIND_ID, mind_verified: true, demo_mode: false, persistence_mode: "DURABLE", execution_mode: "QSTASH_BACKGROUND_JOB", opportunity_count: items.length };
  return { run_id: runId, objective_id: objective.objective_id, objective_snapshot: objective, timestamp: completedAt, last_run_formatted: new Date(completedAt).toUTCString(), signals_reviewed_count: status.signals_reviewed_count || 3, opportunities_found_count: items.length, memory_nodes_used_count: status.memory_nodes_used_count || 0, signal_source_label: "Demo Dataset (Simulated)", analysis_provider: "Animoca Minds", minds_source: "Animoca_Minds_Builder_API", minds_status: "COMPLETED", minds_verified: true, persistence_mode: "DURABLE", execution_mode: "QSTASH_BACKGROUND_JOB", continuity_note: learnedRules.length ? `Adjusted using your previous feedback: '${learnedRules.at(-1)}'.` : null, provenance, items, learned_rules_active: learnedRules, mind_raw_reply: mindReplyText };
}

async function handleSubmission({ redis, mindsClient, runId, objective, targetUrl, env, now = new Date(), enqueue = scheduleCollection }) {
  let status = await loadRunStatus(redis, runId);
  assertMatchingRun(status, runId, objective);
  if (status.status === "COMPLETED") {
    const briefing = parseStored(await redis.get(`greenroom:briefing:${runId}`), null);
    return { httpStatus: 200, body: { status: "COMPLETED", run_id: runId, briefing: resolveIdempotentBriefing(status, briefing, runId, objective), idempotent_replay: true } };
  }
  if (status.status === "FAILED") return { httpStatus: 200, body: { status: "FAILED", run_id: runId, error: status.error, idempotent_replay: true } };
  if (["SUBMITTING", "WAITING_FOR_MINDS"].includes(status.status)) {
    if (status.status === "WAITING_FOR_MINDS") await enqueue(targetUrl, { run_id: runId, objective }, env);
    return { httpStatus: 202, body: { status: status.status, run_id: runId, idempotent_replay: true } };
  }

  const claim = await redis.set(`greenroom:submission_claim:${runId}`, isoNow(now), { nx: true, ex: 24 * 60 * 60 });
  if (claim === null) {
    status = await loadRunStatus(redis, runId);
    return { httpStatus: 202, body: { status: status.status || "SUBMITTING", run_id: runId, idempotent_replay: true } };
  }

  const startedAt = isoNow(now);
  status = await persistRunStatus(redis, runId, { ...status, run_id: runId, status: "SUBMITTING", started_at: status.started_at || startedAt, objective_snapshot: objective, stage_timestamps: stages(status, { submission_started: startedAt }) });
  const creatorProfile = parseStored(await redis.get("greenroom:creator_profile"), { learned_voice_rules: [], memory_nodes: [] });
  verifyMindIdentity(await mindsClient.getMind(MIND_ID), { mindId: MIND_ID, email: "udophia@hellominds.ai", walletAddress: "0xB675Ec9857776678aE540cF3248d898f015987Cb" });
  const alias = `greenroom-${runId}`;
  const conversation = await mindsClient.ensureConversation(alias, MIND_ID);
  const beforeFingerprint = await mindsClient.getLatestHistoryFingerprint(alias);
  const classification = classifyObjectiveSignals(objective);
  const prompt = buildMindsPrompt(objective, creatorProfile, classification.signals);
  const preparedAt = isoNow();
  status = await persistRunStatus(redis, runId, { ...status, conversation_alias: alias, conversation_metadata: extractSafeSdkMetadata(conversation), pre_send_fingerprint: beforeFingerprint || null, submitted_prompt_hash: hashText(prompt), signal_classification: classification.provenance, signals_reviewed_count: classification.signals.length, memory_nodes_used_count: Array.isArray(creatorProfile.memory_nodes) ? creatorProfile.memory_nodes.length : 0, learned_rules_snapshot: Array.isArray(creatorProfile.learned_voice_rules) ? creatorProfile.learned_voice_rules : [], stage_timestamps: stages(status, { submission_prepared: preparedAt }) });
  const sendResult = await mindsClient.sendMessage({ alias, messageText: prompt });
  const submittedAt = isoNow();
  const deadlineMs = Number.parseInt(env.MINDS_REPLY_DEADLINE_MS || String(DEFAULT_REPLY_DEADLINE_MS), 10);
  const replyDeadlineAt = new Date(Date.parse(submittedAt) + deadlineMs).toISOString();
  status = await persistRunStatus(redis, runId, { ...status, status: "WAITING_FOR_MINDS", submitted_at: submittedAt, reply_deadline_at: replyDeadlineAt, collection_attempt: 0, message_metadata: extractSafeSdkMetadata(sendResult), stage_timestamps: stages(status, { message_submitted: submittedAt, waiting_began: submittedAt }) });
  const scheduleMetadata = await enqueue(targetUrl, { run_id: runId, objective }, env);
  await persistRunStatus(redis, runId, { ...status, collection_schedule_metadata: scheduleMetadata });
  return { httpStatus: 202, body: { status: "WAITING_FOR_MINDS", run_id: runId, submitted_at: submittedAt, reply_deadline_at: replyDeadlineAt } };
}

async function handleCollection({ redis, mindsClient, runId, objective, targetUrl, env, now = new Date(), enqueue = scheduleCollection }) {
  let status = await loadRunStatus(redis, runId);
  assertMatchingRun(status, runId, objective);
  if (isTerminalRunStatus(status.status)) return { httpStatus: 200, body: { status: status.status, run_id: runId, idempotent_replay: true } };
  if (status.status !== "WAITING_FOR_MINDS") return { httpStatus: 202, body: { status: status.status, run_id: runId, collection_skipped: true } };
  const attemptAt = isoNow(now);
  const attempt = (status.collection_attempt || 0) + 1;
  const claim = await redis.set(`greenroom:collection_claim:${runId}:${attempt}`, attemptAt, { nx: true, ex: 5 * 60 });
  if (claim === null) return { httpStatus: 202, body: { status: "WAITING_FOR_MINDS", run_id: runId, collection_attempt: attempt, idempotent_replay: true } };
  status = await persistRunStatus(redis, runId, { ...status, collection_attempt: attempt, collection_attempt_timestamps: [...(status.collection_attempt_timestamps || []), attemptAt].slice(-50), stage_timestamps: stages(status, { last_collection_attempt: attemptAt }) });
  const rows = await mindsClient.getHistory(status.conversation_alias, { after: status.pre_send_fingerprint || undefined, limit: 50 });
  status = await persistRunStatus(redis, runId, {
    ...status,
    last_history_observation: {
      checked_at: attemptAt,
      row_count: Array.isArray(rows) ? rows.length : 0,
      fingerprints: Array.isArray(rows) ? rows.map((row) => row?.fingerprint).filter((value) => typeof value === "string").slice(-5) : [],
      sender_types: Array.isArray(rows) ? [...new Set(rows.map((row) => row?.senderType).filter((value) => Number.isInteger(value)))] : [],
    },
  });
  const reply = selectVerifiedHistoryReply(rows, { alias: status.conversation_alias, afterFingerprint: status.pre_send_fingerprint || undefined, submittedPromptHash: status.submitted_prompt_hash, hashText }, isReplyHistoryRow);
  if (!reply) {
    if (collectionDeadlinePassed(status.reply_deadline_at, now)) {
      const failedAt = isoNow(now);
      const failed = { ...status, status: "FAILED", completed_at: failedAt, error: "Animoca Mind reply deadline passed without a verified response", reply_diagnostics: buildMindReplyDiagnostics({ timedOut: true }, objective, runId), stage_timestamps: stages(status, { terminal_failure: failedAt }) };
      await persistRunStatus(redis, runId, failed);
      return { httpStatus: 200, body: { status: "FAILED", run_id: runId, error: failed.error } };
    }
    await enqueue(targetUrl, { run_id: runId, objective }, env);
    return { httpStatus: 202, body: { status: "WAITING_FOR_MINDS", run_id: runId, collection_attempt: attempt } };
  }
  const replyFoundAt = isoNow(now);
  const diagnostics = buildMindReplyDiagnostics({ reply, timedOut: false }, objective, runId);
  try {
    const { text } = normalizeMindReply({ reply, timedOut: false });
    const parsed = parseMindBriefing(text);
    const completedAt = isoNow();
    const briefing = buildBriefing({ runId, objective, status, mindBriefing: parsed, mindReplyText: text, completedAt });
    await redis.set(`greenroom:briefing:${runId}`, JSON.stringify(briefing));
    await redis.set("greenroom:latest_briefing", JSON.stringify(briefing));
    await persistRunStatus(redis, runId, { ...status, status: "COMPLETED", completed_at: completedAt, briefing_id: runId, provenance: briefing.provenance, reply_diagnostics: diagnostics, reply_metadata: extractSafeSdkMetadata(reply), stage_timestamps: stages(status, { verified_reply_found: replyFoundAt, parsing_completed: completedAt, briefing_persisted: completedAt }) });
    return { httpStatus: 200, body: { status: "COMPLETED", run_id: runId, briefing } };
  } catch (error) {
    const failedAt = isoNow();
    await persistRunStatus(redis, runId, { ...status, status: "FAILED", completed_at: failedAt, error: error.message || String(error), reply_diagnostics: diagnostics, reply_metadata: extractSafeSdkMetadata(reply), stage_timestamps: stages(status, { verified_reply_found: replyFoundAt, terminal_failure: failedAt }) });
    return { httpStatus: 200, body: { status: "FAILED", run_id: runId, error: error.message || String(error) } };
  }
}

export async function processWorkerPhase(args) { return args.phase === "collect" ? handleCollection(args) : handleSubmission(args); }

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const rawBody = await getRawBody(req);
  const missing = validateWorkerConfiguration(process.env);
  if (missing.length) return res.status(503).json({ error: `Production worker configuration missing: ${missing.join(", ")}` });
  const receiver = new Receiver({ currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY, nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY });
  const signature = req.headers["upstash-signature"];
  if (!signature) return res.status(401).json({ error: "Unauthorized: Missing QStash signature" });
  const host = req.headers["x-forwarded-host"] || req.headers.host || "greenroom-ruby.vercel.app";
  const proto = req.headers["x-forwarded-proto"] || "https";
  const targetUrl = `${proto}://${host}/api/briefing-worker`;
  let valid = await receiver.verify({ signature, body: rawBody, url: targetUrl }).catch(() => false);
  if (!valid) valid = await receiver.verify({ signature, body: rawBody }).catch(() => false);
  if (!valid) return res.status(401).json({ error: "Unauthorized: Invalid QStash signature" });
  let payload;
  try { payload = JSON.parse(rawBody || "{}"); } catch { return res.status(400).json({ error: "Invalid JSON payload" }); }
  if (!payload.run_id) return res.status(422).json({ error: "QStash payload run_id missing" });
  let objective;
  try { objective = validateObjectiveSnapshot(payload.objective); }
  catch (error) { return res.status(422).json({ status: "failed", run_id: payload.run_id, error: error.message }); }
  const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN });
  const mindsClient = createMindsClient({ builderApiKey: process.env.MINDS_BUILDER_API_KEY });
  try {
    const result = await processWorkerPhase({ phase: payload.phase || "submit", redis, mindsClient, runId: payload.run_id, objective, targetUrl, env: process.env });
    return res.status(result.httpStatus).json(result.body);
  } catch (error) {
    const current = await loadRunStatus(redis, payload.run_id).catch(() => ({}));
    // Once a message is durably WAITING, transient history/QStash failures must be
    // retried by QStash and must not turn the run into a terminal failure.
    if (!isTerminalRunStatus(current.status) && current.status !== "WAITING_FOR_MINDS") {
      const failedAt = isoNow();
      await persistRunStatus(redis, payload.run_id, { ...current, run_id: payload.run_id, status: "FAILED", completed_at: failedAt, objective_snapshot: objective, error: error.message || String(error), stage_timestamps: stages(current, { terminal_failure: failedAt }) }).catch(() => {});
    }
    console.error(`[NodeWorker] ${payload.phase || "submit"} error for ${payload.run_id}:`, error);
    return res.status(500).json({ status: "failed", run_id: payload.run_id, error: error.message || String(error) });
  }
}
