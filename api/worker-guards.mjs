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

export function requireVerifiedMindReply(outcome) {
  if (outcome?.timedOut) {
    throw new Error("Animoca Mind reply timed out without a verified response");
  }
  if (!outcome?.reply) {
    throw new Error("Animoca Mind interaction returned empty response");
  }
  const text = outcome.reply.messageText || outcome.reply.text;
  if (!text || !String(text).trim()) {
    throw new Error("Animoca Mind returned a reply without text");
  }
  return String(text).trim();
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
  const fenced = replyText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : replyText).trim();
  let parsed;
  try {
    parsed = JSON.parse(candidate);
  } catch (error) {
    throw new Error(`Animoca Mind reply was not valid briefing JSON: ${error.message}`);
  }
  if (!Array.isArray(parsed.items) || parsed.items.length === 0) {
    throw new Error("Animoca Mind briefing JSON did not contain ranked items");
  }
  const required = ["title", "category", "what_changed", "why_it_matters", "recommended_action"];
  parsed.items.forEach((item, index) => {
    const missing = required.filter((field) => !item?.[field]);
    if (missing.length) {
      throw new Error(`Animoca Mind briefing item ${index + 1} missing: ${missing.join(", ")}`);
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
  return `RUN OBJECTIVE (AUTHORITATIVE): ${objective.title}\nRUN CONSTRAINTS (AUTHORITATIVE): ${objective.constraints}\nRUN OBJECTIVE ID: ${objective.objective_id}\n\nYou are Greenroom's ranking Mind. Rank only opportunities that serve the authoritative run objective and constraints above. Persisted creator memory is supporting context and must never replace the run objective. Return JSON only with an "items" array ranked best-first. Each item must contain: id, priority, title, category, what_changed, why_it_matters, recommended_action, memory_context_used, status. Do not claim simulated signals are live or real.\n\nPersisted creator memory: ${JSON.stringify(creatorProfile)}\nSignals scoped to this objective: ${JSON.stringify(signals)}`;
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
