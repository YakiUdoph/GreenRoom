import test from "node:test";
import assert from "node:assert/strict";
import { processWorkerPhase } from "./briefing-worker.mjs";

const OBJECTIVE = Object.freeze({ objective_id: "obj_video", title: "Research emerging AI video creation tools", constraints: "Prioritize video generation and editing. Do not recommend paid sponsorships.", fingerprint: "fp_objective" });
const VALID = JSON.stringify({ items: [{ id: "sig_1", priority: 1, title: "Video workflow", category: "tool", what_changed: "Drafts are faster", why_it_matters: "It serves the objective", recommended_action: "Compare the workflow", memory_context_used: "Concise", status: "recommended" }] });

class FakeRedis {
  constructor(values = {}) { this.values = new Map(Object.entries(values)); }
  async get(key) { return this.values.get(key) ?? null; }
  async set(key, value, options) {
    if (options?.nx && this.values.has(key)) return null;
    this.values.set(key, value);
    return "OK";
  }
  json(key) { const value = this.values.get(key); return typeof value === "string" ? JSON.parse(value) : value; }
}

function initialRedis(runId = "run_b") {
  return new FakeRedis({
    [`greenroom:run_status:${runId}`]: JSON.stringify({ run_id: runId, status: "QUEUED", queued_at: "2026-01-01T00:00:00.000Z", objective_snapshot: OBJECTIVE }),
    "greenroom:recent_runs": "[]",
    "greenroom:creator_profile": JSON.stringify({ learned_voice_rules: ["Be practical"], memory_nodes: [{ node_id: "m1" }], creator_objectives: [{ id: "stale_a" }] }),
  });
}

function fakeMinds(history = []) {
  const calls = { send: 0, history: 0 };
  return {
    calls,
    async getMind() { return { mindId: "8208493e-f36b-1410-8466-00039ce7df11", email: "udophia@hellominds.ai", walletAddress: "0xB675Ec9857776678aE540cF3248d898f015987Cb", isEnabled: true }; },
    async ensureConversation(alias) { return { conversationId: "conversation-safe", alias }; },
    async getLatestHistoryFingerprint() { return "fp_before"; },
    async sendMessage() { calls.send++; return { messageId: "message-safe", ignoredSecret: "no-store" }; },
    async getHistory() { calls.history++; return typeof history === "function" ? history(calls.history) : history; },
  };
}

const env = { QSTASH_TOKEN: "test", MINDS_REPLY_DEADLINE_MS: "600000" };
const targetUrl = "https://example.test/api/briefing-worker";
const runArgs = (redis, mindsClient, extras = {}) => ({ redis, mindsClient, runId: "run_b", objective: OBJECTIVE, targetUrl, env, enqueue: async () => ({ messageId: "qstash-safe" }), ...extras });

test("submission returns WAITING without synchronously waiting and records safe metadata", async () => {
  const redis = initialRedis();
  const minds = fakeMinds();
  const result = await processWorkerPhase({ phase: "submit", ...runArgs(redis, minds) });
  assert.equal(result.httpStatus, 202);
  assert.equal(result.body.status, "WAITING_FOR_MINDS");
  assert.equal(minds.calls.send, 1);
  assert.equal(minds.calls.history, 0);
  const status = redis.json("greenroom:run_status:run_b");
  assert.equal(status.conversation_alias, "greenroom-run_b");
  assert.equal(status.signal_classification.selected_signal_category, "ai_video_tools");
  assert.equal(status.conversation_metadata.conversationId, "conversation-safe");
  assert.equal(status.message_metadata.messageId, "message-safe");
  assert.equal("ignoredSecret" in status.message_metadata, false);
  assert.equal(typeof status.submitted_prompt_hash, "string");
  assert.equal(JSON.stringify(status).includes("Persisted creator memory"), false);
});

test("duplicate submission never resends the Minds prompt", async () => {
  const redis = initialRedis();
  const minds = fakeMinds();
  await processWorkerPhase({ phase: "submit", ...runArgs(redis, minds) });
  const replay = await processWorkerPhase({ phase: "submit", ...runArgs(redis, minds) });
  assert.equal(replay.body.idempotent_replay, true);
  assert.equal(minds.calls.send, 1);
});

test("concurrent QStash submission retries share one durable claim", async () => {
  const redis = initialRedis();
  const minds = fakeMinds();
  await Promise.all([
    processWorkerPhase({ phase: "submit", ...runArgs(redis, minds) }),
    processWorkerPhase({ phase: "submit", ...runArgs(redis, minds) }),
  ]);
  assert.equal(minds.calls.send, 1);
});

test("empty collection attempts stay WAITING and enqueue another delayed check", async () => {
  const redis = initialRedis();
  const minds = fakeMinds([]);
  let schedules = 0;
  const enqueue = async () => { schedules++; return {}; };
  await processWorkerPhase({ phase: "submit", ...runArgs(redis, minds, { enqueue }) });
  await processWorkerPhase({ phase: "collect", ...runArgs(redis, minds, { enqueue }) });
  const second = await processWorkerPhase({ phase: "collect", ...runArgs(redis, minds, { enqueue }) });
  assert.equal(second.body.status, "WAITING_FOR_MINDS");
  assert.equal(redis.json("greenroom:run_status:run_b").collection_attempt, 2);
  assert.deepEqual(redis.json("greenroom:run_status:run_b").last_history_observation, {
    checked_at: redis.json("greenroom:run_status:run_b").collection_attempt_timestamps.at(-1),
    row_count: 0,
    fingerprints: [],
    sender_types: [],
  });
  assert.equal(schedules, 3);
});

test("duplicate collection delivery is harmless", async () => {
  const redis = initialRedis();
  const minds = fakeMinds([]);
  await processWorkerPhase({ phase: "submit", ...runArgs(redis, minds) });
  const results = await Promise.all([
    processWorkerPhase({ phase: "collect", ...runArgs(redis, minds) }),
    processWorkerPhase({ phase: "collect", ...runArgs(redis, minds) }),
  ]);
  assert.ok(results.every((result) => result.body.status === "WAITING_FOR_MINDS"));
  assert.equal(redis.json("greenroom:run_status:run_b").collection_attempt, 1);
});

test("collection rejects a payload whose immutable snapshot differs from durable state", async () => {
  const redis = initialRedis();
  const minds = fakeMinds([]);
  await assert.rejects(
    processWorkerPhase({ phase: "collect", ...runArgs(redis, minds, { objective: { ...OBJECTIVE, fingerprint: "wrong" } }) }),
    /does not match the queued run snapshot/,
  );
});

test("a verified delayed reply after the old 60-second window completes the matching run", async () => {
  const redis = initialRedis();
  const minds = fakeMinds([]);
  await processWorkerPhase({ phase: "submit", ...runArgs(redis, minds) });
  const submitted = redis.json("greenroom:run_status:run_b").submitted_at;
  minds.getHistory = async () => [{ alias: "greenroom-run_b", fingerprint: "fp_reply", senderType: 0, mindId: "8208493e-f36b-1410-8466-00039ce7df11", messageId: "reply-1", createdAt: new Date(Date.parse(submitted) + 70_000).toISOString(), messageText: VALID }];
  const result = await processWorkerPhase({ phase: "collect", ...runArgs(redis, minds, { now: new Date(Date.parse(submitted) + 70_000) }) });
  assert.equal(result.body.status, "COMPLETED");
  assert.equal(redis.json("greenroom:briefing:run_b").objective_id, OBJECTIVE.objective_id);
  assert.equal(redis.json("greenroom:latest_briefing").run_id, "run_b");
});

test("deadline failure is terminal and a late reply cannot resurrect it", async () => {
  const redis = initialRedis();
  const minds = fakeMinds([]);
  await processWorkerPhase({ phase: "submit", ...runArgs(redis, minds) });
  const status = redis.json("greenroom:run_status:run_b");
  const failed = await processWorkerPhase({ phase: "collect", ...runArgs(redis, minds, { now: new Date(Date.parse(status.reply_deadline_at) + 1) }) });
  assert.equal(failed.body.status, "FAILED");
  minds.getHistory = async () => [{ alias: "greenroom-run_b", fingerprint: "zz_reply", senderType: 0, messageText: VALID }];
  const replay = await processWorkerPhase({ phase: "collect", ...runArgs(redis, minds) });
  assert.equal(replay.body.status, "FAILED");
  assert.equal(redis.json("greenroom:briefing:run_b"), undefined);
});

test("human messages, wrong aliases and old fingerprints are rejected", async () => {
  const redis = initialRedis();
  const minds = fakeMinds([]);
  await processWorkerPhase({ phase: "submit", ...runArgs(redis, minds) });
  minds.getHistory = async () => [
    { alias: "wrong", fingerprint: "zz1", senderType: 0, messageText: VALID },
    { alias: "greenroom-run_b", fingerprint: "zz2", senderType: 1, messageText: VALID },
    { alias: "greenroom-run_b", fingerprint: "aa", senderType: 0, messageText: VALID },
  ];
  const result = await processWorkerPhase({ phase: "collect", ...runArgs(redis, minds) });
  assert.equal(result.body.status, "WAITING_FOR_MINDS");
  assert.equal(redis.json("greenroom:briefing:run_b"), undefined);
});

for (const [label, body, pattern] of [
  ["malformed JSON", '{"items":[', /not valid briefing JSON/],
  ["HTML", "<html>upstream</html>", /HTML\/XML-like/],
  ["missing schema fields", '{"items":[{"title":"x"}]}', /missing or invalid/],
]) {
  test(`${label} reply fails safely without a briefing`, async () => {
    const redis = initialRedis();
    const minds = fakeMinds([]);
    await processWorkerPhase({ phase: "submit", ...runArgs(redis, minds) });
    minds.getHistory = async () => [{ alias: "greenroom-run_b", fingerprint: "zz_reply", senderType: 0, messageText: body }];
    const result = await processWorkerPhase({ phase: "collect", ...runArgs(redis, minds) });
    assert.equal(result.body.status, "FAILED");
    assert.match(result.body.error, pattern);
    assert.equal(redis.json("greenroom:briefing:run_b"), undefined);
  });
}

test("Run B completion never reads or returns Run A briefing", async () => {
  const redis = initialRedis();
  redis.values.set("greenroom:latest_briefing", JSON.stringify({ run_id: "run_a", objective_id: "obj_a" }));
  redis.values.set("greenroom:briefing:run_a", JSON.stringify({ run_id: "run_a", objective_id: "obj_a" }));
  const minds = fakeMinds([]);
  await processWorkerPhase({ phase: "submit", ...runArgs(redis, minds) });
  minds.getHistory = async () => [{ alias: "greenroom-run_b", fingerprint: "zz_reply", senderType: 0, messageText: VALID }];
  const result = await processWorkerPhase({ phase: "collect", ...runArgs(redis, minds) });
  assert.equal(result.body.briefing.run_id, "run_b");
  assert.equal(redis.json("greenroom:briefing:run_a").run_id, "run_a");
});
