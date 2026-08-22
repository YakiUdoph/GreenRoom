import test from "node:test";
import assert from "node:assert/strict";
import {
  buildMindsPrompt,
  buildMindReplyDiagnostics,
  buildObjectiveAwareSignals,
  classifyMindReplyText,
  normalizeMindReply,
  parseMindBriefing,
  requireVerifiedMindReply,
  resolveIdempotentBriefing,
  validateObjectiveSnapshot,
  validateWorkerConfiguration,
  verifyMindIdentity,
} from "./worker-guards.mjs";

test("production worker reports missing security, persistence, and Minds configuration", () => {
  assert.deepEqual(validateWorkerConfiguration({}), [
    "QSTASH_CURRENT_SIGNING_KEY", "QSTASH_NEXT_SIGNING_KEY",
    "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "MINDS_BUILDER_API_KEY",
  ]);
});

test("KV aliases satisfy durable persistence configuration", () => {
  assert.deepEqual(validateWorkerConfiguration({
    QSTASH_CURRENT_SIGNING_KEY: "current", QSTASH_NEXT_SIGNING_KEY: "next",
    KV_REST_API_URL: "url", KV_REST_API_TOKEN: "token", MINDS_BUILDER_API_KEY: "minds",
  }), []);
});

test("a timed-out Mind call cannot be reported as completed", () => {
  assert.throws(() => requireVerifiedMindReply({ timedOut: true }), /timed out without a verified response/);
});

const VALID = '{"items":[{"id":"sig_1","priority":1,"title":"A","category":"Content","what_changed":"Demand rose","why_it_matters":"Matches memory","recommended_action":"Publish","memory_context_used":"voice","status":"recommended"}]}';

test("valid Run-A-style raw JSON supplies the ranked briefing", () => {
  const result = parseMindBriefing(VALID);
  assert.equal(result.items[0].title, "A");
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

test("completed duplicate QStash delivery returns only its matching run briefing", () => {
  const objective = { objective_id: "obj_b" };
  const briefing = { run_id: "run_b", objective_id: "obj_b", items: [] };
  assert.equal(resolveIdempotentBriefing({ status: "COMPLETED" }, briefing, "run_b", objective), briefing);
  assert.throws(
    () => resolveIdempotentBriefing({ status: "COMPLETED" }, { ...briefing, run_id: "run_a" }, "run_b", objective),
    /run ID mismatch/
  );
});
