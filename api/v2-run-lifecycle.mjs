import crypto from "node:crypto";
import { V2_DECISION_VERSION, V2_MIND_IDENTITY } from "./v2-decision.mjs";

export const V2_RUN_RECORD_VERSION = "greenroom_v2_run_v1";
const RUN_PREFIX = "greenroom:v2_run:";

function required(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required`);
  return value.trim();
}

function requireStore(redis) {
  if (!redis || typeof redis.set !== "function" || typeof redis.get !== "function") {
    throw new Error("V2 run lifecycle requires a Redis-compatible store");
  }
}

function safeMemorySummary(value = {}) {
  return Object.freeze({
    availability: typeof value.availability === "string" ? value.availability : null,
    memory_selection_version: typeof value.memory_selection_version === "string" ? value.memory_selection_version : null,
    selected_rule_count: Array.isArray(value.selected_rule_ids) ? value.selected_rule_ids.length : Array.isArray(value.selected_rule_hashes) ? value.selected_rule_hashes.length : 0,
    selected_node_count: Array.isArray(value.selected_node_ids) ? value.selected_node_ids.length : Array.isArray(value.selected_memory_node_ids) ? value.selected_memory_node_ids.length : 0,
  });
}

function safeTransportMetadata(value = {}) {
  return Object.freeze({
    transport: typeof value.transport === "string" ? value.transport : null,
    event_count: Number.isInteger(value.event_count) && value.event_count >= 0 ? value.event_count : null,
    sdk_acknowledgement_present: typeof value.sdk_acknowledgement_present === "boolean" ? value.sdk_acknowledgement_present : null,
  });
}

function update(record, changes, timestamp) {
  return Object.freeze({ ...record, ...changes, updated_at: required(timestamp, "transition timestamp") });
}

export function createV2RunId() {
  return `run_v2_${crypto.randomUUID().replaceAll("-", "")}`;
}

export function v2RunKey(runId) {
  return `${RUN_PREFIX}${required(runId, "runId")}`;
}

export function buildPreparedV2RunRecord({
  runId,
  createdAt,
  creatorContextVersion,
  promptHash,
  analyticsImportHash,
  signalSelection,
  memoryProvenance = {},
  externalEvidence,
  verifiedMindIdentity = V2_MIND_IDENTITY,
}) {
  const selectedSignals = Array.isArray(signalSelection?.selected_signals) ? signalSelection.selected_signals : [];
  if (verifiedMindIdentity?.mind_id !== V2_MIND_IDENTITY.mind_id || verifiedMindIdentity?.email !== V2_MIND_IDENTITY.email) {
    throw new Error("V2 run record Mind reference does not match verified Udophia");
  }
  return Object.freeze({
    run_record_version: V2_RUN_RECORD_VERSION,
    run_id: required(runId, "runId"),
    created_at: required(createdAt, "createdAt"),
    updated_at: required(createdAt, "createdAt"),
    creator_context_version: required(creatorContextVersion, "creatorContextVersion"),
    prompt_hash: required(promptHash, "promptHash"),
    analytics_import_hash: required(analyticsImportHash, "analyticsImportHash"),
    selected_signal_ids: Object.freeze(selectedSignals.map((signal) => required(signal.signal_id, "selected signal ID"))),
    signal_calculation_versions: Object.freeze(Object.fromEntries(selectedSignals.map((signal) => [signal.signal_id, required(signal.threshold_version, "signal calculation version")]))),
    memory_provenance_summary: safeMemorySummary(memoryProvenance),
    external_evidence_fingerprint: required(externalEvidence?.fingerprint || externalEvidence?.content_fingerprint, "external evidence fingerprint"),
    external_provider: required(externalEvidence?.provider_id || externalEvidence?.source, "external provider"),
    verified_mind_identity_reference: Object.freeze({ mind_id: V2_MIND_IDENTITY.mind_id, email: V2_MIND_IDENTITY.email }),
    contract_version: V2_DECISION_VERSION,
    submission_status: "PREPARED",
    reply_status: "NOT_STARTED",
    parser_status: "NOT_STARTED",
    decision_status: "NOT_PERSISTED",
    submitted_at: null,
    reply_received_at: null,
    timeout_seconds: null,
    timeout_timestamp: null,
    transport_metadata: safeTransportMetadata(),
    operational_error: null,
    visibility: "PRIVATE_OPERATIONAL_ONLY",
  });
}

async function persist(redis, record) {
  requireStore(redis);
  await redis.set(v2RunKey(record.run_id), JSON.stringify(record));
  return record;
}

export async function prepareV2Run(redis, input) {
  return persist(redis, buildPreparedV2RunRecord(input));
}

export async function loadV2Run(redis, runId) {
  requireStore(redis);
  const value = await redis.get(v2RunKey(runId));
  return typeof value === "string" ? JSON.parse(value) : value;
}

export async function markV2RunSubmitted(redis, record, { submittedAt, transportMetadata = {} }) {
  if (record.submission_status !== "PREPARED" || record.reply_status !== "NOT_STARTED") throw new Error("V2 run is not prepared for submission");
  return persist(redis, update(record, {
    submission_status: "SUBMITTED",
    reply_status: "WAITING",
    submitted_at: required(submittedAt, "submittedAt"),
    transport_metadata: safeTransportMetadata(transportMetadata),
  }, submittedAt));
}

export async function markV2RunReplyReceived(redis, record, { receivedAt, transportMetadata = {} }) {
  if (record.submission_status !== "SUBMITTED" || record.reply_status !== "WAITING") throw new Error("V2 run is not waiting for a reply");
  return persist(redis, update(record, {
    reply_status: "REPLY_RECEIVED",
    reply_received_at: required(receivedAt, "receivedAt"),
    transport_metadata: safeTransportMetadata(transportMetadata),
  }, receivedAt));
}

export async function markV2RunTimedOut(redis, record, { timeoutAt, timeoutSeconds, transportMetadata = {} }) {
  if (record.submission_status !== "SUBMITTED" || record.reply_status !== "WAITING") throw new Error("V2 run is not waiting and cannot time out");
  if (!Number.isFinite(timeoutSeconds) || timeoutSeconds <= 0) throw new Error("timeoutSeconds must be positive");
  return persist(redis, update(record, {
    reply_status: "TIMED_OUT",
    timeout_seconds: timeoutSeconds,
    timeout_timestamp: required(timeoutAt, "timeoutAt"),
    transport_metadata: safeTransportMetadata(transportMetadata),
    operational_error: "Minds SSE reply deadline elapsed without a reply.",
  }, timeoutAt));
}

export async function markV2RunTransportFailure(redis, record, { failedAt, replyStatus, transportMetadata = {} }) {
  if (record.submission_status !== "SUBMITTED" || record.reply_status !== "WAITING") throw new Error("V2 run is not waiting for transport");
  if (!new Set(["STREAM_CLOSED", "TRANSPORT_ERROR"]).has(replyStatus)) throw new Error("Unsupported V2 reply transport state");
  return persist(redis, update(record, {
    reply_status: replyStatus,
    transport_metadata: safeTransportMetadata(transportMetadata),
    operational_error: replyStatus === "STREAM_CLOSED" ? "Minds SSE stream closed before a reply." : "Minds SSE transport failed before a reply.",
  }, failedAt));
}

export async function markV2RunParserRejected(redis, record, rejectedAt) {
  if (record.reply_status !== "REPLY_RECEIVED") throw new Error("V2 run has no received reply to reject");
  return persist(redis, update(record, { parser_status: "REJECTED" }, rejectedAt));
}

export async function markV2RunDecisionPersisted(redis, record, persistedAt) {
  if (record.reply_status !== "REPLY_RECEIVED") throw new Error("V2 run has no received reply to persist");
  return persist(redis, update(record, { parser_status: "ACCEPTED", decision_status: "PERSISTED" }, persistedAt));
}
