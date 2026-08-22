export function validateWorkerConfiguration(env) {
  const required = [
    "QSTASH_CURRENT_SIGNING_KEY",
    "QSTASH_NEXT_SIGNING_KEY",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "MINDS_BUILDER_API_KEY",
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

export function buildObjectiveAwareSignals(objective) {
  const target = `${objective.title} ${objective.constraints}`.toLowerCase();
  const monetization = ["paid", "sponsor", "partnership", "monetary", "revenue", "collaboration"]
    .some((term) => target.includes(term));
  const terminal = ["terminal", "local ai", "command line", "cli"]
    .some((term) => target.includes(term));

  if (monetization) {
    return [
      { id: "sig_001", source: "Demo Dataset (Simulated)", signal: "A simulated paid AI infrastructure sponsorship matches the creator audience and includes explicit compensation terms." },
      { id: "sig_002", source: "Demo Dataset (Simulated)", signal: "A simulated Web3 ecosystem partnership offers a paid educational collaboration with deliverables and budget disclosed." },
      { id: "sig_003", source: "Demo Dataset (Simulated)", signal: "A simulated exposure-only awareness campaign has no creator compensation and conflicts with the active constraints." },
    ];
  }
  if (terminal) {
    return [
      { id: "sig_001", source: "Demo Dataset (Simulated)", signal: "Audience requests for terminal-first local AI walkthroughs increased in the simulated dataset." },
      { id: "sig_002", source: "Demo Dataset (Simulated)", signal: "A simulated developer-tools collaboration supports practical command-line education." },
      { id: "sig_003", source: "Demo Dataset (Simulated)", signal: "Generic awareness content lacks the practical depth required by the active objective." },
    ];
  }
  return [
    { id: "sig_001", source: "Demo Dataset (Simulated)", signal: `A simulated opportunity directly relevant to the active objective: ${objective.title}` },
    { id: "sig_002", source: "Demo Dataset (Simulated)", signal: `A simulated alternative must be evaluated against these constraints: ${objective.constraints}` },
    { id: "sig_003", source: "Demo Dataset (Simulated)", signal: "A simulated generic campaign lacks a clear connection to the active objective." },
  ];
}

export function buildMindsPrompt(objective, creatorProfile, signals) {
  return `RUN OBJECTIVE (AUTHORITATIVE): ${objective.title}\nRUN CONSTRAINTS (AUTHORITATIVE): ${objective.constraints}\nRUN OBJECTIVE ID: ${objective.objective_id}\n\nYou are Greenroom's ranking Mind. Rank only opportunities that serve the authoritative run objective and constraints above. Do not alter the objective or constraints. Persisted creator memory is supporting context and must never replace the run objective.\n\nReturn exactly one JSON object matching this structure:\n{"items":[{"id":"string","priority":"string or number","title":"non-empty string","category":"non-empty string","what_changed":"non-empty string","why_it_matters":"non-empty string","recommended_action":"non-empty string","memory_context_used":"string","status":"string"}]}\nNo Markdown. No code fences. No commentary. No HTML/XML. No text before or after the JSON object. Do not claim simulated signals are live or real.\n\nPersisted creator memory: ${JSON.stringify(creatorProfile)}\nSignals scoped to this objective: ${JSON.stringify(signals)}`;
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
