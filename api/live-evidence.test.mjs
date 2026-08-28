import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  buildDeterministicLiveBriefing,
  classifyLiveDomain,
  fetchAdobeLiveEvidence,
  fetchYouTubePlatformChanges,
  LIVE_DOMAIN_AI_VIDEO,
  LIVE_DOMAIN_PLATFORM_CHANGES,
  LIVE_DOMAIN_UNSUPPORTED,
  normalizeAdobeItem,
  parseAdobeDate,
  parseAdobeQueryIndex,
  parseYouTubeOfficialBlogRss,
  normalizeYouTubeBlogItem,
  YOUTUBE_RSS_MAX_BYTES,
  retrieveLiveEvidenceForObjective,
} from "./live-evidence.mjs";
import { processWorkerPhase } from "./briefing-worker.mjs";

const NOW = new Date("2026-08-26T12:00:00.000Z");
const serial = (iso) => (Date.parse(iso) - Date.UTC(1899, 11, 30)) / 86_400_000;
const currentVideo = {
  date: serial("2026-03-19T00:00:00.000Z"),
  title: "Adobe Firefly expands video and image creation with new AI capabilities",
  description: "Firefly adds AI video editing tools and new generative video capabilities for creative workflows.",
  path: "/en/publish/2026/03/19/adobe-firefly-expands-video-image-creation",
};
const adobeCanary = {
  date: 46100,
  title: "Adobe Firefly expands video and image creation with new AI capabilities and custom models",
  description: "",
  path: "/en/publish/2026/03/19/adobe-firefly-expands-video-image-creation-with-new-ai-capabilities-custom-models",
};

test(".env.example contains names with empty values only", () => {
  const lines = fs.readFileSync(new URL("../.env.example", import.meta.url), "utf8").split(/\r?\n/).filter(Boolean);
  assert.ok(lines.length > 0);
  assert.ok(lines.every((line) => /^[A-Z][A-Z0-9_]*=$/.test(line)));
});

test("Adobe numeric source dates use the Excel epoch", () => {
  assert.equal(parseAdobeDate(41453).toISOString(), "2013-06-28T00:00:00.000Z");
  assert.equal(parseAdobeDate(String(serial("2026-03-19T00:00:00.000Z"))).toISOString(), "2026-03-19T00:00:00.000Z");
});

test("current strongly relevant AI-video metadata is normalized with complete live provenance", () => {
  const item = normalizeAdobeItem(currentVideo, { now: NOW });
  assert.equal(item.evidence_mode, "LIVE");
  assert.equal(item.published_at, "2026-03-19T00:00:00.000Z");
  assert.equal(item.retrieved_at, NOW.toISOString());
  assert.equal(item.source, "Adobe Blog");
  assert.equal(item.source_url, "https://blog.adobe.com/en/publish/2026/03/19/adobe-firefly-expands-video-image-creation");
});

test("known March 19 Adobe discovery canary passes without becoming a fallback", () => {
  const item = normalizeAdobeItem(adobeCanary, { now: NOW });
  assert.equal(item.source, "Adobe Blog");
  assert.equal(item.title, adobeCanary.title);
  assert.equal(item.summary, adobeCanary.title);
  assert.equal(item.published_at, "2026-03-19T00:00:00.000Z");
  assert.equal(item.source_url, `https://blog.adobe.com${adobeCanary.path}`);
});

test("2013 FrameMaker incidental videos false positive is rejected", () => {
  assert.equal(normalizeAdobeItem({
    date: 41453,
    title: "FrameMaker and Word: advanced indexing",
    description: "A collection of recent videos about indexing, lists, and prefixes.",
    path: "/en/publish/2013/06/28/writeright-framemaker-word",
  }, { now: NOW }), null);
});

test("unrelated current Adobe item is rejected", () => {
  assert.equal(normalizeAdobeItem({
    date: serial("2026-07-01T00:00:00.000Z"),
    title: "New Illustrator productivity controls",
    description: "Vector design controls improve everyday illustration workflows.",
    path: "/en/publish/2026/07/01/illustrator-productivity",
  }, { now: NOW }), null);
});

test("malformed, future, and stale items are rejected", () => {
  assert.equal(normalizeAdobeItem(null, { now: NOW }), null);
  assert.equal(normalizeAdobeItem({ ...currentVideo, date: "not-a-date" }, { now: NOW }), null);
  assert.equal(normalizeAdobeItem({ ...currentVideo, date: serial("2026-08-27T00:00:00.000Z") }, { now: NOW }), null);
  assert.equal(normalizeAdobeItem({ ...currentVideo, date: serial("2025-01-01T00:00:00.000Z") }, { now: NOW }), null);
});

test("query parser reports candidate and relevant counts without fallback", () => {
  const parsed = parseAdobeQueryIndex({ data: [currentVideo, { title: "unrelated" }] }, { now: NOW });
  assert.equal(parsed.candidate_count, 2);
  assert.equal(parsed.relevant_count, 1);
  assert.deepEqual(parsed.evidence, [normalizeAdobeItem(currentVideo, { now: NOW })]);
  assert.throws(() => parseAdobeQueryIndex({ items: [] }, { now: NOW }), /data array/);
});

test("objective classification routes AI video only to its first live vertical", () => {
  assert.equal(classifyLiveDomain({ title: "Keep me updated on important AI video tools that could improve my workflow." }), LIVE_DOMAIN_AI_VIDEO);
  assert.equal(classifyLiveDomain({ title: "Improve my long-form writing workflow." }), LIVE_DOMAIN_UNSUPPORTED);
});

test("platform-change classification requires monitoring intent and creator impact", () => {
  assert.equal(classifyLiveDomain({ title: "Tell me when YouTube changes something that could affect my channel." }), LIVE_DOMAIN_PLATFORM_CHANGES);
  assert.equal(classifyLiveDomain({ title: "Watch for important platform changes that might affect creators." }), LIVE_DOMAIN_PLATFORM_CHANGES);
  assert.equal(classifyLiveDomain({ title: "Keep an eye on YouTube updates that could impact growth." }), LIVE_DOMAIN_PLATFORM_CHANGES);
  assert.equal(classifyLiveDomain({ title: "Write a YouTube video about growth." }), LIVE_DOMAIN_UNSUPPORTED);
  assert.equal(classifyLiveDomain({ title: "Track AI video generation updates on YouTube." }), LIVE_DOMAIN_AI_VIDEO);
});

const youtubeRss = `<?xml version="1.0"?><rss><channel><title>YouTube Official Blog</title>
  <item><title>New opportunities to earn and changes to the YouTube Partner Program</title><link>https://blog.youtube/news-and-events/youtube-partner-program-updates/</link><description>Important monetization changes for creators and their channels.</description><pubDate>Thu, 20 Aug 2026 16:00:00 +0000</pubDate><category>Creators</category><category>Monetization</category></item>
  <item><title>A creator celebrates ten years on YouTube</title><link>https://blog.youtube/creator-and-artist-stories/ten-years/</link><description>A profile of a creator's career.</description><pubDate>Wed, 19 Aug 2026 16:00:00 +0000</pubDate><category>Creators</category></item>
</channel></rss>`;

test("YouTube official RSS normalizes only relevant platform changes", () => {
  const parsed = parseYouTubeOfficialBlogRss(youtubeRss, { now: NOW });
  assert.equal(parsed.candidate_count, 2);
  assert.equal(parsed.fresh_count, 2);
  assert.equal(parsed.relevant_count, 1);
  assert.equal(parsed.evidence[0].source, "YouTube Official Blog");
  assert.equal(parsed.evidence[0].evidence_mode, "LIVE");
  assert.equal(parsed.evidence[0].published_at, "2026-08-20T16:00:00.000Z");
  assert.equal(parsed.evidence[0].retrieved_at, NOW.toISOString());
  assert.match(parsed.evidence[0].source_url, /^https:\/\/blog\.youtube\//);
  assert.throws(() => parseYouTubeOfficialBlogRss("not rss", { now: NOW }), /valid RSS channel/);
  assert.throws(() => parseYouTubeOfficialBlogRss(`<rss><channel>${"x".repeat(YOUTUBE_RSS_MAX_BYTES + 1)}</channel></rss>`, { now: NOW }), /size limit/);
});

test("YouTube normalization rejects unofficial, future, stale, and unrelated items", () => {
  const base = { title: "YouTube changes creator monetization eligibility", description: "A new Partner Program policy for creator channels.", pubDate: "2026-08-20T00:00:00Z", link: "https://blog.youtube/news-and-events/ypp-update/", categories: ["Creators", "Monetization"] };
  assert.ok(normalizeYouTubeBlogItem(base, { now: NOW }));
  assert.equal(normalizeYouTubeBlogItem({ ...base, link: "https://example.com/ypp-update" }, { now: NOW }), null);
  assert.equal(normalizeYouTubeBlogItem({ ...base, pubDate: "2026-08-27T00:00:00Z" }, { now: NOW }), null);
  assert.equal(normalizeYouTubeBlogItem({ ...base, pubDate: "2024-01-01T00:00:00Z" }, { now: NOW }), null);
  assert.equal(normalizeYouTubeBlogItem({ ...base, title: "A creator profile", description: "An interview about a career.", categories: ["Creators"] }, { now: NOW }), null);
});

test("YouTube provider is bounded and fails without fallback", async () => {
  let calls = 0;
  const result = await fetchYouTubePlatformChanges({ now: NOW, fetchImpl: async (url, options) => {
    calls++;
    assert.equal(url, "https://blog.youtube/rss/");
    assert.ok(options.signal);
    return { ok: true, async text() { return youtubeRss; } };
  } });
  assert.equal(calls, 1);
  assert.equal(result.request_count, 1);
  assert.equal(result.relevant_count, 1);
  await assert.rejects(fetchYouTubePlatformChanges({ fetchImpl: async () => ({ ok: false, status: 503 }) }), (error) => error.code === "SOURCE_UNAVAILABLE");
  await assert.rejects(fetchYouTubePlatformChanges({ fetchImpl: async () => ({ ok: true, async text() { return "bad"; } }) }), (error) => error.code === "MALFORMED_SOURCE");
});

test("platform changes use the shared provider registry lifecycle", async () => {
  const result = await retrieveLiveEvidenceForObjective({
    objective: { title: "Tell me when YouTube changes something that could affect my channel." },
    now: NOW,
    registry: { [LIVE_DOMAIN_PLATFORM_CHANGES]: [{ provider_id: "YOUTUBE_TEST", retrieve: async () => ({ candidate_count: 2, fresh_count: 2, request_count: 1, evidence: parseYouTubeOfficialBlogRss(youtubeRss, { now: NOW }).evidence }) }] },
  });
  assert.equal(result.domain, LIVE_DOMAIN_PLATFORM_CHANGES);
  assert.equal(result.status, "EVIDENCE_READY");
  assert.deepEqual(result.provider_ids, ["YOUTUBE_TEST"]);
  assert.equal(result.evidence[0].category, "platform_change");
});

test("AI video retrieval uses the registered provider and returns generic live evidence", async () => {
  let calls = 0;
  const evidence = normalizeAdobeItem(currentVideo, { now: NOW });
  const result = await retrieveLiveEvidenceForObjective({
    objective: { title: "Track generative video tools" },
    now: NOW,
    registry: {
      [LIVE_DOMAIN_AI_VIDEO]: [{
        provider_id: "TEST_PROVIDER",
        retrieve: async () => {
          calls++;
          return { candidate_count: 1, fresh_count: 1, request_count: 1, evidence: [evidence] };
        },
      }],
    },
  });
  assert.equal(calls, 1);
  assert.equal(result.status, "EVIDENCE_READY");
  assert.deepEqual(result.provider_ids, ["TEST_PROVIDER"]);
  for (const field of ["source", "source_url", "published_at", "retrieved_at", "title", "summary", "evidence_mode"]) {
    assert.ok(result.evidence[0][field], `missing generic evidence field ${field}`);
  }
});

test("unsupported objectives make no provider call and never substitute simulation", async () => {
  let calls = 0;
  const result = await retrieveLiveEvidenceForObjective({
    objective: { title: "Improve my long-form writing workflow." },
    now: NOW,
    registry: { [LIVE_DOMAIN_AI_VIDEO]: [{ provider_id: "SHOULD_NOT_RUN", retrieve: async () => { calls++; return { evidence: [] }; } }] },
  });
  assert.equal(calls, 0);
  assert.equal(result.status, "UNSUPPORTED_DOMAIN");
  assert.equal(result.domain, LIVE_DOMAIN_UNSUPPORTED);
  assert.equal(result.request_count, 0);
  assert.deepEqual(result.evidence, []);
  assert.equal(JSON.stringify(result).includes("SIMULATED"), false);
});

test("source fetch records latency and fails safely for HTTP and malformed JSON", async () => {
  let requests = 0;
  const ok = await fetchAdobeLiveEvidence({ now: NOW, fetchImpl: async () => ({
    ok: true,
    async json() {
      requests++;
      return requests === 1 ? { total: 1, data: [currentVideo] } : { total: 1, data: [currentVideo] };
    },
  }) });
  assert.equal(ok.relevant_count, 1);
  assert.equal(ok.deduplicated_count, 1);
  assert.equal(ok.request_count, 2);
  assert.equal(typeof ok.retrieval_latency_ms, "number");
  await assert.rejects(fetchAdobeLiveEvidence({ fetchImpl: async () => ({ ok: false, status: 503 }) }), (error) => error.code === "SOURCE_UNAVAILABLE");
  await assert.rejects(fetchAdobeLiveEvidence({ fetchImpl: async () => ({ ok: true, async json() { throw new Error("bad"); } }) }), (error) => error.code === "MALFORMED_SOURCE");
});

test("deterministic briefing discloses that Minds was not involved and preserves objective binding", () => {
  const objective = { objective_id: "obj_1", title: "Improve my AI video workflow", constraints: "", fingerprint: "fp_1" };
  const evidence = normalizeAdobeItem(currentVideo, { now: NOW });
  const briefing = buildDeterministicLiveBriefing({
    runId: "run_1", objective, evidence,
    memorySelection: { context: { learned_rules: ["Prefer free or low-cost tools."], memory_nodes: [] } },
    startedAt: NOW.toISOString(), completedAt: NOW.toISOString(),
  });
  assert.equal(briefing.run_id, "run_1");
  assert.equal(briefing.objective_snapshot.fingerprint, "fp_1");
  assert.equal(briefing.minds_verified, false);
  assert.equal(briefing.decision_engine, "GREENROOM_DETERMINISTIC_LIVE_CORE");
  assert.equal(briefing.sources[0].source_url, evidence.source_url);
  assert.match(briefing.items[0].recommended_action, /Prefer free or low-cost tools/);
});

test("deterministic lifecycle accepts the provider-neutral evidence contract", () => {
  const evidence = {
    source: "First-party creator source",
    source_url: "https://example.com/creator-update",
    published_at: "2026-08-20T00:00:00.000Z",
    retrieved_at: NOW.toISOString(),
    title: "A creator workflow update",
    summary: "A verified first-party workflow capability was published.",
    evidence_mode: "LIVE",
  };
  const briefing = buildDeterministicLiveBriefing({
    runId: "run_generic",
    objective: { objective_id: "obj_generic", title: "Track creator workflow changes", constraints: "", fingerprint: "fp_generic" },
    evidence,
    memorySelection: { context: { learned_rules: [], memory_nodes: [] } },
    startedAt: NOW.toISOString(),
    completedAt: NOW.toISOString(),
  });
  assert.equal(briefing.items[0].category, "live_creator_evidence");
  assert.equal(briefing.sources[0], evidence);
  assert.equal(JSON.stringify(briefing).includes("Adobe"), false);
});

class FakeRedis {
  constructor(values = {}) { this.values = new Map(Object.entries(values)); }
  async get(key) { return this.values.get(key) ?? null; }
  async set(key, value, options) {
    if (options?.nx && this.values.has(key)) return null;
    this.values.set(key, value); return "OK";
  }
  json(key) { const value = this.values.get(key); return typeof value === "string" ? JSON.parse(value) : value; }
}

function liveRun(profile = { learned_voice_rules: [], memory_nodes: [] }) {
  const objective = { objective_id: "obj_live", title: "Keep me updated on important AI video tools that could improve my workflow.", constraints: "", fingerprint: "fp_live" };
  const redis = new FakeRedis({
    "greenroom:run_status:run_live": JSON.stringify({ run_id: "run_live", status: "QUEUED", objective_snapshot: objective }),
    "greenroom:recent_runs": "[]",
    "greenroom:creator_profile": JSON.stringify(profile),
  });
  return { objective, redis };
}

test("normal live worker submits verified evidence to Minds without deterministic completion", async () => {
  const { objective, redis } = liveRun({ learned_voice_rules: ["Prefer free or low-cost tools."], memory_nodes: [] });
  const mindsClient = {
    async ensureConversation(alias) { return { conversationId: "conversation-safe", alias }; },
    async getLatestHistoryFingerprint() { return "fp-before"; },
    async sendMessage({ messageText }) {
      assert.match(messageText, /Use the GreenRoom Decision Skill/);
      assert.match(messageText, /Prefer free or low-cost tools/);
      return { messageId: "message-safe" };
    },
  };
  const result = await processWorkerPhase({
    phase: "submit", redis, mindsClient, runId: "run_live", objective, now: NOW,
    targetUrl: "https://example.test/api/briefing-worker",
    env: { MINDS_REPLY_DEADLINE_MS: "600000" },
    enqueue: async () => ({ messageId: "qstash-safe" }),
    fetchEvidence: async () => ({ domain: LIVE_DOMAIN_AI_VIDEO, provider_ids: ["ADOBE_BLOG"], candidate_count: 2, fresh_count: 2, relevant_count: 1, deduplicated_count: 1, request_count: 1, evidence: [normalizeAdobeItem(currentVideo, { now: NOW })], retrieval_latency_ms: 12, retrieved_at: NOW.toISOString() }),
  });
  assert.equal(result.body.status, "WAITING_FOR_MINDS");
  const status = redis.json("greenroom:run_status:run_live");
  assert.equal(status.objective_snapshot.fingerprint, "fp_live");
  assert.equal(status.memory_selection.selected_rule_count, 1);
  assert.equal(status.evidence_snapshot.evidence_mode, "LIVE");
  assert.equal(status.decision_engine, "MINDS_NATIVE_DECISION");
  assert.equal(redis.json("greenroom:briefing:run_live"), undefined);
  assert.equal(JSON.stringify(status).includes("Demo Dataset"), false);
});

test("no relevant live evidence is terminal without overwriting an old briefing", async () => {
  const { objective, redis } = liveRun();
  await redis.set("greenroom:latest_briefing", JSON.stringify({ run_id: "run_old", evidence_mode: "SIMULATED" }));
  const result = await processWorkerPhase({
    phase: "submit", redis, runId: "run_live", objective, now: NOW,
    fetchEvidence: async () => ({ candidate_count: 10, relevant_count: 0, evidence: [], retrieval_latency_ms: 5, retrieved_at: NOW.toISOString() }),
  });
  assert.equal(result.body.status, "NO_RELEVANT_UPDATE");
  assert.equal(redis.json("greenroom:briefing:run_live"), undefined);
  assert.equal(redis.json("greenroom:latest_briefing").run_id, "run_old");
});

test("unsupported writing objective is terminal without a briefing or simulated fallback", async () => {
  const objective = { objective_id: "obj_writing", title: "Improve my long-form writing workflow.", constraints: "", fingerprint: "fp_writing" };
  const redis = new FakeRedis({
    "greenroom:run_status:run_writing": JSON.stringify({ run_id: "run_writing", status: "QUEUED", objective_snapshot: objective }),
    "greenroom:recent_runs": "[]",
    "greenroom:creator_profile": JSON.stringify({ learned_voice_rules: [], memory_nodes: [] }),
  });
  const result = await processWorkerPhase({ phase: "submit", redis, runId: "run_writing", objective, now: NOW });
  assert.equal(result.body.status, "UNSUPPORTED_DOMAIN");
  assert.equal(redis.json("greenroom:briefing:run_writing"), undefined);
  assert.equal(JSON.stringify(redis.json("greenroom:run_status:run_writing")).includes("SIMULATED"), false);
});

test("live source failure creates a sanitized failed run and no briefing", async () => {
  const { objective, redis } = liveRun();
  const error = Object.assign(new Error("private network detail"), { code: "SOURCE_UNAVAILABLE" });
  const result = await processWorkerPhase({ phase: "submit", redis, runId: "run_live", objective, now: NOW, fetchEvidence: async () => { throw error; } });
  assert.equal(result.body.status, "FAILED");
  assert.equal(redis.json("greenroom:run_status:run_live").error, "Live evidence source is unavailable");
  assert.equal(JSON.stringify(redis.json("greenroom:run_status:run_live")).includes("private network detail"), false);
  assert.equal(redis.json("greenroom:briefing:run_live"), undefined);
});
