const ADOBE_ORIGIN = "https://blog.adobe.com";
export const ADOBE_QUERY_INDEX_URL = `${ADOBE_ORIGIN}/en/query-index.json`;
export const LIVE_EVIDENCE_FRESHNESS_DAYS = 365;
export const ADOBE_PAGE_SIZE = 1000;
export const ADOBE_MAX_RECORDS = 2000;
export const LIVE_EVIDENCE_REQUEST_TIMEOUT_MS = 7000;
export const LIVE_EVIDENCE_TOTAL_BUDGET_MS = 20000;
export const LIVE_DOMAIN_AI_VIDEO = "AI_VIDEO";
export const LIVE_DOMAIN_UNSUPPORTED = "UNSUPPORTED";

export class LiveEvidenceError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "LiveEvidenceError";
    this.code = code;
  }
}

export function classifyLiveDomain(objective) {
  const text = `${objective?.title || ""} ${objective?.constraints || ""}`
    .toLowerCase()
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ");
  const aiVideo = /\bai\b.{0,50}\bvideo\b|\bvideo\b.{0,50}\bai\b|\bgenerative video\b|\bvideo generation\b|\bai video editing\b|\bai animation\b|\bai filmmaking\b/i;
  return aiVideo.test(text) ? LIVE_DOMAIN_AI_VIDEO : LIVE_DOMAIN_UNSUPPORTED;
}

export function parseAdobeDate(value) {
  let date;
  if (typeof value === "number" && Number.isFinite(value)) {
    // Adobe's query index uses Excel-style serial days (1899-12-30 epoch).
    date = new Date(Date.UTC(1899, 11, 30) + value * 86_400_000);
  } else if (typeof value === "string" && value.trim()) {
    const trimmed = value.trim();
    if (/^\d+(?:\.\d+)?$/.test(trimmed)) {
      const numeric = Number(trimmed);
      date = new Date(Date.UTC(1899, 11, 30) + numeric * 86_400_000);
    } else {
      date = new Date(trimmed);
    }
  }
  if (!date || Number.isNaN(date.getTime())) return null;
  return date;
}

export function isStrongAiVideoEvidence(item) {
  const text = [item?.title, item?.description, item?.path]
    .filter((value) => typeof value === "string")
    .join(" ")
    .toLowerCase()
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ");
  if (!text) return false;
  const aiNearVideo = /\b(?:ai|artificial intelligence|generative ai)\b.{0,60}\bvideo(?:s)?\b|\bvideo(?:s)?\b.{0,60}\b(?:ai|artificial intelligence|generative ai)\b/i;
  const explicitWorkflow = /\b(?:generative video|video generation|ai video editing|ai animation|ai filmmaking)\b/i;
  const fireflyVideo = /\bfirefly\b.{0,60}\bvideo(?:s)?\b|\bvideo(?:s)?\b.{0,60}\bfirefly\b/i;
  return aiNearVideo.test(text) || explicitWorkflow.test(text) || fireflyVideo.test(text);
}

export function scoreAiVideoEvidence(item) {
  const title = String(item?.title || "").toLowerCase().replace(/[-_/]+/g, " ");
  const description = String(item?.description || "").toLowerCase().replace(/[-_/]+/g, " ");
  const path = String(item?.path || "").toLowerCase().replace(/[-_/]+/g, " ");
  const scorePart = (text, weight) => isStrongAiVideoEvidence({ title: text }) ? weight : 0;
  return scorePart(title, 4) + scorePart(description, 2) + scorePart(path, 1);
}

function cleanText(value) {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return cleaned || null;
}

export function normalizeAdobeItem(item, { now = new Date(), freshnessDays = LIVE_EVIDENCE_FRESHNESS_DAYS } = {}) {
  if (!item || typeof item !== "object") return null;
  const title = cleanText(item.title);
  const summary = cleanText(item.description) || title;
  const path = typeof item.path === "string" ? item.path.trim() : "";
  const published = parseAdobeDate(item.date);
  if (!title || !path.startsWith("/en/publish/") || !published) return null;
  if (!isStrongAiVideoEvidence(item)) return null;

  const nowMs = now.getTime();
  const publishedMs = published.getTime();
  if (!Number.isFinite(nowMs) || publishedMs > nowMs) return null;
  if (nowMs - publishedMs > freshnessDays * 86_400_000) return null;

  let sourceUrl;
  try {
    const url = new URL(path, ADOBE_ORIGIN);
    if (url.origin !== ADOBE_ORIGIN || !url.pathname.startsWith("/en/publish/")) return null;
    sourceUrl = url.toString();
  } catch {
    return null;
  }

  return {
    source: "Adobe Blog",
    source_url: sourceUrl,
    published_at: published.toISOString(),
    retrieved_at: now.toISOString(),
    title,
    summary,
    evidence_mode: "LIVE",
    category: "ai_video_workflow",
    relevance_score: scoreAiVideoEvidence(item),
  };
}

function isFreshAdobeItem(item, options = {}) {
  if (!item || typeof item !== "object") return false;
  const now = options.now || new Date();
  const freshnessDays = options.freshnessDays ?? LIVE_EVIDENCE_FRESHNESS_DAYS;
  const published = parseAdobeDate(item.date);
  const title = cleanText(item.title);
  const path = typeof item.path === "string" ? item.path.trim() : "";
  if (!published || !title || !path.startsWith("/en/publish/")) return false;
  return published.getTime() <= now.getTime()
    && now.getTime() - published.getTime() <= freshnessDays * 86_400_000;
}

export function parseAdobeQueryIndex(payload, options = {}) {
  if (!payload || !Array.isArray(payload.data)) {
    throw new LiveEvidenceError("MALFORMED_SOURCE", "Adobe evidence response did not contain a data array");
  }
  const evidence = payload.data
    .map((item) => normalizeAdobeItem(item, options))
    .filter(Boolean)
    .sort((a, b) => b.relevance_score - a.relevance_score
      || Date.parse(b.published_at) - Date.parse(a.published_at)
      || a.source_url.localeCompare(b.source_url));
  return {
    candidate_count: payload.data.length,
    fresh_count: payload.data.filter((item) => isFreshAdobeItem(item, options)).length,
    relevant_count: evidence.length,
    evidence,
  };
}

export async function fetchAdobeLiveEvidence({
  fetchImpl = fetch,
  now = new Date(),
  requestTimeoutMs = LIVE_EVIDENCE_REQUEST_TIMEOUT_MS,
  totalBudgetMs = LIVE_EVIDENCE_TOTAL_BUDGET_MS,
} = {}) {
  const started = Date.now();
  let requestCount = 0;
  const requestJson = async (url) => {
    const remaining = totalBudgetMs - (Date.now() - started);
    if (remaining <= 0) throw new LiveEvidenceError("SOURCE_TIMEOUT", "Adobe evidence retrieval budget was exhausted");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Math.min(requestTimeoutMs, remaining));
    requestCount++;
    try {
      const response = await fetchImpl(url, {
        method: "GET",
        headers: { Accept: "application/json", "User-Agent": "GreenRoom-Live-Core/1.0" },
        signal: controller.signal,
      });
      if (!response.ok) throw new LiveEvidenceError("SOURCE_UNAVAILABLE", `Adobe evidence source returned HTTP ${response.status}`);
      try { return await response.json(); }
      catch { throw new LiveEvidenceError("MALFORMED_SOURCE", "Adobe evidence source did not return valid JSON"); }
    } catch (error) {
      if (error instanceof LiveEvidenceError) throw error;
      if (error?.name === "AbortError") throw new LiveEvidenceError("SOURCE_TIMEOUT", "Adobe evidence source timed out");
      throw new LiveEvidenceError("SOURCE_UNAVAILABLE", "Adobe evidence source could not be reached");
    } finally {
      clearTimeout(timeout);
    }
  };
  try {
    const metadata = await requestJson(`${ADOBE_QUERY_INDEX_URL}?limit=1`);
    const total = Number(metadata?.total);
    if (!Number.isInteger(total) || total < 0) throw new LiveEvidenceError("MALFORMED_SOURCE", "Adobe evidence source did not expose a valid total");
    const finalOffset = Math.max(0, Math.floor(Math.max(0, total - 1) / ADOBE_PAGE_SIZE) * ADOBE_PAGE_SIZE);
    const offsets = [...new Set([Math.max(0, finalOffset - ADOBE_PAGE_SIZE), finalOffset])]
      .filter((offset) => total === 0 || offset < total)
      .slice(-Math.ceil(ADOBE_MAX_RECORDS / ADOBE_PAGE_SIZE));
    const pages = [];
    for (const offset of offsets) {
      pages.push(await requestJson(`${ADOBE_QUERY_INDEX_URL}?limit=${ADOBE_PAGE_SIZE}&offset=${offset}`));
    }
    const rawItems = pages.flatMap((page) => {
      if (!Array.isArray(page?.data)) throw new LiveEvidenceError("MALFORMED_SOURCE", "Adobe evidence page did not contain a data array");
      return page.data;
    });
    const parsed = parseAdobeQueryIndex({ data: rawItems }, { now });
    const unique = new Map(parsed.evidence.map((item) => [item.source_url, item]));
    const evidence = [...unique.values()].sort((a, b) => b.relevance_score - a.relevance_score
      || Date.parse(b.published_at) - Date.parse(a.published_at)
      || a.source_url.localeCompare(b.source_url));
    return {
      ...parsed,
      evidence,
      relevant_count: parsed.evidence.length,
      deduplicated_count: evidence.length,
      request_count: requestCount,
      page_offsets: offsets,
      retrieval_latency_ms: Date.now() - started,
      retrieved_at: now.toISOString(),
    };
  } catch (error) {
    if (error instanceof LiveEvidenceError) throw error;
    throw new LiveEvidenceError("SOURCE_UNAVAILABLE", "Adobe evidence source could not be reached");
  }
}

export const LIVE_SOURCE_REGISTRY = Object.freeze({
  [LIVE_DOMAIN_AI_VIDEO]: Object.freeze([
    Object.freeze({ provider_id: "ADOBE_BLOG", retrieve: fetchAdobeLiveEvidence }),
  ]),
});

export async function retrieveLiveEvidenceForObjective({ objective, now = new Date(), registry = LIVE_SOURCE_REGISTRY } = {}) {
  const domain = classifyLiveDomain(objective);
  const providers = registry[domain] || [];
  if (!providers.length) {
    return {
      status: "UNSUPPORTED_DOMAIN",
      domain,
      provider_ids: [],
      candidate_count: 0,
      fresh_count: 0,
      relevant_count: 0,
      deduplicated_count: 0,
      request_count: 0,
      retrieval_latency_ms: 0,
      retrieved_at: now.toISOString(),
      evidence: [],
    };
  }

  const started = Date.now();
  const results = [];
  for (const provider of providers) results.push(await provider.retrieve({ now }));
  const allEvidence = results.flatMap((result) => result.evidence || []);
  const unique = new Map(allEvidence.map((item) => [item.source_url, item]));
  const evidence = [...unique.values()].sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0)
    || Date.parse(b.published_at) - Date.parse(a.published_at)
    || a.source_url.localeCompare(b.source_url));
  return {
    status: evidence.length ? "EVIDENCE_READY" : "NO_RELEVANT_LIVE_EVIDENCE",
    domain,
    provider_ids: providers.map((provider) => provider.provider_id),
    candidate_count: results.reduce((sum, result) => sum + (result.candidate_count || 0), 0),
    fresh_count: results.reduce((sum, result) => sum + (result.fresh_count || 0), 0),
    relevant_count: allEvidence.length,
    deduplicated_count: evidence.length,
    request_count: results.reduce((sum, result) => sum + (result.request_count || 0), 0),
    retrieval_latency_ms: Date.now() - started,
    retrieved_at: now.toISOString(),
    evidence,
  };
}

export function buildDeterministicLiveBriefing({ runId, objective, evidence, memorySelection, startedAt, completedAt }) {
  const selectedRules = memorySelection?.context?.learned_rules || [];
  const selectedNodes = memorySelection?.context?.memory_nodes || [];
  const dateLabel = evidence.published_at.slice(0, 10);
  const memoryAction = selectedRules.length
    ? ` Apply this saved preference while evaluating it: "${selectedRules[0]}".`
    : "";
  const item = {
    id: "live_001",
    priority: "REVIEW",
    status: "NEW",
    title: evidence.title,
    category: "live_creator_evidence",
    what_changed: `${evidence.source} published this update on ${dateLabel}: ${evidence.summary}`,
    why_it_matters: `The source metadata passed the live evidence rules for the active objective: "${String(objective.title || "").replace(/[.!?]+$/, "")}". No broader impact is inferred.`,
    recommended_action: `Review the first-party source and compare the described capability with your current workflow before deciding whether to adopt it.${memoryAction}`,
    memory_context_used: selectedRules[0] || null,
    source: evidence.source,
    source_url: evidence.source_url,
    published_at: evidence.published_at,
  };
  const provenance = {
    run_id: runId,
    objective_id: objective.objective_id,
    objective_fingerprint: objective.fingerprint,
    created_at: startedAt,
    completed_at: completedAt,
    status: "COMPLETED",
    evidence_mode: "LIVE",
    signal_source: evidence.source,
    decision_engine: "GREENROOM_DETERMINISTIC_LIVE_CORE",
    analysis_status: "AVAILABLE_DETERMINISTIC",
    minds_verified: false,
    minds_involved: false,
    persistence_mode: "DURABLE",
    execution_mode: "QSTASH_BACKGROUND_JOB",
  };
  return {
    run_id: runId,
    objective_id: objective.objective_id,
    objective_snapshot: objective,
    timestamp: completedAt,
    last_run_formatted: new Date(completedAt).toUTCString(),
    signals_reviewed_count: 1,
    opportunities_found_count: 1,
    memory_nodes_used_count: selectedNodes.length,
    signal_source_label: "LIVE EVIDENCE",
    evidence_mode: "LIVE",
    decision_engine: provenance.decision_engine,
    analysis_provider: "GreenRoom deterministic live core",
    minds_status: "NOT_USED_FOR_THIS_BRIEFING",
    minds_verified: false,
    persistence_mode: "DURABLE",
    execution_mode: "QSTASH_BACKGROUND_JOB",
    continuity_note: selectedRules.length ? `Selected persistent preference: "${selectedRules[0]}".` : null,
    provenance,
    sources: [evidence],
    items: [item],
    learned_rules_active: selectedRules,
  };
}
