import test from "node:test";
import assert from "node:assert/strict";
import {
  SIGNAL_SELECTION_VERSION,
  V2_DIAGNOSTIC_VERSION,
  buildV2DiagnosticArtifact,
  buildV2DecisionRecord,
  buildV2MindPrompt,
  finalizeAndPersistV2Decision,
  fingerprintV2Decision,
  parseV2MindResponse,
  selectV2Signals,
  validateCreatorContext,
  v2DiagnosticKey,
} from "./v2-decision.mjs";

const EVIDENCE = Object.freeze({
  evidence_id: "youtube-update-1",
  provider_id: "YOUTUBE_OFFICIAL_BLOG",
  source: "YouTube Official Blog",
  source_url: "https://blog.youtube/news-and-events/sanitized-update/",
  title: "YouTube announces recommendation workflow controls",
  summary: "YouTube announced creator-facing controls related to recommendations and publishing workflow.",
  published_at: "2026-09-01T00:00:00.000Z",
  fingerprint: "evidence-fingerprint-1",
});

const creator = (goal, constraint, version = "context-v1") => ({
  context_version: version,
  primary_platform: { value: "YOUTUBE", source: "CREATOR_SUPPLIED" },
  primary_goal: { value: goal, source: "CREATOR_SUPPLIED" },
  optional_target: null,
  optional_target_date: null,
  constraints: [{ value: constraint, source: "CREATOR_SUPPLIED" }],
  creator_supplied_preferences: [{ value: "Prefer bounded experiments", source: "CREATOR_SUPPLIED" }],
});

const signals = (viewDirection = "DECLINING") => [
  { signal_id: "signal-view", type: "VIEW_MOMENTUM", direction: viewDirection, classification: viewDirection, current_value: 80, comparison_value: 120, percentage_delta: -1 / 3, unit: "COUNT", threshold_version: "creator_signal_thresholds_v1", data_sufficiency: "SUFFICIENT", uncertainty: null },
  { signal_id: "signal-avd", type: "AVD_MOMENTUM", direction: "STABLE", classification: "STABLE", current_value: 100, comparison_value: 102, percentage_delta: -0.0196, unit: "SECONDS", threshold_version: "creator_signal_thresholds_v1", data_sufficiency: "SUFFICIENT", uncertainty: null },
  { signal_id: "signal-ctr", type: "VIDEO_CTR_VARIATION", direction: null, classification: "INSUFFICIENT_DATA", unit: "DECIMAL_FRACTION", threshold_version: "creator_signal_thresholds_v1", data_sufficiency: "INSUFFICIENT", uncertainty: "Content type unavailable." },
];

const memory = Object.freeze({ learned_rules: ["Do not increase upload frequency."], memory_nodes: [] });
const memoryProvenance = Object.freeze({ memory_selection_version: "objective_memory_projection_v2", selected_rule_hashes: ["rule-hash"], selected_memory_node_ids: [] });

function setup(context, inputSignals = signals()) {
  const selection = selectV2Signals({ creatorContext: context, externalEvidence: EVIDENCE, signals: inputSignals });
  const prompt = buildV2MindPrompt({ creatorContext: context, signalSelection: selection, memoryContext: memory, memoryProvenance, externalEvidence: EVIDENCE });
  return { selection, prompt };
}

const VALID_REPLY = `ATTENTION: KEEP_WATCHING
WHAT I NOTICED:
Viewing activity is lower while YouTube separately announced recommendation workflow controls.
WHY THIS MATTERS TO YOU:
This is worth monitoring against your subscriber-growth goal without increasing publishing frequency. [REF:creator_goal] [REF:signal:signal-view]
WHAT I'D DO NEXT:
Review the control documentation before changing one existing upload.
CONNECTION: POSSIBLE
UNCERTAINTY:
There is no evidence that the announcement caused the viewing decline.`;

test("creator context requires explicit field-level provenance", () => {
  const valid = validateCreatorContext(creator("Grow YouTube subscribers", "Do not increase upload frequency"));
  assert.equal(valid.primary_goal.source, "CREATOR_SUPPLIED");
  assert.throws(() => validateCreatorContext({ ...creator("Grow", "Keep cadence"), primary_goal: { value: "Grow", source: "OBSERVED_ANALYTICS" } }), /unsupported source/);
  assert.throws(() => validateCreatorContext({ ...creator("Grow", "Keep cadence"), primary_goal: "Grow" }), /preserve value and source/);
});

test("structured prompt keeps evidence classes distinguishable and includes the absolute causality guard", () => {
  const { prompt } = setup(creator("Grow YouTube subscribers", "Do not increase upload frequency"));
  for (const heading of ["CREATOR GOAL [CREATOR-STATED FACTS]", "RELEVANT REMEMBERED CONTEXT [MEMORY]", "OBSERVED CHANNEL SIGNALS [OBSERVED CREATOR SIGNALS]", "VERIFIED EXTERNAL UPDATE [EXTERNAL EVIDENCE]", "EVIDENCE LIMITATIONS", "DECISION INSTRUCTIONS"]) assert.match(prompt, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(prompt, /Temporal coexistence does not establish causation/);
  assert.match(prompt, /causal evidence does not exist/);
  assert.match(prompt, /CONNECTION may be NONE/);
});

test("only deterministically selected signals enter the bounded Mind prompt", () => {
  const { selection, prompt } = setup(creator("Grow YouTube subscribers", "Do not increase upload frequency"));
  assert.equal(selection.selection_version, SIGNAL_SELECTION_VERSION);
  assert.deepEqual(selection.available_signal_ids, ["signal-avd", "signal-ctr", "signal-view"]);
  assert.deepEqual(selection.selected_signal_ids, ["signal-view"]);
  assert.deepEqual(selection.omitted_signal_ids, ["signal-avd", "signal-ctr"]);
  assert.match(prompt, /signal-view/);
  assert.doesNotMatch(prompt, /"signal_id": "signal-avd"/);
  assert.doesNotMatch(prompt, /"signal_id": "signal-ctr"/);
});

test("raw CSV has no accepted input field and never enters the Mind prompt", () => {
  const raw = "Content,Views\nsecret-video,99";
  const context = { ...creator("Grow YouTube subscribers", "Do not increase upload frequency"), raw_csv: raw };
  const inputSignals = signals();
  inputSignals[0].raw_csv = raw;
  const { prompt } = setup(context, inputSignals);
  assert.doesNotMatch(prompt, /secret-video|Content,Views|raw_csv/);
});

test("V2 response requires all six sections, valid enums, and supplied personalization provenance", () => {
  const parsed = parseV2MindResponse(VALID_REPLY, { allowedPersonalizationRefs: ["creator_goal", "constraint:0", "signal:signal-view"] });
  assert.equal(parsed.attention_verdict, "KEEP_WATCHING");
  assert.equal(parsed.connection, "POSSIBLE");
  assert.deepEqual(parsed.personalization_refs, ["creator_goal", "signal:signal-view"]);
  assert.throws(() => parseV2MindResponse(VALID_REPLY.replace(/UNCERTAINTY:[\s\S]*/, ""), { allowedPersonalizationRefs: ["creator_goal", "signal:signal-view"] }), /six required sections/);
  assert.throws(() => parseV2MindResponse(VALID_REPLY.replace("CONNECTION: POSSIBLE", "CONNECTION: CAUSED"), { allowedPersonalizationRefs: ["creator_goal", "signal:signal-view"] }), /invalid CONNECTION/);
  assert.throws(() => parseV2MindResponse(VALID_REPLY.replace(/ \[REF:[^\]]+\]/g, ""), { allowedPersonalizationRefs: ["creator_goal", "signal:signal-view"] }), /personalization provenance/);
  assert.throws(() => parseV2MindResponse(VALID_REPLY.replace("signal:signal-view", "signal:not-supplied"), { allowedPersonalizationRefs: ["creator_goal", "signal:signal-view"] }), /personalization provenance/);
  assert.throws(() => parseV2MindResponse(VALID_REPLY.replace("ATTENTION: KEEP_WATCHING", "**ATTENTION:** KEEP_WATCHING"), { allowedPersonalizationRefs: ["creator_goal", "signal:signal-view"] }), /six required sections/);
});

test("same evidence produces different bounded Mind inputs for different creator contexts without hardcoded verdicts", () => {
  const contextA = creator("Grow YouTube subscribers", "Do not increase upload frequency", "creator-a-v1");
  const contextB = creator("Maintain current publishing workflow", "Only surface changes that require immediate workflow action", "creator-b-v1");
  const a = setup(contextA, signals("DECLINING"));
  const b = setup(contextB, signals("STABLE"));
  assert.notEqual(a.prompt, b.prompt);
  assert.match(a.prompt, /Grow YouTube subscribers/);
  assert.match(a.prompt, /"direction": "DECLINING"/);
  assert.match(b.prompt, /Maintain current publishing workflow/);
  assert.match(b.prompt, /"direction": "STABLE"/);
  assert.doesNotMatch(selectV2Signals.toString(), /ACT_NOW|KEEP_WATCHING|IGNORE_FOR_NOW/);
  assert.equal((a.prompt.match(new RegExp(EVIDENCE.fingerprint, "g")) || []).length, 1);
  assert.equal((b.prompt.match(new RegExp(EVIDENCE.fingerprint, "g")) || []).length, 1);
});

test("run fingerprint binds analytics, relevant context, selected signals, Memory, evidence, and Mind", () => {
  const context = creator("Grow YouTube subscribers", "Do not increase upload frequency");
  const { selection } = setup(context);
  const base = { creatorContext: context, analyticsImportHash: "analytics-a", signalSelection: selection, memoryProvenance, externalEvidence: EVIDENCE };
  const first = fingerprintV2Decision(base);
  assert.notEqual(first, fingerprintV2Decision({ ...base, analyticsImportHash: "analytics-b" }));
  const changedContext = creator("Grow returning viewers", "Do not increase upload frequency", "context-v2");
  const changedSelection = selectV2Signals({ creatorContext: changedContext, externalEvidence: EVIDENCE, signals: signals() });
  assert.notEqual(first, fingerprintV2Decision({ ...base, creatorContext: changedContext, signalSelection: changedSelection }));
  assert.equal(first, fingerprintV2Decision(base));
});

test("persistence record retains the complete inspectable V2 decision provenance", () => {
  const context = creator("Grow YouTube subscribers", "Do not increase upload frequency");
  const { selection } = setup(context);
  const parsed = parseV2MindResponse(VALID_REPLY, { allowedPersonalizationRefs: ["creator_goal", "constraint:0", "signal:signal-view"] });
  const record = buildV2DecisionRecord({ runId: "run-v2", creatorContext: context, analyticsImportHash: "analytics-a", signalSelection: selection, memoryContext: memory, memoryProvenance, externalEvidence: EVIDENCE, parsedDecision: parsed, completedAt: "2026-09-14T12:00:00.000Z" });
  assert.equal(record.decision.connection, "POSSIBLE");
  assert.equal(record.decision.attention_verdict, "KEEP_WATCHING");
  assert.equal(record.analytics.import_hash, "analytics-a");
  assert.deepEqual(record.signal_selection.selected_signal_ids, ["signal-view"]);
  assert.deepEqual(record.memory.provenance.selected_rule_hashes, ["rule-hash"]);
  assert.equal(record.verified_mind_identity.email, "udophia@hellominds.ai");
  assert.equal(record.run_fingerprint.length, 64);
  assert.throws(() => buildV2DecisionRecord({ runId: "run-v2", creatorContext: context, signalSelection: selection, externalEvidence: EVIDENCE, parsedDecision: {}, completedAt: "2026-09-14T12:00:00.000Z" }), /personalization provenance/);
});

test("analytics insufficiency remains explicit while a bounded goal-and-evidence prompt is still possible", () => {
  const context = creator("Maintain current publishing workflow", "Only surface immediate workflow action");
  const selection = selectV2Signals({ creatorContext: context, externalEvidence: EVIDENCE, signals: signals().map((signal) => ({ ...signal, data_sufficiency: "INSUFFICIENT" })) });
  assert.deepEqual(selection.selected_signal_ids, []);
  const prompt = buildV2MindPrompt({ creatorContext: context, signalSelection: selection, memoryContext: {}, memoryProvenance: { availability: "UNAVAILABLE" }, externalEvidence: EVIDENCE, analyticsStatus: "INSUFFICIENT" });
  assert.match(prompt, /"analytics_status": "INSUFFICIENT"/);
  assert.match(prompt, /CONNECTION may be NONE/);
});

test("malformed replies are captured before parsing in a separate sanitized diagnostic and never create a decision", async () => {
  const values = new Map();
  const writes = [];
  const redis = {
    async set(key, value) { writes.push({ key, value: JSON.parse(value) }); values.set(key, value); return "OK"; },
    async del(key) { values.delete(key); return 1; },
  };
  const context = creator("Grow YouTube subscribers", "Do not increase upload frequency");
  const { selection } = setup(context);
  const input = { redis, runId: "run-v2", promptHash: "prompt-hash", replyProvenance: { transport: "SSE", sender_type: 0, sender_id: "mind-id", authorization: "secret", raw_sdk_response: { token: "secret" } }, sseMetadata: { event_count: 3, reconstructed_from_field: "messageText", authorization: "secret" }, diagnosticTimestamp: "2026-09-14T11:59:59.000Z", creatorContext: { ...context, raw_csv: "Content,Views\nprivate,99" }, analyticsImportHash: "analytics-a", signalSelection: selection, memoryContext: memory, memoryProvenance, externalEvidence: EVIDENCE, completedAt: "2026-09-14T12:00:00.000Z" };
  const malformed = "ATTENTION: ACT_NOW";
  await assert.rejects(finalizeAndPersistV2Decision({ ...input, mindReplyText: malformed }), /six required sections/);

  assert.equal(writes[0].key, v2DiagnosticKey("run-v2"));
  assert.equal(writes[0].value.parser_status, "PENDING");
  assert.equal(writes[0].value.reconstructed_reply_text, malformed);
  assert.equal(writes[1].value.parser_status, "REJECTED");
  assert.match(writes[1].value.parser_error, /six required sections/);
  assert.equal(writes[1].value.run_id, "run-v2");
  assert.equal(writes[1].value.prompt_hash, "prompt-hash");
  assert.equal(writes[1].value.response_hash.length, 64);
  assert.equal(writes[1].value.decision_persisted, false);
  assert.equal(writes[1].value.diagnostic_version, V2_DIAGNOSTIC_VERSION);
  assert.equal(writes[1].value.contract_version, "greenroom_v2_decision_v1");
  assert.equal(writes[1].value.sse_reconstruction.event_count, 3);
  assert.equal(values.has("greenroom:v2_decision:run-v2"), false);
  assert.equal(values.has("greenroom:v2_diagnostic:run-v2"), true);
  const serialized = JSON.stringify(writes[1].value);
  assert.doesNotMatch(serialized, /Content,Views|private,99|authorization|raw_sdk_response|token|secret/);
});

test("successful strict parsing persists the decision and removes the temporary full-text diagnostic", async () => {
  const values = new Map();
  const deleted = [];
  const redis = {
    async set(key, value) { values.set(key, value); return "OK"; },
    async del(key) { deleted.push(key); values.delete(key); return 1; },
  };
  const context = creator("Grow YouTube subscribers", "Do not increase upload frequency");
  const { selection } = setup(context);
  const input = { redis, runId: "run-v2-success", promptHash: "prompt-hash", creatorContext: context, analyticsImportHash: "analytics-a", signalSelection: selection, memoryContext: memory, memoryProvenance, externalEvidence: EVIDENCE, completedAt: "2026-09-14T12:00:00.000Z" };
  const record = await finalizeAndPersistV2Decision({ ...input, mindReplyText: VALID_REPLY });
  assert.equal(record.decision.connection, "POSSIBLE");
  assert.deepEqual(JSON.parse(values.get("greenroom:v2_decision:run-v2-success")), record);
  assert.deepEqual(deleted, ["greenroom:v2_diagnostic:run-v2-success"]);
  assert.equal(values.has("greenroom:v2_diagnostic:run-v2-success"), false);
  assert.equal(record.diagnostic_version, undefined);
  assert.equal(record.reconstructed_reply_text, undefined);
});

test("diagnostic construction exposes only its bounded schema", () => {
  const artifact = buildV2DiagnosticArtifact({ runId: "run-schema", timestamp: "2026-09-14T12:00:00.000Z", promptHash: "prompt-hash", mindReplyText: "ATTENTION: broken", replyProvenance: { transport: "SSE", cookies: "secret" }, sseMetadata: { event_count: 1, headers: { authorization: "secret" } } });
  assert.deepEqual(Object.keys(artifact), ["diagnostic_version", "contract_version", "run_id", "timestamp", "prompt_hash", "response_hash", "verified_mind_identity_reference", "reply_provenance", "reconstructed_reply_text", "response_character_length", "sse_reconstruction", "parser_status", "parser_error", "decision_persisted", "visibility"]);
  assert.doesNotMatch(JSON.stringify(artifact), /cookies|headers|authorization|secret/);
});
