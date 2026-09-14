import test from "node:test";
import assert from "node:assert/strict";
import { cleanParsedSection, parseMindPlainResponse, processWorkerPhase, scheduleCollection } from "./briefing-worker.mjs";

const OBJECTIVE = Object.freeze({ objective_id: "obj_video", title: "Watch for meaningful AI video-tool updates.", constraints: "Prefer practical tools.", fingerprint: "fp_objective" });
const EVIDENCE = Object.freeze({ source: "Adobe Blog", source_url: "https://blog.adobe.com/en/publish/2026/08/27/adobe-video.html", title: "Adobe video update", summary: "Adobe published an AI video workflow update.", published_at: "2026-08-27T00:00:00.000Z", retrieved_at: "2026-08-27T12:00:00.000Z", evidence_mode: "LIVE", category: "ai_video_workflow" });
const PLAIN_REPLY = "ATTENTION: KEEP_WATCHING\nWHY IT MATTERS\nThis matches your practical-tool preference, but access is not established.\nWHAT TO DO NEXT\nCheck the official source before changing your workflow.";

class FakeRedis {
  constructor(values = {}) { this.values = new Map(Object.entries(values)); }
  async get(key) { return this.values.get(key) ?? null; }
  async set(key, value, options) {
    if (options?.nx && this.values.has(key)) return null;
    this.values.set(key, value); return "OK";
  }
  json(key) { const value = this.values.get(key); return typeof value === "string" ? JSON.parse(value) : value; }
}

function initialRedis() {
  return new FakeRedis({
    "greenroom:run_status:run_live": JSON.stringify({ run_id: "run_live", status: "QUEUED", queued_at: "2026-08-27T11:59:00.000Z", objective_snapshot: OBJECTIVE }),
    "greenroom:recent_runs": "[]",
    "greenroom:creator_profile": JSON.stringify({ learned_voice_rules: ["Prefer practical tools."], memory_nodes: [] }),
  });
}

function fakeMinds(reply = null) {
  const calls = { send: 0, messages: [] };
  return {
    calls,
    async getMind() { return { mindId: "8208493e-f36b-1410-8466-00039ce7df11", email: "udophia@hellominds.ai", walletAddress: "0xB675Ec9857776678aE540cF3248d898f015987Cb", isEnabled: true }; },
    async ensureConversation(alias) { return { alias, conversationId: "safe" }; },
    async getLatestHistoryFingerprint() { return "fp_before"; },
    async sendMessage({ messageText }) { calls.send++; calls.messages.push(messageText); return { messageId: "safe" }; },
    async waitForReply() { return reply ? { timedOut: false, reply } : { timedOut: true }; },
    async getHistory() { return []; },
  };
}

const fetchLive = async () => ({ status: "EVIDENCE_READY", domain: "AI_VIDEO", provider_ids: ["ADOBE_BLOG"], evidence: [EVIDENCE] });
const enqueue = async () => ({ messageId: "qstash-safe" });
const args = (redis, mindsClient, extras = {}) => ({ redis, mindsClient, runId: "run_live", objective: OBJECTIVE, targetUrl: "https://example.test/api/briefing-worker", env: { QSTASH_TOKEN: "test", MINDS_REPLY_DEADLINE_MS: "600000" }, fetchEvidence: fetchLive, enqueue, ...extras });

test("decision sections are sanitized and all attention verdicts remain strict", () => {
  assert.equal(cleanParsedSection("<b>Useful</b><br>Change"), "Useful\nChange");
  for (const verdict of ["ACT_NOW", "KEEP_WATCHING", "IGNORE_FOR_NOW"]) {
    assert.equal(parseMindPlainResponse(`ATTENTION: ${verdict}\nWHY IT MATTERS\nRelevant.\nWHAT TO DO NEXT\nReview it.`).attention_verdict, verdict);
  }
  assert.throws(() => parseMindPlainResponse("ATTENTION: URGENT\nWHY IT MATTERS\nRelevant.\nWHAT TO DO NEXT\nReview it."), /verdict was missing or invalid/);
});

test("live submission uses fetched evidence and selected Memory without simulated candidates", async () => {
  const redis = initialRedis();
  const minds = fakeMinds();
  const result = await processWorkerPhase({ phase: "submit", ...args(redis, minds) });
  assert.equal(result.body.status, "WAITING_FOR_MINDS");
  assert.equal(minds.calls.send, 1);
  assert.match(minds.calls.messages[0], /Adobe video update/);
  assert.match(minds.calls.messages[0], /Prefer practical tools/);
  assert.doesNotMatch(minds.calls.messages[0], /simulat|demo dataset/i);
  const status = redis.json("greenroom:run_status:run_live");
  assert.equal(status.evidence_mode, "LIVE");
  assert.equal(status.evidence_snapshot.source_url, EVIDENCE.source_url);
});

test("verified live reply persists complete run, Mind, source and Memory provenance", async () => {
  const redis = initialRedis();
  const reply = { alias: "greenroom-run_live", fingerprint: "fp_reply", senderType: 0, messageText: PLAIN_REPLY };
  const minds = fakeMinds(reply);
  await processWorkerPhase({ phase: "submit", ...args(redis, minds) });
  const result = await processWorkerPhase({ phase: "collect", ...args(redis, minds) });
  const briefing = result.body.briefing;
  assert.equal(result.body.status, "COMPLETED");
  assert.equal(briefing.evidence_mode, "LIVE");
  assert.equal(briefing.run_id, "run_live");
  assert.equal(briefing.objective_snapshot.fingerprint, OBJECTIVE.fingerprint);
  assert.equal(briefing.minds_verified, true);
  assert.equal(briefing.provenance.minds_verified, true);
  assert.equal(briefing.sources[0].source_url, EVIDENCE.source_url);
  assert.deepEqual(briefing.learned_rules_active, ["Prefer practical tools."]);
});

test("provider failure, unsupported domain and empty evidence cannot create a briefing", async () => {
  for (const [fetchEvidence, expected] of [
    [async () => { const error = new Error("private upstream detail"); error.code = "SOURCE_TIMEOUT"; throw error; }, "FAILED"],
    [async () => ({ status: "UNSUPPORTED_DOMAIN", domain: "UNSUPPORTED", provider_ids: [], evidence: [] }), "UNSUPPORTED_DOMAIN"],
    [async () => ({ status: "NO_RELEVANT_LIVE_EVIDENCE", domain: "AI_VIDEO", provider_ids: ["ADOBE_BLOG"], evidence: [] }), "NO_RELEVANT_UPDATE"],
  ]) {
    const redis = initialRedis();
    const result = await processWorkerPhase({ phase: "submit", ...args(redis, fakeMinds(), { fetchEvidence }) });
    assert.equal(result.body.status, expected);
    assert.equal(redis.json("greenroom:briefing:run_live"), undefined);
  }
});

test("missing Mind and malformed Mind reply cannot become deterministic success", async () => {
  const missingRedis = initialRedis();
  const missing = await processWorkerPhase({ phase: "submit", ...args(missingRedis, null) });
  assert.equal(missing.body.status, "FAILED");
  assert.equal(missingRedis.json("greenroom:briefing:run_live"), undefined);

  const malformedRedis = initialRedis();
  const malformedReply = { alias: "greenroom-run_live", fingerprint: "fp_reply", senderType: 0, messageText: "ATTENTION: URGENT" };
  const minds = fakeMinds(malformedReply);
  await processWorkerPhase({ phase: "submit", ...args(malformedRedis, minds) });
  const malformed = await processWorkerPhase({ phase: "collect", ...args(malformedRedis, minds) });
  assert.equal(malformed.body.status, "FAILED");
  assert.equal(malformedRedis.json("greenroom:briefing:run_live"), undefined);
});

test("Mind identity mismatch fails before message submission", async () => {
  const redis = initialRedis();
  const minds = fakeMinds();
  minds.getMind = async () => ({ mindId: "wrong", email: "wrong@example.com", walletAddress: "0x0", isEnabled: true });
  const result = await processWorkerPhase({ phase: "submit", ...args(redis, minds) });
  assert.equal(result.body.status, "FAILED");
  assert.equal(minds.calls.send, 0);
  assert.equal(redis.json("greenroom:briefing:run_live"), undefined);
});

test("duplicate submission sends the Mind prompt only once", async () => {
  const redis = initialRedis();
  const minds = fakeMinds();
  await processWorkerPhase({ phase: "submit", ...args(redis, minds) });
  await processWorkerPhase({ phase: "submit", ...args(redis, minds) });
  assert.equal(minds.calls.send, 1);
});

test("QStash scheduling is bounded and reports failure without fallback success", async () => {
  let calls = 0;
  await assert.rejects(scheduleCollection("https://example.test/worker", { run_id: "run_live", objective: OBJECTIVE }, { QSTASH_TOKEN: "secret", QSTASH_URL: "https://primary.example" }, 5, async () => {
    calls++; return { ok: false, status: 503, async text() { return "unavailable"; } };
  }), /HTTP 503/);
  assert.equal(calls, 1);
});
