import crypto from "node:crypto";
import { createMindsClient, isReplyHistoryRow } from "@animocabrands/minds-client-lib";
import { Receiver } from "@upstash/qstash";
import { Redis } from "@upstash/redis";
import { buildMindsPrompt, buildMindReplyDiagnostics, classifyObjectiveSignals, collectionDeadlinePassed, collectionDelaySeconds, extractSafeSdkMetadata, isTerminalRunStatus, normalizeMindReply, parseMindBriefing, resolveIdempotentBriefing, selectRelevantCreatorContext, selectVerifiedHistoryReply, updateRecentRunIndex, validateObjectiveSnapshot, validateWorkerConfiguration, verifyMindIdentity } from "./worker-guards.mjs";
import { buildDeterministicLiveBriefing, retrieveLiveEvidenceForObjective } from "./live-evidence.mjs";

export const maxDuration = 60;
export const config = { api: { bodyParser: false } };
const MIND_ID = "8208493e-f36b-1410-8466-00039ce7df11";
const DECISION_SKILL_ID = "5483513E-F36B-1410-8466-00039CE7DF11";
const DEFAULT_REPLY_DEADLINE_MS = 10 * 60 * 1000;
const MINDS_SSE_WAIT_MS = 15_000;
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
const QSTASH_FALLBACK_HOSTS = [
  "qstash-us-east-1.upstash.io",
  "qstash-us-west-1.upstash.io",
  "qstash-eu-west-1.upstash.io",
  "qstash.upstash.io",
];
function qstashPublishHosts(env) {
  let primary = "qstash.upstash.io";
  if (env.QSTASH_URL) {
    try { primary = new URL(env.QSTASH_URL).host || primary; }
    catch { primary = env.QSTASH_URL.replace(/^https?:\/\//, "").split("/")[0] || primary; }
  }
  return [primary, ...QSTASH_FALLBACK_HOSTS.filter((host) => host !== primary)];
}
export async function scheduleCollection(targetUrl, payload, env = process.env, delaySeconds = 15, fetchImpl = fetch) {
  if (!env.QSTASH_TOKEN) throw new Error("QSTASH_TOKEN is required to schedule Minds collection");
  let lastRegionMismatch = null;
  for (const host of qstashPublishHosts(env)) {
    const response = await fetchImpl(`https://${host}/v2/publish/${targetUrl}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.QSTASH_TOKEN}`, "Content-Type": "application/json", "Upstash-Delay": `${Math.max(5, delaySeconds)}s`, "Upstash-Retries": "2" },
      body: JSON.stringify({ ...payload, phase: "collect" }),
    });
    const text = await response.text();
    if (response.ok) {
      return { ...extractSafeSdkMetadata(parseStored(text)), host, http_status: response.status };
    }
    const regionMismatch = response.status === 404 && text.toLowerCase().includes("not found in this region");
    if (!regionMismatch) throw new Error(`QStash collection scheduling failed with HTTP ${response.status} on ${host}`);
    lastRegionMismatch = new Error(`QStash collection scheduling failed with regional HTTP 404 on ${host}`);
  }
  throw lastRegionMismatch || new Error("QStash collection scheduling failed without a supported host");
}
function stages(status, values) { return { ...(status.stage_timestamps || {}), ...values }; }
function safeScheduleError(error) {
  return String(error?.message || error || "Unknown QStash scheduling error")
    .slice(0, 240)
    .replace(/(bearer|authorization|token|api[-_ ]?key)\s*[:=]\s*\S+/gi, "$1=[REDACTED]");
}
async function enqueueCollectionWithTelemetry({ redis, runId, status, targetUrl, payload, env, delaySeconds, enqueue }) {
  const attemptedAt = isoNow();
  const attemptNumber = (status.collection_schedule_attempt || 0) + 1;
  const diagnostic = { attempt: attemptNumber, attempted_at: attemptedAt, delay_seconds: delaySeconds, target_host: new URL(targetUrl).host };
  status = await persistRunStatus(redis, runId, {
    ...status,
    collection_schedule_attempt: attemptNumber,
    last_collection_schedule: { ...diagnostic, outcome: "PUBLISHING" },
  });
  try {
    const metadata = await enqueue(targetUrl, payload, env, delaySeconds);
    status = await persistRunStatus(redis, runId, {
      ...status,
      next_collection_delay_seconds: delaySeconds,
      collection_schedule_metadata: metadata,
      last_collection_schedule: { ...diagnostic, outcome: "PUBLISHED", published_at: isoNow() },
    });
    return status;
  } catch (error) {
    await persistRunStatus(redis, runId, {
      ...status,
      last_collection_schedule: { ...diagnostic, outcome: "FAILED", failed_at: isoNow(), error: safeScheduleError(error) },
    });
    throw error;
  }
}

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
    if (status.status === "WAITING_FOR_MINDS") {
      const delaySeconds = collectionDelaySeconds(status.submitted_at, now);
      await enqueueCollectionWithTelemetry({ redis, runId, status, targetUrl, payload: { run_id: runId, objective }, env, delaySeconds, enqueue });
    }
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
  const memorySelection = selectRelevantCreatorContext(objective, creatorProfile, classification.signals);
  const prompt = buildMindsPrompt(objective, creatorProfile, classification.signals, memorySelection);
  const preparedAt = isoNow();
  status = await persistRunStatus(redis, runId, { ...status, conversation_alias: alias, conversation_metadata: extractSafeSdkMetadata(conversation), pre_send_fingerprint: beforeFingerprint || null, submitted_prompt_hash: hashText(prompt), signal_classification: classification.provenance, memory_selection: { ...memorySelection.provenance, compact_prompt_character_count: prompt.length }, signals_reviewed_count: classification.signals.length, memory_nodes_used_count: memorySelection.provenance.selected_memory_node_count, learned_rules_snapshot: memorySelection.context.learned_rules, stage_timestamps: stages(status, { submission_prepared: preparedAt }) });
  const sendResult = await mindsClient.sendMessage({ alias, messageText: prompt });
  const submittedAt = isoNow();
  const deadlineMs = Number.parseInt(env.MINDS_REPLY_DEADLINE_MS || String(DEFAULT_REPLY_DEADLINE_MS), 10);
  const replyDeadlineAt = new Date(Date.parse(submittedAt) + deadlineMs).toISOString();
  status = await persistRunStatus(redis, runId, { ...status, status: "WAITING_FOR_MINDS", submitted_at: submittedAt, reply_deadline_at: replyDeadlineAt, collection_attempt: 0, message_metadata: extractSafeSdkMetadata(sendResult), stage_timestamps: stages(status, { message_submitted: submittedAt, waiting_began: submittedAt }) });
  const delaySeconds = collectionDelaySeconds(submittedAt, new Date(submittedAt));
  await enqueueCollectionWithTelemetry({ redis, runId, status, targetUrl, payload: { run_id: runId, objective }, env, delaySeconds, enqueue });
  return { httpStatus: 202, body: { status: "WAITING_FOR_MINDS", run_id: runId, submitted_at: submittedAt, reply_deadline_at: replyDeadlineAt } };
}

export function cleanParsedSection(text) {
  if (typeof text !== "string") return "";
  return text
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\s*\/?\s*b\s*>/gi, "")
    .replace(/<\s*\/?\s*(?:strong|em|i|p|div|span)\b[^>]*>/gi, "")
    .replace(/<\s*\/?\s*(?:b|br|strong|em|i|p|div|span)\b[^>]*$/gi, "")
    .replace(/^(?:[:\s\-*#]|<\/?b>)+|(?:[:\s\-*#]|<\/?b>)+$/gi, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function parseMindPlainResponse(text) {
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Animoca Mind briefing response was empty");
  }
  const attentionMatch = text.match(/ATTENTION\s*:?\s*([A-Z][A-Z_ ]*)/i);
  const attentionVerdict = attentionMatch?.[1]?.trim().replace(/\s+/g, "_").toUpperCase();
  const allowedVerdicts = new Set(["ACT_NOW", "KEEP_WATCHING", "IGNORE_FOR_NOW"]);
  if (!attentionVerdict || !allowedVerdicts.has(attentionVerdict)) {
    throw new Error("Animoca Mind attention verdict was missing or invalid");
  }
  const whyMatch = text.match(/WHY\s+IT\s+MATTERS[\s\S]*?(?=WHAT\s+TO\s+DO\s+NEXT|$)/i);
  const whatMatch = text.match(/WHAT\s+TO\s+DO\s+NEXT[\s\S]*$/i);
  
  let whyItMatters = "";
  if (whyMatch) {
    whyItMatters = cleanParsedSection(
      whyMatch[0]
        .replace(/WHY\s+IT\s+MATTERS/i, "")
    );
  }
  
  let whatToDoNext = "";
  if (whatMatch) {
    whatToDoNext = cleanParsedSection(
      whatMatch[0]
        .replace(/WHAT\s+TO\s+DO\s+NEXT/i, "")
    );
  }
  
  if (!whyItMatters || !whatToDoNext) {
    throw new Error("Animoca Mind attention decision sections were missing or invalid");
  }
  
  return {
    attention_verdict: attentionVerdict,
    why_it_matters: whyItMatters,
    what_to_do_next: whatToDoNext
  };
}

function buildMindsNativeBriefing({ runId, objective, status, attentionVerdict, parsedWhyItMatters, parsedWhatToDoNext, mindReplyText, completedAt, evidence }) {
  const selectedRules = status.learned_rules_snapshot || [];
  const selectedNodes = status.selected_memory?.memory_nodes || [];
  const item = {
    id: "live_001",
    priority: "REVIEW",
    status: "NEW",
    title: evidence.title,
    category: "live_creator_evidence",
    what_changed: `${evidence.source} published this update: ${evidence.summary}`,
    why_it_matters: parsedWhyItMatters,
    recommended_action: parsedWhatToDoNext,
    memory_context_used: selectedRules[0] || null,
    source: evidence.source,
    source_url: evidence.source_url,
    published_at: evidence.published_at,
  };
  const provenance = {
    run_id: runId,
    objective_id: objective.objective_id,
    objective_fingerprint: objective.fingerprint,
    created_at: status.started_at,
    completed_at: completedAt,
    status: "COMPLETED",
    evidence_mode: "LIVE",
    attention_verdict: attentionVerdict,
    signal_source: evidence.source,
    decision_engine: "MINDS_NATIVE_DECISION",
    analysis_status: "AVAILABLE",
    minds_verified: true,
    minds_involved: true,
    persistence_mode: "DURABLE",
    execution_mode: "QSTASH_BACKGROUND_JOB",
  };
  return {
    run_id: runId,
    objective_id: objective.objective_id,
    objective_snapshot: objective,
    timestamp: completedAt,
    last_run_formatted: new Date(completedAt).toUTCString(),
    signals_reviewed_count: 1,
    opportunities_found_count: 1,
    memory_nodes_used_count: selectedNodes.length,
    signal_source_label: "LIVE EVIDENCE",
    evidence_mode: "LIVE",
    attention_verdict: attentionVerdict,
    decision_engine: provenance.decision_engine,
    analysis_provider: "Animoca Minds via GreenRoom Decision Skill",
    minds_status: "COMPLETED",
    minds_verified: true,
    persistence_mode: "DURABLE",
    execution_mode: "QSTASH_BACKGROUND_JOB",
    continuity_note: selectedRules.length ? `Selected persistent preference: "${selectedRules[0]}".` : null,
    provenance: {
      ...provenance,
      decision_skill_id: DECISION_SKILL_ID,
      decision_skill_invocation: "REQUESTED_IN_VERIFIED_PROMPT",
    },
    sources: [evidence],
    items: [item],
    learned_rules_active: selectedRules,
    mind_raw_reply: mindReplyText
  };
}

async function handleLiveSubmission({ redis, mindsClient, runId, objective, targetUrl, env, now = new Date(), fetchEvidence = retrieveLiveEvidenceForObjective, enqueue = scheduleCollection }) {
  let status = await loadRunStatus(redis, runId);
  assertMatchingRun(status, runId, objective);
  if (isTerminalRunStatus(status.status)) {
    const briefing = status.status === "COMPLETED"
      ? parseStored(await redis.get(`greenroom:briefing:${runId}`), null)
      : null;
    return { httpStatus: 200, body: { status: status.status, run_id: runId, briefing, idempotent_replay: true } };
  }
  if (status.status === "WAITING_FOR_MINDS") {
    return { httpStatus: 202, body: { status: "WAITING_FOR_MINDS", run_id: runId, idempotent_replay: true } };
  }

  const claim = await redis.set(`greenroom:live_claim:${runId}`, isoNow(now), { nx: true, ex: 24 * 60 * 60 });
  if (claim === null) {
    status = await loadRunStatus(redis, runId);
    return { httpStatus: 202, body: { status: status.status || "WORKING", run_id: runId, idempotent_replay: true } };
  }

  const startedAt = isoNow(now);
  status = await persistRunStatus(redis, runId, {
    ...status,
    run_id: runId,
    status: "WORKING",
    started_at: status.started_at || startedAt,
    objective_snapshot: objective,
    evidence_mode: "LIVE",
    decision_engine: "MINDS_NATIVE_DECISION",
    minds_verified: false,
    stage_timestamps: stages(status, { live_retrieval_started: startedAt }),
  });

  const creatorProfile = parseStored(await redis.get("greenroom:creator_profile"), { learned_voice_rules: [], memory_nodes: [] });
  let retrieval;
  try {
    retrieval = await fetchEvidence({ objective, now });
  } catch (error) {
    const failedAt = isoNow();
    const code = typeof error?.code === "string" ? error.code : "SOURCE_UNAVAILABLE";
    const safeMessage = code === "SOURCE_TIMEOUT"
      ? "Live evidence source timed out"
      : code === "MALFORMED_SOURCE"
        ? "Live evidence source returned malformed data"
        : "Live evidence source is unavailable";
    await persistRunStatus(redis, runId, {
      ...status,
      status: "FAILED",
      completed_at: failedAt,
      error: safeMessage,
      failure_code: code,
      evidence_mode: "LIVE",
      decision_engine: "MINDS_NATIVE_DECISION",
      minds_verified: false,
      stage_timestamps: stages(status, { terminal_failure: failedAt }),
    });
    return { httpStatus: 200, body: { status: "FAILED", run_id: runId, error: safeMessage } };
  }
  const retrievalCompletedAt = isoNow();
  if (!retrieval.evidence.length) {
    const terminalStatus = retrieval.status === "UNSUPPORTED_DOMAIN" ? "UNSUPPORTED_DOMAIN" : "NO_RELEVANT_UPDATE";
    const terminal = await persistRunStatus(redis, runId, {
      ...status,
      status: terminalStatus,
      completed_at: retrievalCompletedAt,
      evidence_mode: "LIVE",
      decision_engine: "MINDS_NATIVE_DECISION",
      minds_verified: false,
      evidence_retrieval: {
        domain: retrieval.domain || null,
        provider_ids: retrieval.provider_ids || [],
        candidate_count: retrieval.candidate_count,
        relevant_count: 0,
        retrieval_latency_ms: retrieval.retrieval_latency_ms,
        retrieved_at: retrieval.retrieved_at,
      },
      stage_timestamps: stages(status, { live_retrieval_completed: retrievalCompletedAt, [terminalStatus === "UNSUPPORTED_DOMAIN" ? "unsupported_domain" : "no_relevant_update"]: retrievalCompletedAt }),
    });
    return { httpStatus: 200, body: { status: terminal.status, run_id: runId } };
  }

  const evidence = retrieval.evidence[0];
  const memorySelection = selectRelevantCreatorContext(objective, creatorProfile, [evidence]);
  
  if (!mindsClient) {
    const failedAt = isoNow();
    const errorMsg = "Production Mode Error: Mind has no active Animoca Minds Builder API client. Set MINDS_BUILDER_API_KEY in your environment or pass DEMO_MODE=true for local testing.";
    await persistRunStatus(redis, runId, {
      ...status,
      status: "FAILED",
      completed_at: failedAt,
      error: errorMsg,
      evidence_snapshot: evidence,
      selected_memory: memorySelection.context,
      stage_timestamps: stages(status, { terminal_failure: failedAt }),
    });
    return { httpStatus: 200, body: { status: "FAILED", run_id: runId, error: errorMsg } };
  }

  const alias = `greenroom-${runId}`;
  let conversation;
  let beforeFingerprint;
  try {
    conversation = await mindsClient.ensureConversation(alias, MIND_ID);
    beforeFingerprint = await mindsClient.getLatestHistoryFingerprint(alias);
  } catch (error) {
    const failedAt = isoNow();
    const errorMsg = `Animoca Minds Builder connection failed: ${error.message || String(error)}`;
    await persistRunStatus(redis, runId, {
      ...status,
      status: "FAILED",
      completed_at: failedAt,
      error: errorMsg,
      evidence_snapshot: evidence,
      selected_memory: memorySelection.context,
      stage_timestamps: stages(status, { terminal_failure: failedAt }),
    });
    return { httpStatus: 200, body: { status: "FAILED", run_id: runId, error: errorMsg } };
  }

  const cleanPref = memorySelection.context.learned_rules && memorySelection.context.learned_rules.length > 0
    ? memorySelection.context.learned_rules.slice(0, 2).join("\n")
    : "None";

  const prompt = `OBJECTIVE:
${objective.title}

RELEVANT CREATOR PREFERENCES:
${cleanPref}

VERIFIED UPDATE:
${evidence.title}
(${evidence.source}: ${evidence.source_url})
${evidence.summary}

Instruction: Use the GreenRoom Decision Skill.
Return only in English:
ATTENTION: ACT_NOW | KEEP_WATCHING | IGNORE_FOR_NOW
WHY IT MATTERS
[1-3 short sentences explaining the creator-specific relevance]
WHAT TO DO NEXT
[one short practical action sentence]
Choose exactly one ATTENTION value using the supplied objective, relevant preferences, and verified update. Do not use a fixed domain, provider, or keyword mapping. ACT_NOW requires a justified concrete action now. KEEP_WATCHING means potentially relevant but unresolved, premature, uncertain, unavailable, or not yet actionable. IGNORE_FOR_NOW means the verified update is currently low-value for this creator; it does not mean the source is bad.
Use only the supplied objective, preferences, and verified update. Do not add unsupported pricing, availability, eligibility, country, creator status, audience size, popularity, performance, subscriptions, workflow facts, or use cases. If a relevant preference cannot be evaluated from the verified update, state that uncertainty naturally. Do not return HTML or Markdown. Do not chain multiple actions.`;

  const preparedAt = isoNow();
  status = await persistRunStatus(redis, runId, {
    ...status,
    conversation_alias: alias,
    conversation_metadata: extractSafeSdkMetadata(conversation),
    pre_send_fingerprint: beforeFingerprint || null,
    submitted_prompt_hash: hashText(prompt),
    evidence_snapshot: evidence,
    selected_memory: memorySelection.context,
    learned_rules_snapshot: memorySelection.context.learned_rules,
    memory_selection: memorySelection.provenance,
    decision_skill: { id: DECISION_SKILL_ID, name: "GreenRoom Decision Skill", invocation: "REQUESTED_IN_VERIFIED_PROMPT" },
    stage_timestamps: stages(status, { submission_prepared: preparedAt }),
  });

  let sendResult;
  try {
    sendResult = await mindsClient.sendMessage({ alias, messageText: prompt });
  } catch (error) {
    const failedAt = isoNow();
    const errorMsg = `Animoca Minds Builder sendMessage failed: ${error.message || String(error)}`;
    await persistRunStatus(redis, runId, {
      ...status,
      status: "FAILED",
      completed_at: failedAt,
      error: errorMsg,
      stage_timestamps: stages(status, { terminal_failure: failedAt }),
    });
    return { httpStatus: 200, body: { status: "FAILED", run_id: runId, error: errorMsg } };
  }

  const submittedAt = isoNow();
  const deadlineMs = Number.parseInt(env.MINDS_REPLY_DEADLINE_MS || String(DEFAULT_REPLY_DEADLINE_MS), 10);
  const replyDeadlineAt = new Date(Date.parse(submittedAt) + deadlineMs).toISOString();

  status = await persistRunStatus(redis, runId, {
    ...status,
    status: "WAITING_FOR_MINDS",
    submitted_at: submittedAt,
    reply_deadline_at: replyDeadlineAt,
    collection_attempt: 0,
    message_metadata: extractSafeSdkMetadata(sendResult),
    stage_timestamps: stages(status, { message_submitted: submittedAt, waiting_began: submittedAt }),
  });

  const delaySeconds = collectionDelaySeconds(submittedAt, new Date(submittedAt));
  await enqueueCollectionWithTelemetry({ redis, runId, status, targetUrl, payload: { run_id: runId, objective }, env, delaySeconds, enqueue });
  
  return { httpStatus: 202, body: { status: "WAITING_FOR_MINDS", run_id: runId, submitted_at: submittedAt, reply_deadline_at: replyDeadlineAt } };
}

async function handleCollection({ redis, mindsClient, runId, objective, targetUrl, env, now = new Date(), enqueue = scheduleCollection }) {
  let status = await loadRunStatus(redis, runId);
  assertMatchingRun(status, runId, objective);
  if (isTerminalRunStatus(status.status)) return { httpStatus: 200, body: { status: status.status, run_id: runId, idempotent_replay: true } };
  if (status.status !== "WAITING_FOR_MINDS") return { httpStatus: 202, body: { status: status.status, run_id: runId, collection_skipped: true } };
  
  if (collectionDeadlinePassed(status.reply_deadline_at, now)) {
    const failedAt = isoNow(now);
    const failed = {
      ...status,
      status: "FAILED",
      completed_at: failedAt,
      error: "Minds personalized interpretation is temporarily unavailable.",
      minds_status: "DELAYED/UNAVAILABLE",
      minds_verified: false,
      reply_diagnostics: buildMindReplyDiagnostics({ timedOut: true }, objective, runId),
      stage_timestamps: stages(status, { terminal_failure: failedAt })
    };
    await persistRunStatus(redis, runId, failed);
    return { httpStatus: 200, body: { status: "FAILED", run_id: runId, error: failed.error } };
  }
  
  const attemptAt = isoNow(now);
  const attempt = (status.collection_attempt || 0) + 1;
  const claim = await redis.set(`greenroom:collection_claim:${runId}:${attempt}`, attemptAt, { nx: true, ex: 5 * 60 });
  if (claim === null) return { httpStatus: 202, body: { status: "WAITING_FOR_MINDS", run_id: runId, collection_attempt: attempt, idempotent_replay: true } };
  
  const remainingMs = Math.max(0, Date.parse(status.reply_deadline_at) - now.getTime());
  const sseTimeoutMs = Math.min(MINDS_SSE_WAIT_MS, remainingMs);
  status = await persistRunStatus(redis, runId, {
    ...status,
    collection_attempt: attempt,
    collection_attempt_timestamps: [...(status.collection_attempt_timestamps || []), attemptAt].slice(-50),
    last_collection_transport: { attempt, collection_started_at: attemptAt, transport_attempted: "sse", sse_wait_timeout_ms: sseTimeoutMs, sse_result: "WAITING", history_fallback_attempted: false },
    stage_timestamps: stages(status, { last_collection_attempt: attemptAt }),
  });
  
  let reply = null;
  let replySource = null;
  let sseResult = "timeout";
  let sseErrorType = null;
  const sseStartedAt = isoNow();
  const sseStartedMs = Date.now();
  try {
    const outcome = await mindsClient.waitForReply({ alias: status.conversation_alias, timeoutMs: sseTimeoutMs, afterFingerprint: status.pre_send_fingerprint || undefined });
    const candidate = outcome?.reply
      ? selectVerifiedHistoryReply([outcome.reply], { alias: status.conversation_alias, afterFingerprint: status.pre_send_fingerprint || undefined, submittedPromptHash: status.submitted_prompt_hash, hashText }, isReplyHistoryRow)
      : null;
    if (candidate) {
      reply = candidate;
      replySource = "sse";
      sseResult = "verified_reply";
    } else if (outcome?.reply) {
      sseResult = "rejected_candidate";
    }
  } catch (error) {
    sseResult = "sdk_error";
    sseErrorType = String(error?.name || "Error").slice(0, 80);
  }
  
  const sseWaitDurationMs = Math.max(0, Date.now() - sseStartedMs);
  let rows = [];
  const historyFallbackAttempted = !reply;
  const historyCheckedAt = historyFallbackAttempted ? isoNow() : null;
  if (!reply) {
    rows = await mindsClient.getHistory(status.conversation_alias, { limit: 50 });
    reply = selectVerifiedHistoryReply(rows, { alias: status.conversation_alias, afterFingerprint: status.pre_send_fingerprint || undefined, submittedPromptHash: status.submitted_prompt_hash, hashText }, isReplyHistoryRow);
    if (reply) replySource = "history";
  }
  
  status = await persistRunStatus(redis, runId, {
    ...status,
    last_collection_transport: {
      attempt,
      collection_started_at: attemptAt,
      transport_attempted: "sse",
      sse_wait_timeout_ms: sseTimeoutMs,
      sse_wait_started_at: sseStartedAt,
      sse_wait_duration_ms: sseWaitDurationMs,
      sse_result: sseResult,
      ...(sseErrorType ? { sse_error_type: sseErrorType } : {}),
      history_fallback_attempted: historyFallbackAttempted,
      history_checked_at: historyCheckedAt,
      history_row_count: Array.isArray(rows) ? rows.length : 0,
      verified_reply_found_at: reply ? isoNow() : null,
      reply_source: replySource,
    },
    ...(historyFallbackAttempted ? {
      last_history_observation: {
        checked_at: historyCheckedAt,
        row_count: Array.isArray(rows) ? rows.length : 0,
        fingerprints: Array.isArray(rows) ? rows.map((row) => row?.fingerprint).filter((value) => typeof value === "string").slice(0, 5) : [],
        sender_types: Array.isArray(rows) ? [...new Set(rows.map((row) => row?.senderType).filter((value) => Number.isInteger(value)))] : [],
      },
    } : {}),
  });
  
  if (!reply) {
    const afterTransport = new Date(now.getTime() + sseWaitDurationMs);
    if (collectionDeadlinePassed(status.reply_deadline_at, afterTransport)) {
      const failedAt = isoNow(afterTransport);
      const failed = {
        ...status,
        status: "FAILED",
        completed_at: failedAt,
        error: "Minds personalized interpretation is temporarily unavailable.",
        minds_status: "DELAYED/UNAVAILABLE",
        minds_verified: false,
        reply_diagnostics: buildMindReplyDiagnostics({ timedOut: true }, objective, runId),
        stage_timestamps: stages(status, { terminal_failure: failedAt })
      };
      await persistRunStatus(redis, runId, failed);
      return { httpStatus: 200, body: { status: "FAILED", run_id: runId, error: failed.error } };
    }
    const delaySeconds = collectionDelaySeconds(status.submitted_at, afterTransport);
    await enqueueCollectionWithTelemetry({ redis, runId, status, targetUrl, payload: { run_id: runId, objective }, env, delaySeconds, enqueue });
    return { httpStatus: 202, body: { status: "WAITING_FOR_MINDS", run_id: runId, collection_attempt: attempt, next_collection_delay_seconds: delaySeconds } };
  }
  
  const replyFoundAt = status.last_collection_transport.verified_reply_found_at;
  const diagnostics = buildMindReplyDiagnostics({ reply, timedOut: false }, objective, runId);
  try {
    const { text } = normalizeMindReply({ reply, timedOut: false });
    const completedAt = isoNow();
    
    let briefing;
    if (status.decision_engine === "MINDS_NATIVE_DECISION") {
      const parsedPlain = parseMindPlainResponse(text);
      briefing = buildMindsNativeBriefing({
        runId,
        objective,
        status,
        attentionVerdict: parsedPlain.attention_verdict,
        parsedWhyItMatters: parsedPlain.why_it_matters,
        parsedWhatToDoNext: parsedPlain.what_to_do_next,
        mindReplyText: text,
        completedAt,
        evidence: status.evidence_snapshot
      });
    } else {
      const parsed = parseMindBriefing(text);
      briefing = buildBriefing({ runId, objective, status, mindBriefing: parsed, mindReplyText: text, completedAt });
    }
    
    await redis.set(`greenroom:briefing:${runId}`, JSON.stringify(briefing));
    await redis.set("greenroom:latest_briefing", JSON.stringify(briefing));
    await persistRunStatus(redis, runId, { ...status, status: "COMPLETED", completed_at: completedAt, briefing_id: runId, provenance: briefing.provenance, reply_diagnostics: diagnostics, reply_metadata: extractSafeSdkMetadata(reply), submission_to_verified_reply_ms: Math.max(0, Date.parse(replyFoundAt) - Date.parse(status.submitted_at)), submission_to_completion_ms: Math.max(0, Date.parse(completedAt) - Date.parse(status.submitted_at)), stage_timestamps: stages(status, { verified_reply_found: replyFoundAt, parsing_started: replyFoundAt, parsing_completed: completedAt, briefing_persisted: completedAt }) });
    return { httpStatus: 200, body: { status: "COMPLETED", run_id: runId, briefing } };
  } catch (error) {
    const failedAt = isoNow();
    await persistRunStatus(redis, runId, { ...status, status: "FAILED", completed_at: failedAt, error: error.message || String(error), reply_diagnostics: diagnostics, reply_metadata: extractSafeSdkMetadata(reply), stage_timestamps: stages(status, { verified_reply_found: replyFoundAt, terminal_failure: failedAt }) });
    return { httpStatus: 200, body: { status: "FAILED", run_id: runId, error: error.message || String(error) } };
  }
}

export async function processWorkerPhase(args) {
  if (args.phase === "collect") return handleCollection(args);
  // Explicit diagnostic compatibility only. Production never supplies this flag.
  if (args.executionPath === "legacy_minds") return handleSubmission(args);
  return handleLiveSubmission(args);
}

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
  const mindsClient = process.env.MINDS_BUILDER_API_KEY
    ? createMindsClient({ builderApiKey: process.env.MINDS_BUILDER_API_KEY })
    : null;
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
