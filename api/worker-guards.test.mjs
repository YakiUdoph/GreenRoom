import test from "node:test";
import assert from "node:assert/strict";
import { parseMindBriefing, requireVerifiedMindReply, validateWorkerConfiguration } from "./worker-guards.mjs";

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
