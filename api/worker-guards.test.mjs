import test from "node:test";
import assert from "node:assert/strict";
import {
  buildMindsPrompt,
  buildObjectiveAwareSignals,
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

test("structured Mind output supplies the ranked briefing", () => {
  const result = parseMindBriefing('```json\n{"items":[{"title":"A","category":"Content","what_changed":"Demand rose","why_it_matters":"Matches memory","recommended_action":"Publish"}]}\n```');
  assert.equal(result.items[0].title, "A");
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
