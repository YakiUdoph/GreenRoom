import test from "node:test";
import assert from "node:assert/strict";
import {
  buildMindsPrompt,
  buildMindReplyDiagnostics,
  buildObjectiveAwareSignals,
  classifyMindReplyText,
  classifyObjectiveSignals,
  normalizeMindReply,
  parseMindBriefing,
  requireVerifiedMindReply,
  resolveIdempotentBriefing,
  selectVerifiedHistoryReply,
  validateObjectiveSnapshot,
  validateWorkerConfiguration,
  verifyMindIdentity,
} from "./worker-guards.mjs";

test("production worker reports missing security, persistence, and Minds configuration", () => {
  assert.deepEqual(validateWorkerConfiguration({}), [
    "QSTASH_CURRENT_SIGNING_KEY", "QSTASH_NEXT_SIGNING_KEY",
    "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "MINDS_BUILDER_API_KEY", "QSTASH_TOKEN",
  ]);
});

test("KV aliases satisfy durable persistence configuration", () => {
  assert.deepEqual(validateWorkerConfiguration({
    QSTASH_CURRENT_SIGNING_KEY: "current", QSTASH_NEXT_SIGNING_KEY: "next",
    KV_REST_API_URL: "url", KV_REST_API_TOKEN: "token", MINDS_BUILDER_API_KEY: "minds", QSTASH_TOKEN: "qstash",
  }), []);
});

test("a timed-out Mind call cannot be reported as completed", () => {
  assert.throws(() => requireVerifiedMindReply({ timedOut: true }), /timed out without a verified response/);
});

const VALID = '{"items":[{"id":"sig_1","priority":1,"title":"A","category":"Content","what_changed":"Demand rose","why_it_matters":"Matches memory","recommended_action":"Publish","memory_context_used":"voice","status":"recommended"}]}';
const OBJECTIVE_B = {
  objective_id: "obj_video",
  title: "Research emerging AI video creation tools that could improve a creator's production workflow.",
  constraints: "Prioritize tools for video generation, editing and animation. Focus on practical workflow improvements. Do not recommend sponsorships, paid campaigns or creator brand deals.",
  fingerprint: "fingerprint-video",
};

test("valid Run-A-style raw JSON supplies the ranked briefing", () => {
  const result = parseMindBriefing(VALID);
  assert.equal(result.items[0].title, "A");
});

test("history reply selection rejects a submitted prompt echo by hash", () => {
  const rows = [{ alias: "greenroom-run", fingerprint: "fp_2", senderType: 0, messageText: "submitted prompt" }];
  const result = selectVerifiedHistoryReply(rows, {
    alias: "greenroom-run", afterFingerprint: "fp_1", submittedPromptHash: "same",
    hashText: () => "same",
  }, () => true);
  assert.equal(result, null);
});

test("supported SDK messageText and text wrappers normalize", () => {
  assert.equal(normalizeMindReply({ reply: { messageText: VALID }, timedOut: false }).text, VALID);
  assert.equal(normalizeMindReply({ reply: { text: VALID }, timedOut: false }).text, VALID);
  assert.throws(() => normalizeMindReply({ reply: { content: VALID }, timedOut: false }), /unsupported reply shape/);
});

test("one complete json fence is supported with no surrounding prose", () => {
  assert.equal(parseMindBriefing(`\`\`\`json\n${VALID}\n\`\`\``).items.length, 1);
  assert.throws(() => parseMindBriefing(`Here:\n\`\`\`json\n${VALID}\n\`\`\``), /prose or multiple/);
  assert.throws(() => parseMindBriefing(`\`\`\`json\n${VALID}\n\`\`\`\n\`\`\`json\n${VALID}\n\`\`\``), /prose or multiple/);
});

test("unsafe or malformed response formats fail strictly", () => {
  assert.throws(() => parseMindBriefing("<html>upstream error</html>"), /HTML\/XML-like/);
  assert.throws(() => parseMindBriefing("Here is your briefing"), /not valid briefing JSON/);
  assert.throws(() => parseMindBriefing('{"items":['), /not valid briefing JSON/);
  assert.throws(() => parseMindBriefing("  "), /was empty/);
  assert.throws(() => parseMindBriefing("[]"), /top-level object/);
  assert.throws(() => parseMindBriefing('{"items":[]}'), /did not contain ranked items/);
});

test("briefing schema rejects missing, empty, and incorrectly typed fields", () => {
  assert.throws(() => parseMindBriefing('{"items":[{"title":"A"}]}'), /missing or invalid/);
  assert.throws(() => parseMindBriefing('{"items":[{"title":7,"category":"C","what_changed":"W","why_it_matters":"Y","recommended_action":"R"}]}'), /missing or invalid: title/);
  assert.throws(() => parseMindBriefing('{"items":[{"title":" ","category":"C","what_changed":"W","why_it_matters":"Y","recommended_action":"R"}]}'), /missing or invalid: title/);
});

test("safe diagnostics classify HTML without retaining the complete response", () => {
  const body = `<html>${"sensitive-body-".repeat(30)}</html>`;
  const objective = { objective_id: "obj_b", fingerprint: "fp_b" };
  const diagnostics = buildMindReplyDiagnostics({ reply: { messageText: body } }, objective, "run_b");
  assert.equal(classifyMindReplyText(body), "html_like");
  assert.equal(diagnostics.content_classification, "html_like");
  assert.equal(diagnostics.character_count, body.length);
  assert.ok(diagnostics.sanitized_prefix.length <= 80);
  assert.notEqual(diagnostics.sanitized_prefix, body);
  assert.equal(JSON.stringify(diagnostics).includes(body), false);
});

test("Mind identity must match every configured platform field", () => {
  const expected = { mindId: "mind-1", email: "creator@example.com", walletAddress: "0xabc" };
  assert.equal(verifyMindIdentity({ ...expected, isEnabled: true }, expected).mindId, "mind-1");
  assert.throws(() => verifyMindIdentity({ ...expected, isEnabled: false }, expected), /did not match/);
});

test("Objective B is authoritative in the Minds prompt despite stale profile objective A", () => {
  const objectiveB = validateObjectiveSnapshot({
    objective_id: "obj_b",
    title: "Find paid Web3 partnerships",
    constraints: "Reject exposure-only campaigns",
    fingerprint: "fingerprint-b",
  });
  const staleProfile = { creator_objectives: [{ id: "obj_a", title: "Terminal-first local AI" }] };
  const signals = buildObjectiveAwareSignals(objectiveB);
  const prompt = buildMindsPrompt(objectiveB, staleProfile, signals);

  assert.match(prompt, /^RUN OBJECTIVE \(AUTHORITATIVE\): Find paid Web3 partnerships/);
  assert.match(prompt, /RUN CONSTRAINTS \(AUTHORITATIVE\): Reject exposure-only campaigns/);
  assert.match(prompt, /Return exactly one JSON object/);
  assert.match(prompt, /No Markdown\. No code fences\. No commentary\. No HTML\/XML/);
  assert.ok(signals.every((signal) => !signal.signal.toLowerCase().includes("terminal-first")));
});

test("exact Objective B selects simulated AI-video tools and preserves its snapshot", () => {
  const before = structuredClone(OBJECTIVE_B);
  const result = classifyObjectiveSignals(OBJECTIVE_B);

  assert.equal(result.provenance.selected_signal_category, "ai_video_tools");
  assert.deepEqual(OBJECTIVE_B, before);
  assert.deepEqual(result.provenance.positive_intent_terms_matched, ["ai video", "video generation", "animation"]);
  assert.ok(result.provenance.exclusion_markers_detected.includes("do not"));
  assert.ok(result.provenance.exclusion_terms_detected.includes("paid"));
  assert.ok(result.provenance.exclusion_terms_detected.includes("sponsor"));
  assert.ok(result.signals.every((signal) => signal.source === "Demo Dataset (Simulated)"));
  assert.ok(result.signals.every((signal) => !/sponsor|paid campaign|brand deal|partnership/i.test(signal.signal)));
  assert.deepEqual(result.signals.map((signal) => signal.category), [
    "video_generation", "video_editing_workflow", "animation_motion",
  ]);
});

test("prohibited paid campaigns and sponsorships do not create positive monetization intent", () => {
  const result = classifyObjectiveSignals({
    title: "Evaluate creator opportunities",
    constraints: "Do not recommend paid campaigns or sponsorships.",
  });
  assert.equal(result.provenance.selected_signal_category, "generic");
  assert.deepEqual(result.provenance.positive_intent_terms_matched, []);
  assert.ok(result.provenance.exclusion_terms_detected.includes("paid"));
  assert.ok(result.provenance.exclusion_terms_detected.includes("sponsor"));
});

test("genuinely positive sponsorship objective still selects monetization", () => {
  const result = classifyObjectiveSignals({
    title: "Find paid sponsorship opportunities for my creator brand",
    constraints: "Require clear value.",
  });
  assert.equal(result.provenance.selected_signal_category, "monetization");
  assert.deepEqual(result.provenance.positive_intent_terms_matched, ["paid", "sponsor"]);
});

test("AI-video intent outranks excluded brand deals", () => {
  const result = classifyObjectiveSignals({
    title: "Find AI video generation and editing tools, avoid brand deals",
    constraints: "Focus on creator workflow improvements.",
  });
  assert.equal(result.provenance.selected_signal_category, "ai_video_tools");
  assert.ok(result.provenance.exclusion_terms_detected.includes("brand deal"));
});

test("terminal/local-AI and generic objectives retain their bundles", () => {
  const terminal = classifyObjectiveSignals({ title: "Teach terminal-first local AI", constraints: "Use a CLI" });
  const generic = classifyObjectiveSignals({ title: "Improve my content planning", constraints: "Keep it practical" });
  assert.equal(terminal.provenance.selected_signal_category, "terminal_local_ai");
  assert.match(terminal.signals[0].signal, /terminal-first local AI/);
  assert.equal(generic.provenance.selected_signal_category, "generic");
});

test("classification provenance is safe and describes the simulated strategy", () => {
  const provenance = classifyObjectiveSignals(OBJECTIVE_B).provenance;
  assert.deepEqual(Object.keys(provenance).sort(), [
    "classification_strategy", "classification_version", "evidence_mode",
    "exclusion_markers_detected", "exclusion_terms_detected",
    "positive_intent_terms_matched", "selected_signal_category",
  ]);
  assert.equal(provenance.classification_version, "objective_signal_classifier_v2");
  assert.equal(provenance.evidence_mode, "SIMULATED");
  assert.equal(JSON.stringify(provenance).includes(OBJECTIVE_B.constraints), false);
});

test("completed duplicate QStash delivery returns only its matching run briefing", () => {
  const objective = { objective_id: "obj_b" };
  const briefing = { run_id: "run_b", objective_id: "obj_b", items: [] };
  assert.equal(resolveIdempotentBriefing({ status: "COMPLETED" }, briefing, "run_b", objective), briefing);
  assert.throws(
    () => resolveIdempotentBriefing({ status: "COMPLETED" }, { ...briefing, run_id: "run_a" }, "run_b", objective),
    /run ID mismatch/
  );
});
