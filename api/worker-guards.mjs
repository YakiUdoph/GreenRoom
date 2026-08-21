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
