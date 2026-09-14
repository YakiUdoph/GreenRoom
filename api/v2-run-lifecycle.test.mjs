import test from "node:test";
import assert from "node:assert/strict";
import {
  V2_RUN_RECORD_VERSION,
  createV2RunId,
  loadV2Run,
  markV2RunDecisionPersisted,
  markV2RunParserRejected,
  markV2RunReplyReceived,
  markV2RunSubmitted,
  markV2RunTimedOut,
  prepareV2Run,
  v2RunKey,
} from "./v2-run-lifecycle.mjs";

const selection = {
  selected_signals: [{ signal_id: "signal-view", threshold_version: "creator_signal_thresholds_v1" }],
};
const evidence = { fingerprint: "evidence-fingerprint", provider_id: "YOUTUBE_OFFICIAL_BLOG" };
const input = (runId) => ({
  runId,
  createdAt: "2026-09-14T12:00:00.000Z",
  creatorContextVersion: "context-v2",
  promptHash: "prompt-hash",
  analyticsImportHash: "analytics-hash",
  signalSelection: selection,
  memoryProvenance: { availability: "UNAVAILABLE", selected_rule_ids: [], selected_node_ids: [], authorization: "secret" },
  externalEvidence: { ...evidence, raw_csv: "Content,Views\nprivate,99" },
});

function store() {
  const values = new Map();
  const writes = [];
  return {
    values,
    writes,
    async set(key, value) { writes.push({ key, value: JSON.parse(value) }); values.set(key, value); return "OK"; },
    async get(key) { return values.get(key) ?? null; },
  };
}

test("run ID is generated before a prepared run is persisted in its private namespace", async () => {
  const redis = store();
  const runId = createV2RunId();
  assert.match(runId, /^run_v2_[a-f0-9]{32}$/);
  const record = await prepareV2Run(redis, input(runId));
  assert.equal(redis.writes[0].key, v2RunKey(runId));
  assert.equal(record.run_record_version, V2_RUN_RECORD_VERSION);
  assert.equal(record.submission_status, "PREPARED");
  assert.equal(record.reply_status, "NOT_STARTED");
  assert.equal(record.parser_status, "NOT_STARTED");
  assert.equal(record.decision_status, "NOT_PERSISTED");
  assert.notEqual(v2RunKey(runId), `greenroom:v2_diagnostic:${runId}`);
  assert.notEqual(v2RunKey(runId), `greenroom:v2_decision:${runId}`);
});

test("submitted and waiting transitions persist before a timeout updates the same run", async () => {
  const redis = store();
  let record = await prepareV2Run(redis, input("run-v2-timeout"));
  record = await markV2RunSubmitted(redis, record, { submittedAt: "2026-09-14T12:00:01.000Z", transportMetadata: { transport: "SSE", event_count: 0, sdk_acknowledgement_present: true, authorization: "secret" } });
  assert.equal(record.submission_status, "SUBMITTED");
  assert.equal(record.reply_status, "WAITING");
  record = await markV2RunTimedOut(redis, record, { timeoutAt: "2026-09-14T12:02:01.000Z", timeoutSeconds: 120, transportMetadata: { transport: "SSE", event_count: 0 } });
  assert.equal(record.reply_status, "TIMED_OUT");
  assert.equal(record.timeout_seconds, 120);
  assert.equal(record.parser_status, "NOT_STARTED");
  assert.equal(record.decision_status, "NOT_PERSISTED");
  assert.equal(redis.values.has("greenroom:v2_diagnostic:run-v2-timeout"), false);
  assert.equal(redis.values.has("greenroom:v2_decision:run-v2-timeout"), false);
  assert.deepEqual(await loadV2Run(redis, "run-v2-timeout"), record);
  await assert.rejects(markV2RunSubmitted(redis, record, { submittedAt: "2026-09-14T12:03:00.000Z" }), /not prepared/);
});

test("run records retain bounded provenance without raw CSV or secrets", async () => {
  const redis = store();
  const record = await prepareV2Run(redis, input("run-v2-safe"));
  assert.equal(record.analytics_import_hash, "analytics-hash");
  assert.deepEqual(record.selected_signal_ids, ["signal-view"]);
  assert.deepEqual(record.signal_calculation_versions, { "signal-view": "creator_signal_thresholds_v1" });
  assert.equal(record.external_evidence_fingerprint, "evidence-fingerprint");
  assert.equal(record.external_provider, "YOUTUBE_OFFICIAL_BLOG");
  assert.equal(record.verified_mind_identity_reference.mind_id, "8208493e-f36b-1410-8466-00039ce7df11");
  assert.equal(record.contract_version, "greenroom_v2_decision_v1");
  assert.doesNotMatch(JSON.stringify(record), /Content,Views|private,99|authorization|secret|token|cookie/i);
});

test("received replies can end as parser rejection or accepted decision without namespace conflation", async () => {
  const malformedRedis = store();
  let malformed = await prepareV2Run(malformedRedis, input("run-v2-malformed"));
  malformed = await markV2RunSubmitted(malformedRedis, malformed, { submittedAt: "2026-09-14T12:00:01.000Z" });
  malformed = await markV2RunReplyReceived(malformedRedis, malformed, { receivedAt: "2026-09-14T12:00:02.000Z", transportMetadata: { transport: "SSE", event_count: 1 } });
  malformed = await markV2RunParserRejected(malformedRedis, malformed, "2026-09-14T12:00:03.000Z");
  assert.equal(malformed.parser_status, "REJECTED");
  assert.equal(malformed.decision_status, "NOT_PERSISTED");

  const validRedis = store();
  let valid = await prepareV2Run(validRedis, input("run-v2-valid"));
  valid = await markV2RunSubmitted(validRedis, valid, { submittedAt: "2026-09-14T12:00:01.000Z" });
  valid = await markV2RunReplyReceived(validRedis, valid, { receivedAt: "2026-09-14T12:00:02.000Z" });
  valid = await markV2RunDecisionPersisted(validRedis, valid, "2026-09-14T12:00:03.000Z");
  assert.equal(valid.parser_status, "ACCEPTED");
  assert.equal(valid.decision_status, "PERSISTED");
});
