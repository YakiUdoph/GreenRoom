export function validateWorkerConfiguration(env) {
  const required = [
    "QSTASH_CURRENT_SIGNING_KEY",
    "QSTASH_NEXT_SIGNING_KEY",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "QSTASH_TOKEN",
  ];
  const aliases = {
    UPSTASH_REDIS_REST_URL: "KV_REST_API_URL",
    UPSTASH_REDIS_REST_TOKEN: "KV_REST_API_TOKEN",
  };
  return required.filter((name) => !env[name] && !env[aliases[name]]);
}

const REQUIRED_BRIEFING_FIELDS = [
  "title", "category", "what_changed", "why_it_matters", "recommended_action",
];

function safePrefix(text) {
  return text
    .slice(0, 80)
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/(bearer|authorization|cookie|api[-_ ]?key)\s*[:=]\s*\S+/gi, "$1=[REDACTED]");
}

export function classifyMindReplyText(replyText) {
  if (typeof replyText !== "string" || !replyText.trim()) return "empty";
  const text = replyText.trim();
  if (text.startsWith("<")) return "html_like";
  const fences = [...text.matchAll(/```(?:json)?\s*[\s\S]*?```/gi)];
  if (fences.length === 1 && fences[0][0] === text) return "fenced_json";
  if (fences.length > 0) return "prose";
  try {
    JSON.parse(text);
    return "raw_json";
  } catch {
    return "prose";
  }
}

export function normalizeMindReply(outcome) {
  if (outcome?.timedOut) {
    throw new Error("Animoca Mind reply timed out without a verified response");
  }
  if (!outcome?.reply) {
    throw new Error("Animoca Mind interaction returned empty response");
  }
  const reply = outcome.reply;
  const hasMessageText = typeof reply.messageText === "string";
  const hasText = typeof reply.text === "string";
  if (!hasMessageText && !hasText) {
    throw new Error("Animoca Mind returned an unsupported reply shape");
  }
  const source = hasMessageText ? "messageText" : "text";
  const text = reply[source].trim();
  if (!text) {
    throw new Error("Animoca Mind returned a reply without text");
  }
  return { text, source, wrapperKeys: Object.keys(reply).sort() };
}

export function requireVerifiedMindReply(outcome) {
  return normalizeMindReply(outcome).text;
}

export function buildMindReplyDiagnostics(outcome, objective, runId) {
  const reply = outcome?.reply;
  const wrapperKeys = reply && typeof reply === "object" ? Object.keys(reply).sort() : [];
  const source = typeof reply?.messageText === "string"
    ? "messageText"
    : typeof reply?.text === "string" ? "text" : "unsupported";
  const text = source === "unsupported" ? "" : reply[source];
  return {
    run_id: runId,
    objective_id: objective.objective_id,
    objective_fingerprint: objective.fingerprint,
    reply_wrapper_keys: wrapperKeys,
    reply_source: source,
    character_count: typeof text === "string" ? text.length : 0,
    content_classification: source === "unsupported" ? "unsupported" : classifyMindReplyText(text),
    truncated: null,
    http_status: null,
    content_type: null,
    sanitized_prefix: typeof text === "string" ? safePrefix(text.trim()) : "",
  };
}

export function extractSafeSdkMetadata(value) {
  if (!value || typeof value !== "object") return {};
  const safe = {};
  for (const key of ["conversationId", "messageId", "id", "fingerprint", "createdAt", "status"]) {
    const item = value[key];
    if (["string", "number", "boolean"].includes(typeof item) || item === null) safe[key] = item;
  }
  return safe;
}

export function selectVerifiedHistoryReply(rows, context, isReplyHistoryRow) {
  if (!Array.isArray(rows)) return null;
  return rows.find((row) => {
    if (!isReplyHistoryRow(row, {
      alias: context.alias,
      afterFingerprint: context.afterFingerprint,
    })) return false;
    if (context.submittedPromptHash && typeof row?.messageText === "string") {
      return context.hashText(row.messageText) !== context.submittedPromptHash;
    }
    return true;
  }) || null;
}

export function isTerminalRunStatus(status) {
  return status === "COMPLETED" || status === "NO_RELEVANT_UPDATE" || status === "UNSUPPORTED_DOMAIN" || status === "FAILED";
}

export function collectionDeadlinePassed(deadline, now = new Date()) {
  const timestamp = Date.parse(deadline || "");
  return !Number.isFinite(timestamp) || now.getTime() >= timestamp;
}

export function collectionDelaySeconds(submittedAt, now = new Date()) {
  const submitted = Date.parse(submittedAt || "");
  if (!Number.isFinite(submitted)) return 15;
  const elapsedMs = Math.max(0, now.getTime() - submitted);
  if (elapsedMs < 60_000) return 5;
  if (elapsedMs < 120_000) return 10;
  return 15;
}

export function verifyMindIdentity(mind, expected) {
  const data = mind?.mind || mind?.data || mind;
  const actualId = data?.mindId || data?.id;
  const verified = Boolean(
    actualId === expected.mindId &&
    data?.email === expected.email &&
    data?.walletAddress === expected.walletAddress &&
    data?.isEnabled === true
  );
  if (!verified) {
    throw new Error("Animoca Mind identity response did not match the configured Greenroom Mind");
  }
  return data;
}

export function parseMindBriefing(replyText) {
  if (typeof replyText !== "string" || !replyText.trim()) {
    throw new Error("Animoca Mind briefing response was empty");
  }
  const text = replyText.trim();
  if (text.startsWith("<")) {
    throw new Error("Animoca Mind briefing response was HTML/XML-like, not JSON");
  }
  const fences = [...text.matchAll(/^```json\s*\n?([\s\S]*?)\n?```$/gi)];
  const anyFenceCount = [...text.matchAll(/```/g)].length;
  if (anyFenceCount > 0 && (fences.length !== 1 || anyFenceCount !== 2)) {
    throw new Error("Animoca Mind briefing response contained prose or multiple/unsupported code fences");
  }
  const candidate = fences.length === 1 ? fences[0][1].trim() : text;
  let parsed;
  try {
    parsed = JSON.parse(candidate);
  } catch (error) {
    throw new Error(`Animoca Mind reply was not valid briefing JSON: ${error.message}`);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Animoca Mind briefing JSON must be a top-level object");
  }
  if (!Array.isArray(parsed.items) || parsed.items.length === 0) {
    throw new Error("Animoca Mind briefing JSON did not contain ranked items");
  }
  parsed.items.forEach((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`Animoca Mind briefing item ${index + 1} must be an object`);
    }
    const missing = REQUIRED_BRIEFING_FIELDS.filter(
      (field) => typeof item[field] !== "string" || !item[field].trim()
    );
    if (missing.length) {
      throw new Error(`Animoca Mind briefing item ${index + 1} missing or invalid: ${missing.join(", ")}`);
    }
    for (const field of ["id", "memory_context_used", "status"]) {
      if (field in item && (typeof item[field] !== "string" || !item[field].trim())) {
        throw new Error(`Animoca Mind briefing item ${index + 1} has invalid ${field}`);
      }
    }
    if ("priority" in item && !(
      (typeof item.priority === "string" && item.priority.trim())
      || (typeof item.priority === "number" && Number.isFinite(item.priority))
    )) {
      throw new Error(`Animoca Mind briefing item ${index + 1} has invalid priority`);
    }
  });
  return parsed;
}

export function validateObjectiveSnapshot(snapshot) {
  const requiredNonEmpty = ["objective_id", "title", "fingerprint"];
  const missing = requiredNonEmpty.filter((field) => typeof snapshot?.[field] !== "string" || !snapshot[field]);
  if (typeof snapshot?.constraints !== "string") missing.push("constraints");
  if (missing.length) {
    throw new Error(`QStash payload objective snapshot missing: ${missing.join(", ")}`);
  }
  return Object.freeze({
    objective_id: snapshot.objective_id,
    title: snapshot.title,
    constraints: snapshot.constraints,
    fingerprint: snapshot.fingerprint,
  });
}

const SIGNAL_CLASSIFIER_VERSION = "objective_signal_classifier_v2";
const EXCLUSION_MARKERS = ["do not", "don't", "avoid", "exclude", "reject", "without", "not"];
const INTENT_TERMS = {
  ai_video_tools: ["ai video", "video generation", "video editing", "animation", "creator workflow tools"],
  monetization: ["paid", "sponsor", "partnership", "monetary", "revenue", "collaboration", "brand deal", "campaign"],
  terminal_local_ai: ["terminal", "local ai", "command line", "cli"],
};

function matchingTerms(text, terms) {
  return terms.filter((term) => text.includes(term));
}

function splitIntentText(text) {
  const clauses = String(text || "").toLowerCase().split(/(?<=[.!?;])|\n+/).map((part) => part.trim()).filter(Boolean);
  const positiveClauses = [];
  const excludedClauses = [];
  const exclusionMarkersDetected = [];
  for (const clause of clauses) {
    const matches = EXCLUSION_MARKERS.map((marker) => ({
      marker,
      match: new RegExp(`\\b${marker.replace("'", "['’]")}\\b`, "i").exec(clause),
    })).filter((entry) => entry.match).sort((a, b) => a.match.index - b.match.index);
    if (matches.length) {
      const exclusionStart = matches[0].match.index;
      const positivePrefix = clause.slice(0, exclusionStart).replace(/[,;:\s]+$/, "").trim();
      if (positivePrefix) positiveClauses.push(positivePrefix);
      excludedClauses.push(clause.slice(exclusionStart));
      exclusionMarkersDetected.push(matches[0].marker);
    } else {
      positiveClauses.push(clause);
    }
  }
  return { positiveClauses, excludedClauses, exclusionMarkersDetected };
}

export function classifyObjectiveSignals(objective) {
  const titleParts = splitIntentText(objective.title);
  const constraintParts = splitIntentText(objective.constraints);
  const positiveText = [...titleParts.positiveClauses, ...constraintParts.positiveClauses].join(" ");
  const exclusionText = [...titleParts.excludedClauses, ...constraintParts.excludedClauses].join(" ");
  const positiveMatches = Object.fromEntries(
    Object.entries(INTENT_TERMS).map(([category, terms]) => [category, matchingTerms(positiveText, terms)])
  );
  const allTerms = [...new Set(Object.values(INTENT_TERMS).flat())];
  const exclusionTermsDetected = matchingTerms(exclusionText, allTerms);

  // Explicit creator-tool intent has priority over broader commercial terms.
  const selectedCategory = positiveMatches.ai_video_tools.length
    ? "ai_video_tools"
    : positiveMatches.monetization.length
      ? "monetization"
      : positiveMatches.terminal_local_ai.length
        ? "terminal_local_ai"
        : "generic";

  let signals;
  if (selectedCategory === "ai_video_tools") {
    signals = [
      {
        id: "sig_001",
        source: "Demo Dataset (Simulated)",
        category: "video_generation",
        candidate: "Simulated AI video generation workspace",
        signal: "A simulated creator tool turns a written concept and reference frames into draft video sequences, reducing first-cut production time; its practical tradeoff is that visual continuity and fine scene control still require creator review.",
      },
      {
        id: "sig_002",
        source: "Demo Dataset (Simulated)",
        category: "video_editing_workflow",
        candidate: "Simulated AI-assisted editing workflow",
        signal: "A simulated editing tool combines transcript-based cuts, rough assembly, reframing, and caption preparation in one creator workflow, speeding repetitive post-production; its limitation is that pacing, narrative judgment, and final polish remain manual.",
      },
      {
        id: "sig_003",
        source: "Demo Dataset (Simulated)",
        category: "animation_motion",
        candidate: "Simulated animation and motion workflow",
        signal: "A simulated motion tool converts approved visual assets into short animated sequences and reusable motion variants, accelerating intros and social cutdowns; its tradeoff is limited precision for complex character motion and brand-specific art direction.",
      },
    ];
  } else if (selectedCategory === "monetization") {
    signals = [
      { id: "sig_001", source: "Demo Dataset (Simulated)", signal: "A simulated paid AI infrastructure sponsorship matches the creator audience and includes explicit compensation terms." },
      { id: "sig_002", source: "Demo Dataset (Simulated)", signal: "A simulated Web3 ecosystem partnership offers a paid educational collaboration with deliverables and budget disclosed." },
      { id: "sig_003", source: "Demo Dataset (Simulated)", signal: "A simulated exposure-only awareness campaign has no creator compensation and conflicts with the active constraints." },
    ];
  } else if (selectedCategory === "terminal_local_ai") {
    signals = [
      { id: "sig_001", source: "Demo Dataset (Simulated)", signal: "Audience requests for terminal-first local AI walkthroughs increased in the simulated dataset." },
      { id: "sig_002", source: "Demo Dataset (Simulated)", signal: "A simulated developer-tools collaboration supports practical command-line education." },
      { id: "sig_003", source: "Demo Dataset (Simulated)", signal: "Generic awareness content lacks the practical depth required by the active objective." },
    ];
  } else {
    signals = [
      { id: "sig_001", source: "Demo Dataset (Simulated)", signal: `A simulated opportunity directly relevant to the active objective: ${objective.title}` },
      { id: "sig_002", source: "Demo Dataset (Simulated)", signal: `A simulated alternative must be evaluated against these constraints: ${objective.constraints}` },
      { id: "sig_003", source: "Demo Dataset (Simulated)", signal: "A simulated generic campaign lacks a clear connection to the active objective." },
    ];
  }

  return {
    signals,
    provenance: {
      selected_signal_category: selectedCategory,
      positive_intent_terms_matched: positiveMatches[selectedCategory] || [],
      exclusion_markers_detected: [...new Set([...titleParts.exclusionMarkersDetected, ...constraintParts.exclusionMarkersDetected])],
      exclusion_terms_detected: exclusionTermsDetected,
      classification_version: SIGNAL_CLASSIFIER_VERSION,
      classification_strategy: "positive_clauses_with_explicit_exclusions",
      evidence_mode: "SIMULATED",
    },
  };
}

export function buildObjectiveAwareSignals(objective) {
  return classifyObjectiveSignals(objective).signals;
}

const MEMORY_SELECTION_VERSION = "objective_memory_projection_v1";
const UNIVERSAL_PREFERENCE_TERMS = ["concise", "direct", "practical", "clickbait"];
const COMMERCIAL_TERMS = ["monetary", "monetization", "paid", "sponsor", "sponsorship", "campaign", "brand deal", "partnership", "revenue"];
const RELEVANCE_STOP_WORDS = new Set(["a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "in", "is", "it", "of", "on", "or", "that", "the", "this", "to", "with", "without", "do", "not", "avoid", "focus", "prioritize", "recommend", "candidate", "creator", "dataset", "opportunity", "recommendation", "review", "signal", "simulated"]);

function normalizedWords(value) {
  return [...new Set(String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter((word) => word.length > 2 && !RELEVANCE_STOP_WORDS.has(word)))];
}

function stableRuleHash(rule) {
  return crypto.createHash("sha256").update(String(rule).trim()).digest("hex");
}

function compactMemoryNode(node) {
  const compact = {};
  for (const field of ["node_id", "type", "category", "content", "key_takeaways", "tags"]) {
    const value = node?.[field];
    if (typeof value === "string" && value.trim()) compact[field] = value.trim().slice(0, field === "content" ? 240 : 80);
    else if (Array.isArray(value) && value.length) compact[field] = value.filter((item) => typeof item === "string" && item.trim()).slice(0, field === "key_takeaways" ? 3 : 5).map((item) => item.trim().slice(0, 120));
  }
  return compact;
}

function ruleRepresentation(value) {
  return String(value || "").toLowerCase().replace(/^user feedback rule:\s*/i, "").replace(/[^a-z0-9]+/g, " ").trim();
}

export function selectRelevantCreatorContext(objective, creatorProfile = {}, signals = []) {
  const titleIntent = splitIntentText(objective?.title);
  const constraintIntent = splitIntentText(objective?.constraints);
  const positiveObjectiveText = [...titleIntent.positiveClauses, ...constraintIntent.positiveClauses].join(" ");
  const signalText = signals.map((signal) => [signal?.category, signal?.candidate, signal?.signal].filter(Boolean).join(" ")).join(" ");
  const queryWords = new Set(normalizedWords(`${positiveObjectiveText} ${signalText}`));
  const exclusionText = [...titleIntent.excludedClauses, ...constraintIntent.excludedClauses].join(" ").toLowerCase();
  const excludesCommercialWork = COMMERCIAL_TERMS.some((term) => exclusionText.includes(term));
  const rules = Array.isArray(creatorProfile?.learned_voice_rules) ? creatorProfile.learned_voice_rules : [];

  const selectedRules = rules.map((rule, index) => {
    const text = String(rule || "").trim();
    const lower = text.toLowerCase();
    const ruleWords = normalizedWords(text);
    const conflicts = excludesCommercialWork && COMMERCIAL_TERMS.some((term) => lower.includes(term));
    const lexicalScore = ruleWords.filter((word) => queryWords.has(word)).length;
    const universalScore = UNIVERSAL_PREFERENCE_TERMS.filter((term) => ruleWords.includes(term)).length * 2;
    return { text, index, score: conflicts ? 0 : lexicalScore + universalScore };
  }).filter((entry) => entry.text && entry.score > 0)
    .sort((a, b) => b.score - a.score || b.index - a.index)
    .slice(0, 3);

  const allRuleRepresentations = new Set(rules.map(ruleRepresentation).filter(Boolean));
  const nodes = Array.isArray(creatorProfile?.memory_nodes) ? creatorProfile.memory_nodes : [];
  const selectedNodes = nodes.map((node, index) => {
    const compact = compactMemoryNode(node);
    const text = [compact.type, compact.category, compact.content, ...(compact.key_takeaways || []), ...(compact.tags || [])].filter(Boolean).join(" ");
    const representation = ruleRepresentation(compact.content);
    const duplicatesRule = representation && [...allRuleRepresentations].some((rule) => representation === rule || representation.endsWith(rule));
    const conflicts = excludesCommercialWork && COMMERCIAL_TERMS.some((term) => text.toLowerCase().includes(term));
    const score = duplicatesRule || conflicts ? 0 : normalizedWords(text).filter((word) => queryWords.has(word)).length;
    const timestamp = Number.isFinite(Number(node?.timestamp)) ? Number(node.timestamp) : 0;
    return { compact, index, score, timestamp };
  }).filter((entry) => Object.keys(entry.compact).length && entry.score > 0)
    .sort((a, b) => b.score - a.score || b.timestamp - a.timestamp || a.index - b.index)
    .slice(0, 3);

  const context = {
    ...(typeof creatorProfile?.creator_name === "string" && creatorProfile.creator_name.trim() ? { creator_name: creatorProfile.creator_name.trim() } : {}),
    ...(Array.isArray(creatorProfile?.brand_voice_attributes) ? { brand_voice_attributes: creatorProfile.brand_voice_attributes.filter((value) => typeof value === "string" && value.trim()).slice(0, 5) } : {}),
    learned_rules: selectedRules.map((entry) => entry.text),
    memory_nodes: selectedNodes.map((entry) => entry.compact),
  };
  return {
    context,
    provenance: {
      memory_selection_version: MEMORY_SELECTION_VERSION,
      selected_rule_hashes: selectedRules.map((entry) => stableRuleHash(entry.text)),
      selected_memory_node_ids: selectedNodes.map((entry) => entry.compact.node_id).filter(Boolean),
      selected_rule_count: selectedRules.length,
      selected_memory_node_count: selectedNodes.length,
    },
  };
}

export function buildMindsPrompt(objective, creatorProfile, signals, selection = selectRelevantCreatorContext(objective, creatorProfile, signals)) {
  return `GREENROOM BACKGROUND RUN\n\nRUN OBJECTIVE ID:\n${objective.objective_id}\n\nRUN OBJECTIVE — AUTHORITATIVE:\n${objective.title}\n\nRUN CONSTRAINTS — AUTHORITATIVE:\n${objective.constraints}\n\nThe objective and constraints above are immutable. Relevant persistent creator memory is supporting context only and must never replace them.\n\nRELEVANT PERSISTENT CREATOR MEMORY:\n${JSON.stringify(selection.context)}\n\nEVIDENCE MODE:\nThe following candidates are from a Demo Dataset (Simulated). They were not discovered through live research. Do not claim current availability, pricing, URLs, adoption, or market trends.\n\nOBJECTIVE-SPECIFIC SIGNALS:\n${JSON.stringify(signals)}\n\nTASK:\nRank only candidates that serve the authoritative objective and constraints. Explain practical workflow value and tradeoffs. Never allow supporting memory to override the constraints.\n\nSTRICT JSON OUTPUT SCHEMA:\n{"items":[{"id":"string","priority":"string or number","title":"non-empty string","category":"non-empty string","what_changed":"non-empty string","why_it_matters":"non-empty string","recommended_action":"non-empty string","memory_context_used":"string","status":"string"}]}\nNo Markdown. No code fences. No commentary. No HTML/XML. No text before or after the JSON object.`;
}

export function updateRecentRunIndex(existing, status, limit = 20) {
  const prior = Array.isArray(existing) ? existing : [];
  const safe = {
    run_id: status.run_id,
    status: status.status,
    queued_at: status.queued_at || null,
    started_at: status.started_at || null,
    completed_at: status.completed_at || null,
    objective_id: status.objective_snapshot?.objective_id || null,
    objective_fingerprint: status.objective_snapshot?.fingerprint || null,
    error: status.status === "FAILED" ? status.error || null : null,
    reply_diagnostics: status.status === "FAILED" ? status.reply_diagnostics || null : null,
  };
  return [safe, ...prior.filter((item) => item?.run_id !== safe.run_id)].slice(0, limit);
}

export function resolveIdempotentBriefing(existingStatus, storedBriefing, runId, objective) {
  if (existingStatus?.status !== "COMPLETED") return null;
  if (!storedBriefing) throw new Error(`Completed run ${runId} has no run-specific briefing`);
  if (storedBriefing.run_id !== runId) throw new Error("Completed briefing run ID mismatch");
  if (storedBriefing.objective_id !== objective.objective_id) {
    throw new Error("Completed briefing objective ID mismatch");
  }
  return storedBriefing;
}
import crypto from "node:crypto";
