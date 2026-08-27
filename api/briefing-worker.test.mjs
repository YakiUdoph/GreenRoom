import test from "node:test";
import assert from "node:assert/strict";
import { processWorkerPhase, scheduleCollection } from "./briefing-worker.mjs";

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

function fakeMinds(history = [], sse = { timedOut: true }) {
  const calls = { send: 0, history: 0, wait: 0, waitOptions: [] };
  return {
    calls,
    async getMind() { return { mindId: "8208493e-f36b-1410-8466-00039ce7df11", email: "udophia@hellominds.ai", walletAddress: "0xB675Ec9857776678aE540cF3248d898f015987Cb", isEnabled: true }; },
    async ensureConversation(alias) { return { conversationId: "conversation-safe", alias }; },
    async getLatestHistoryFingerprint() { return "fp_before"; },
    async sendMessage() { calls.send++; return { messageId: "message-safe", ignoredSecret: "no-store" }; },
    async waitForReply(options) { calls.wait++; calls.waitOptions.push(options); return typeof sse === "function" ? sse(calls.wait) : sse; },
    async getHistory() { calls.history++; return typeof history === "function" ? history(calls.history) : history; },
  };
}

const env = { QSTASH_TOKEN: "test", MINDS_REPLY_DEADLINE_MS: "600000" };
const targetUrl = "https://example.test/api/briefing-worker";
const runArgs = (redis, mindsClient, extras = {}) => ({ redis, mindsClient, runId: "run_b", objective: OBJECTIVE, targetUrl, env, executionPath: "legacy_minds", enqueue: async () => ({ messageId: "qstash-safe" }), ...extras });

function qstashResponse(status, body = {}) {
  return { ok: status >= 200 && status < 300, status, async text() { return typeof body === "string" ? body : JSON.stringify(body); } };
}

test("QStash primary host success publishes once without fallback", async () => {
  const requests = [];
  const result = await scheduleCollection(targetUrl, { run_id: "run_b", objective: OBJECTIVE }, { QSTASH_TOKEN: "secret", QSTASH_URL: "https://primary.example" }, 5, async (url, options) => {
    requests.push({ url, options });
    return qstashResponse(201, { messageId: "message-primary" });
  });
  assert.equal(requests.length, 1);
  assert.match(requests[0].url, /^https:\/\/primary\.example\/v2\/publish\//);
  assert.equal(result.messageId, "message-primary");
  assert.equal(result.host, "primary.example");
});

test("QStash regional 404 falls back with unchanged payload and delay", async () => {
  const requests = [];
  const result = await scheduleCollection(targetUrl, { run_id: "run_b", objective: OBJECTIVE }, { QSTASH_TOKEN: "secret", QSTASH_URL: "https://primary.example" }, 5, async (url, options) => {
    requests.push({ url, options });
    return requests.length === 1
      ? qstashResponse(404, "queue was not found in this region")
      : qstashResponse(200, { messageId: "message-fallback" });
  });
  assert.equal(requests.length, 2);
  assert.match(requests[1].url, /^https:\/\/qstash-us-east-1\.upstash\.io\/v2\/publish\//);
  assert.equal(requests[1].options.headers["Upstash-Delay"], "5s");
  assert.deepEqual(JSON.parse(requests[1].options.body), { run_id: "run_b", objective: OBJECTIVE, phase: "collect" });
  assert.equal(result.messageId, "message-fallback");
  assert.equal(result.host, "qstash-us-east-1.upstash.io");
});

test("QStash can succeed on a later supported regional host", async () => {
  const hosts = [];
  const result = await scheduleCollection(targetUrl, { run_id: "run_b", objective: OBJECTIVE }, { QSTASH_TOKEN: "secret", QSTASH_URL: "https://primary.example" }, 10, async (url) => {
    hosts.push(new URL(url).host);
    return hosts.length < 3 ? qstashResponse(404, "not found in this region") : qstashResponse(201, { messageId: "message-third" });
  });
  assert.deepEqual(hosts, ["primary.example", "qstash-us-east-1.upstash.io", "qstash-us-west-1.upstash.io"]);
  assert.equal(result.messageId, "message-third");
});

test("all regional mismatches fail safely without a fake published result", async () => {
  const hosts = [];
  await assert.rejects(
    scheduleCollection(targetUrl, { run_id: "run_b", objective: OBJECTIVE }, { QSTASH_TOKEN: "secret", QSTASH_URL: "https://primary.example" }, 15, async (url) => {
      hosts.push(new URL(url).host);
      return qstashResponse(404, "not found in this region");
    }),
    /regional HTTP 404/,
  );
  assert.deepEqual(hosts, ["primary.example", "qstash-us-east-1.upstash.io", "qstash-us-west-1.upstash.io", "qstash-eu-west-1.upstash.io", "qstash.upstash.io"]);
});

for (const status of [400, 401, 403]) {
  test(`QStash HTTP ${status} fails immediately without regional fallback`, async () => {
    let requests = 0;
    await assert.rejects(
      scheduleCollection(targetUrl, { run_id: "run_b", objective: OBJECTIVE }, { QSTASH_TOKEN: "secret", QSTASH_URL: "https://primary.example" }, 5, async () => {
        requests++;
        return qstashResponse(status, "request rejected");
      }),
      new RegExp(`HTTP ${status}`),
    );
    assert.equal(requests, 1);
  });
}

test("an arbitrary HTTP 404 does not trigger regional fallback", async () => {
  let requests = 0;
  await assert.rejects(
    scheduleCollection(targetUrl, { run_id: "run_b", objective: OBJECTIVE }, { QSTASH_TOKEN: "secret", QSTASH_URL: "https://primary.example" }, 5, async () => {
      requests++;
      return qstashResponse(404, "route not found");
    }),
    /HTTP 404/,
  );
  assert.equal(requests, 1);
});

test("HTTP 5xx does not trigger regional fallback", async () => {
  let requests = 0;
  await assert.rejects(
    scheduleCollection(targetUrl, { run_id: "run_b", objective: OBJECTIVE }, { QSTASH_TOKEN: "secret", QSTASH_URL: "https://primary.example" }, 5, async () => {
      requests++;
      return qstashResponse(503, "temporarily unavailable");
    }),
    /HTTP 503/,
  );
  assert.equal(requests, 1);
});

test("network failure does not trigger regional fallback", async () => {
  let requests = 0;
  await assert.rejects(
    scheduleCollection(targetUrl, { run_id: "run_b", objective: OBJECTIVE }, { QSTASH_TOKEN: "secret", QSTASH_URL: "https://primary.example" }, 5, async () => {
      requests++;
      throw new Error("network unavailable");
    }),
    /network unavailable/,
  );
  assert.equal(requests, 1);
});

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
  assert.equal(status.collection_schedule_attempt, 1);
  assert.equal(status.last_collection_schedule.outcome, "PUBLISHED");
  assert.equal(status.last_collection_schedule.delay_seconds, 5);
  assert.equal(status.last_collection_schedule.target_host, "example.test");
  assert.equal("ignoredSecret" in status.message_metadata, false);
  assert.equal(typeof status.submitted_prompt_hash, "string");
  assert.equal(status.memory_selection.memory_selection_version, "objective_memory_projection_v2");
  assert.equal(status.memory_selection.selected_memory_node_count, 0);
  assert.equal(status.memory_selection.selected_rule_count, 1);
  assert.equal(status.memory_selection.selected_rule_hashes.length, 1);
  assert.equal(typeof status.memory_selection.compact_prompt_character_count, "number");
  assert.ok(status.memory_selection.compact_prompt_character_count < 4_000);
  assert.equal(JSON.stringify(status).includes("Persisted creator memory"), false);
});

test("failed continuation publication persists safe scheduling diagnostics", async () => {
  const redis = initialRedis();
  const minds = fakeMinds();
  await assert.rejects(
    processWorkerPhase({
      phase: "submit",
      ...runArgs(redis, minds, {
        enqueue: async () => { throw new Error("QStash collection scheduling failed with HTTP 404"); },
      }),
    }),
    /HTTP 404/,
  );
  const status = redis.json("greenroom:run_status:run_b");
  assert.equal(status.status, "WAITING_FOR_MINDS");
  assert.equal(status.collection_attempt, 0);
  assert.equal(status.collection_schedule_attempt, 1);
  assert.equal(status.last_collection_schedule.outcome, "FAILED");
  assert.match(status.last_collection_schedule.error, /HTTP 404/);
  assert.equal(status.last_collection_schedule.target_host, "example.test");
});

test("successful regional fallback persists the real QStash message ID", async () => {
  const redis = initialRedis();
  const minds = fakeMinds();
  let requests = 0;
  const fallbackEnv = { ...env, QSTASH_URL: "https://primary.example" };
  const enqueue = (url, payload, activeEnv, delay) => scheduleCollection(url, payload, activeEnv, delay, async () => {
    requests++;
    return requests === 1
      ? qstashResponse(404, "not found in this region")
      : qstashResponse(201, { messageId: "persisted-fallback-message" });
  });
  await processWorkerPhase({ phase: "submit", ...runArgs(redis, minds, { env: fallbackEnv, enqueue }) });
  const status = redis.json("greenroom:run_status:run_b");
  assert.equal(minds.calls.send, 1);
  assert.equal(status.last_collection_schedule.outcome, "PUBLISHED");
  assert.equal(status.collection_schedule_metadata.messageId, "persisted-fallback-message");
  assert.equal(status.collection_schedule_metadata.host, "qstash-us-east-1.upstash.io");
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
  const observation = redis.json("greenroom:run_status:run_b").last_history_observation;
  assert.equal(typeof observation.checked_at, "string");
  assert.equal(observation.row_count, 0);
  assert.deepEqual(observation.fingerprints, []);
  assert.deepEqual(observation.sender_types, []);
  assert.equal(schedules, 3);
});

test("bounded SSE reply completes the run without history fallback", async () => {
  const redis = initialRedis();
  const reply = { alias: "greenroom-run_b", fingerprint: "zz_reply", senderType: 0, mindId: "8208493e-f36b-1410-8466-00039ce7df11", messageText: VALID };
  const minds = fakeMinds([], { reply, timedOut: false });
  await processWorkerPhase({ phase: "submit", ...runArgs(redis, minds) });
  const result = await processWorkerPhase({ phase: "collect", ...runArgs(redis, minds) });
  assert.equal(result.body.status, "COMPLETED");
  assert.equal(minds.calls.wait, 1);
  assert.equal(minds.calls.waitOptions[0].timeoutMs, 15_000);
  assert.equal(minds.calls.history, 0);
  assert.equal(minds.calls.send, 1);
  assert.equal(redis.json("greenroom:briefing:run_b").run_id, "run_b");
  assert.equal(redis.json("greenroom:run_status:run_b").last_collection_transport.reply_source, "sse");
});

test("SSE timeout recovers a verified reply from history", async () => {
  const redis = initialRedis();
  const reply = { alias: "greenroom-run_b", fingerprint: "zz_reply", senderType: 0, messageText: VALID };
  const minds = fakeMinds([reply]);
  await processWorkerPhase({ phase: "submit", ...runArgs(redis, minds) });
  const result = await processWorkerPhase({ phase: "collect", ...runArgs(redis, minds) });
  assert.equal(result.body.status, "COMPLETED");
  assert.equal(minds.calls.wait, 1);
  assert.equal(minds.calls.history, 1);
  assert.equal(redis.json("greenroom:run_status:run_b").last_collection_transport.reply_source, "history");
});

test("SSE SDK error falls back safely to history", async () => {
  const redis = initialRedis();
  const reply = { alias: "greenroom-run_b", fingerprint: "zz_reply", senderType: 0, messageText: VALID };
  const minds = fakeMinds([reply], () => { const error = new Error("sensitive details"); error.name = "TransportError"; throw error; });
  await processWorkerPhase({ phase: "submit", ...runArgs(redis, minds) });
  const result = await processWorkerPhase({ phase: "collect", ...runArgs(redis, minds) });
  assert.equal(result.body.status, "COMPLETED");
  const telemetry = redis.json("greenroom:run_status:run_b").last_collection_transport;
  assert.equal(telemetry.sse_result, "sdk_error");
  assert.equal(telemetry.sse_error_type, "TransportError");
  assert.equal(JSON.stringify(telemetry).includes("sensitive details"), false);
});

test("invalid SSE candidates are rejected before history recovery", async () => {
  for (const candidate of [
    { alias: "greenroom-run_b", fingerprint: "zz_reply", senderType: 1, messageText: VALID },
    { alias: "wrong", fingerprint: "zz_reply", senderType: 0, messageText: VALID },
    { alias: "greenroom-run_b", fingerprint: "aa", senderType: 0, messageText: VALID },
  ]) {
    const redis = initialRedis();
    const minds = fakeMinds([], { reply: candidate, timedOut: false });
    await processWorkerPhase({ phase: "submit", ...runArgs(redis, minds) });
    const result = await processWorkerPhase({ phase: "collect", ...runArgs(redis, minds) });
    assert.equal(result.body.status, "WAITING_FOR_MINDS");
    assert.equal(minds.calls.history, 1);
    assert.equal(redis.json("greenroom:briefing:run_b"), undefined);
  }
});

test("SSE prompt echo is rejected using the persisted prompt hash", async () => {
  const redis = initialRedis();
  const minds = fakeMinds();
  await processWorkerPhase({ phase: "submit", ...runArgs(redis, minds) });
  const status = redis.json("greenroom:run_status:run_b");
  minds.waitForReply = async () => ({ reply: { alias: status.conversation_alias, fingerprint: "zz_reply", senderType: 0, messageText: "echo" }, timedOut: false });
  status.submitted_prompt_hash = (await import("node:crypto")).createHash("sha256").update("echo").digest("hex");
  await redis.set("greenroom:run_status:run_b", JSON.stringify(status));
  const result = await processWorkerPhase({ phase: "collect", ...runArgs(redis, minds) });
  assert.equal(result.body.status, "WAITING_FOR_MINDS");
  assert.equal(redis.json("greenroom:briefing:run_b"), undefined);
});

test("malformed verified SSE JSON fails strictly without polling again", async () => {
  const redis = initialRedis();
  const minds = fakeMinds([], { reply: { alias: "greenroom-run_b", fingerprint: "zz_reply", senderType: 0, messageText: '{"items":[' }, timedOut: false });
  await processWorkerPhase({ phase: "submit", ...runArgs(redis, minds) });
  const result = await processWorkerPhase({ phase: "collect", ...runArgs(redis, minds) });
  assert.equal(result.body.status, "FAILED");
  assert.match(result.body.error, /not valid briefing JSON/);
  assert.equal(minds.calls.history, 0);
  assert.equal(redis.json("greenroom:briefing:run_b"), undefined);
});

test("terminal runs perform no SSE or history work", async () => {
  for (const terminal of ["COMPLETED", "FAILED"]) {
    const redis = initialRedis();
    const status = redis.json("greenroom:run_status:run_b");
    status.status = terminal;
    await redis.set("greenroom:run_status:run_b", JSON.stringify(status));
    const minds = fakeMinds();
    const result = await processWorkerPhase({ phase: "collect", ...runArgs(redis, minds) });
    assert.equal(result.body.status, terminal);
    assert.equal(minds.calls.wait, 0);
    assert.equal(minds.calls.history, 0);
    assert.equal(minds.calls.send, 0);
  }
});

test("deadline is enforced before starting a bounded SSE wait", async () => {
  const redis = initialRedis();
  const minds = fakeMinds();
  await processWorkerPhase({ phase: "submit", ...runArgs(redis, minds) });
  const status = redis.json("greenroom:run_status:run_b");
  const result = await processWorkerPhase({ phase: "collect", ...runArgs(redis, minds, { now: new Date(Date.parse(status.reply_deadline_at) + 1) }) });
  assert.equal(result.body.status, "FAILED");
  assert.equal(minds.calls.wait, 0);
  assert.equal(minds.calls.history, 0);
});

test("collection scheduling applies 5s, 10s and 15s adaptive QStash delays", async () => {
  const redis = initialRedis();
  const minds = fakeMinds([]);
  const delays = [];
  const enqueue = async (_target, _payload, _env, delay) => { delays.push(delay); return {}; };
  await processWorkerPhase({ phase: "submit", ...runArgs(redis, minds, { enqueue }) });
  const submitted = redis.json("greenroom:run_status:run_b").submitted_at;
  await processWorkerPhase({ phase: "collect", ...runArgs(redis, minds, { enqueue, now: new Date(Date.parse(submitted) + 30_000) }) });
  await processWorkerPhase({ phase: "collect", ...runArgs(redis, minds, { enqueue, now: new Date(Date.parse(submitted) + 90_000) }) });
  await processWorkerPhase({ phase: "collect", ...runArgs(redis, minds, { enqueue, now: new Date(Date.parse(submitted) + 130_000) }) });
  assert.deepEqual(delays, [5, 5, 10, 15]);
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

test("newest-first history recovery fetches the current page without an older-page cursor", async () => {
  const redis = initialRedis();
  const minds = fakeMinds([]);
  await processWorkerPhase({ phase: "submit", ...runArgs(redis, minds) });
  let historyOptions;
  minds.getHistory = async (_alias, options) => {
    historyOptions = options;
    return [
      { alias: "greenroom-run_b", fingerprint: "zz_reply", senderType: 0, messageText: VALID },
      { alias: "greenroom-run_b", fingerprint: "aa_old", senderType: 0, messageText: VALID },
    ];
  };
  const result = await processWorkerPhase({ phase: "collect", ...runArgs(redis, minds) });
  assert.equal(result.body.status, "COMPLETED");
  assert.deepEqual(historyOptions, { limit: 50 });
  assert.equal(redis.json("greenroom:run_status:run_b").last_history_observation.fingerprints[0], "zz_reply");
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
