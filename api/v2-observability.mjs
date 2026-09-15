export const V2_FAILURE_CATEGORIES = Object.freeze([
  "QUEUE_UNAVAILABLE", "WORKER_AUTH_FAILED", "RUN_NOT_FOUND", "ANALYTICS_NOT_FOUND", "ANALYTICS_INVALID",
  "CREATOR_CONTEXT_INVALID", "SIGNAL_COMPUTATION_FAILED", "EVIDENCE_UNAVAILABLE",
  "NO_RELEVANT_SIGNAL", "NO_RELEVANT_EVIDENCE",
  "MIND_CONFIGURATION_FAILED", "MIND_IDENTITY_FAILED", "MIND_SUBMISSION_FAILED",
  "MIND_TIMEOUT", "MIND_REPLY_INVALID", "DECISION_PARSE_REJECTED",
  "ACTION_QUALITY_REJECTED", "DECISION_PERSISTENCE_FAILED", "INTERNAL_EXECUTION_FAILED",
]);

export const V2_EXECUTION_STAGES = Object.freeze([
  "PREPARING", "QUEUEING", "WORKER_STARTED", "LOADING_ANALYTICS", "SELECTING_SIGNALS",
  "RETRIEVING_EVIDENCE", "VERIFYING_MIND", "SUBMITTING_MIND", "WAITING_FOR_REPLY",
  "VALIDATING_REPLY", "PERSISTING_DECISION", "COMPLETE",
]);

const categories = new Set(V2_FAILURE_CATEGORIES);
const stages = new Set(V2_EXECUTION_STAGES);
export function v2Failure(category, stage, cause = null) {
  const error = new Error(category);
  error.name = "V2ExecutionError";
  error.v2_category = categories.has(category) ? category : "INTERNAL_EXECUTION_FAILED";
  error.v2_stage = stages.has(stage) ? stage : "WORKER_STARTED";
  error.cause = cause || undefined;
  return error;
}

export function safeV2Failure(error, fallbackStage = "WORKER_STARTED") {
  return Object.freeze({
    category: categories.has(error?.v2_category) ? error.v2_category : "INTERNAL_EXECUTION_FAILED",
    stage: stages.has(error?.v2_stage) ? error.v2_stage : fallbackStage,
  });
}

export function safeQueueTelemetry(value = {}) {
  const primary = ["ACCEPTED", "FAILED", "NOT_ATTEMPTED"].includes(value.primary_result) ? value.primary_result : "NOT_ATTEMPTED";
  const fallback = ["ACCEPTED", "FAILED", "NOT_NEEDED", "NOT_ATTEMPTED"].includes(value.fallback_result) ? value.fallback_result : "NOT_ATTEMPTED";
  return Object.freeze({
    route: ["PRIMARY", "REGIONAL_FALLBACK", "NONE"].includes(value.route) ? value.route : "NONE",
    primary_result: primary,
    fallback_result: fallback,
    publication_accepted: value.publication_accepted === true,
    accepted_publication_count: value.publication_accepted === true ? 1 : 0,
  });
}

export function buildPrivateV2Diagnostic({ runId, error, stage, category, timestamp }) {
  return Object.freeze({
    diagnostic_version: "greenroom_v2_operational_diagnostic_v1",
    run_id: runId,
    timestamp,
    execution_stage: stages.has(stage) ? stage : "WORKER_STARTED",
    internal_code: categories.has(category) ? category : "INTERNAL_EXECUTION_FAILED",
    error_name: ["Error", "TypeError", "RangeError", "SyntaxError"].includes(error?.name) ? error.name : "Error",
    sanitized_message: categories.has(category) ? category : "INTERNAL_EXECUTION_FAILED",
    visibility: "PRIVATE_OPERATIONAL_ONLY",
  });
}

export function isV2TerminalFailure(record) {
  return ["FAILED", "REJECTED", "TIMED_OUT"].includes(record?.status);
}
