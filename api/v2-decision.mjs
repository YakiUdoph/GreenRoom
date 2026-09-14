import crypto from "node:crypto";

export const V2_DECISION_VERSION = "greenroom_v2_decision_v1";
export const SIGNAL_SELECTION_VERSION =
  "objective_evidence_signal_selection_v1";
export const V2_MIND_IDENTITY = Object.freeze({
  mind_id: "8208493e-f36b-1410-8466-00039ce7df11",
  email: "udophia@hellominds.ai",
  wallet_address: "0xB675Ec9857776678aE540cF3248d898f015987Cb",
});

const SOURCES = new Set(["CREATOR_SUPPLIED", "MEMORY", "OBSERVED_ANALYTICS"]);
const ATTENTION = new Set(["ACT_NOW", "KEEP_WATCHING", "IGNORE_FOR_NOW"]);
const CONNECTION = new Set(["SUPPORTED", "POSSIBLE", "NONE"]);
const SIGNAL_TERMS = Object.freeze({
  VIEW_MOMENTUM: [
    "view",
    "views",
    "viewer",
    "audience",
    "subscriber",
    "subscribers",
    "reach",
    "grow",
    "growth",
    "recommendation",
    "recommendations",
  ],
  WATCH_TIME_MOMENTUM: [
    "watch",
    "watching",
    "retention",
    "viewer",
    "audience",
    "session",
  ],
  AVD_MOMENTUM: ["duration", "retention", "watch", "watching", "engagement"],
  VIDEO_CTR_VARIATION: [
    "thumbnail",
    "click",
    "ctr",
    "title",
    "packaging",
    "discovery",
  ],
  VIDEO_IMPRESSION_VARIATION: [
    "impression",
    "impressions",
    "reach",
    "recommendation",
    "recommendations",
    "discovery",
    "browse",
  ],
});
const SECTION_NAMES = [
  "ATTENTION",
  "WHAT I NOTICED",
  "WHY THIS MATTERS TO YOU",
  "WHAT I'D DO NEXT",
  "CONNECTION",
  "UNCERTAINTY",
];

function requireVerifiedV2MindIdentity(identity) {
  if (
    identity?.mind_id !== V2_MIND_IDENTITY.mind_id ||
    identity?.email !== V2_MIND_IDENTITY.email ||
    identity?.wallet_address !== V2_MIND_IDENTITY.wallet_address
  ) {
    throw new Error(
      "V2 decision Mind identity does not match verified Udophia",
    );
  }
  return V2_MIND_IDENTITY;
}

function nonEmpty(value, label) {
  if (typeof value !== "string" || !value.trim())
    throw new Error(`${label} must be a non-empty string`);
  return value.trim();
}

function sourced(value, label, allowedSources = SOURCES) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(`${label} must preserve value and source`);
  const source = nonEmpty(value.source, `${label}.source`);
  if (!allowedSources.has(source))
    throw new Error(`${label} has unsupported source ${source}`);
  if (
    value.value === null ||
    value.value === undefined ||
    (typeof value.value === "string" && !value.value.trim())
  ) {
    throw new Error(`${label}.value is required`);
  }
  return Object.freeze({ value: value.value, source });
}

export function validateCreatorContext(input) {
  const context =
    input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const constraints = Array.isArray(context.constraints)
    ? context.constraints.map((item, index) =>
        sourced(
          item,
          `constraints[${index}]`,
          new Set(["CREATOR_SUPPLIED", "MEMORY"]),
        ),
      )
    : [];
  const preferences = Array.isArray(context.creator_supplied_preferences)
    ? context.creator_supplied_preferences.map((item, index) =>
        sourced(
          item,
          `creator_supplied_preferences[${index}]`,
          new Set(["CREATOR_SUPPLIED", "MEMORY"]),
        ),
      )
    : [];
  return Object.freeze({
    context_version: nonEmpty(context.context_version, "context_version"),
    primary_platform: sourced(
      context.primary_platform,
      "primary_platform",
      new Set(["CREATOR_SUPPLIED"]),
    ),
    primary_goal: sourced(
      context.primary_goal,
      "primary_goal",
      new Set(["CREATOR_SUPPLIED"]),
    ),
    optional_target: context.optional_target
      ? sourced(
          context.optional_target,
          "optional_target",
          new Set(["CREATOR_SUPPLIED"]),
        )
      : null,
    optional_target_date: context.optional_target_date
      ? sourced(
          context.optional_target_date,
          "optional_target_date",
          new Set(["CREATOR_SUPPLIED"]),
        )
      : null,
    constraints: Object.freeze(constraints),
    creator_supplied_preferences: Object.freeze(preferences),
  });
}

const words = (value) =>
  new Set(
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .filter(Boolean),
  );

export function selectV2Signals({
  creatorContext,
  externalEvidence,
  signals = [],
}) {
  const context = validateCreatorContext(creatorContext);
  const evidence = externalEvidence || {};
  const query = words(
    [
      context.primary_goal.value,
      context.optional_target?.value,
      ...context.constraints.map((item) => item.value),
      evidence.title,
      evidence.summary,
      evidence.category,
    ].join(" "),
  );
  const available = signals
    .filter(
      (signal) =>
        signal &&
        typeof signal.signal_id === "string" &&
        typeof signal.type === "string",
    )
    .slice()
    .sort((a, b) => a.signal_id.localeCompare(b.signal_id));
  const selected = available.filter((signal) => {
    if (signal.data_sufficiency !== "SUFFICIENT") return false;
    return (SIGNAL_TERMS[signal.type] || []).some((term) => query.has(term));
  });
  const selectedIds = new Set(selected.map((signal) => signal.signal_id));
  return Object.freeze({
    selection_version: SIGNAL_SELECTION_VERSION,
    available_signal_ids: Object.freeze(
      available.map((signal) => signal.signal_id),
    ),
    selected_signal_ids: Object.freeze(
      selected.map((signal) => signal.signal_id),
    ),
    omitted_signal_ids: Object.freeze(
      available
        .filter((signal) => !selectedIds.has(signal.signal_id))
        .map((signal) => signal.signal_id),
    ),
    selection_reason:
      "Selected sufficient signals whose declared metric domain overlaps the explicit creator objective, constraints, or verified external evidence; no verdict mapping is performed.",
    selected_signals: Object.freeze(
      selected.map((signal) =>
        Object.freeze({
          signal_id: signal.signal_id,
          type: signal.type,
          direction: signal.direction ?? null,
          classification: signal.classification,
          current_value: signal.current_value ?? null,
          comparison_value: signal.comparison_value ?? null,
          percentage_delta: signal.percentage_delta ?? null,
          unit: signal.unit,
          threshold_version: signal.threshold_version,
          data_sufficiency: signal.data_sufficiency,
          uncertainty: signal.uncertainty ?? null,
          source: "OBSERVED_ANALYTICS",
        }),
      ),
    ),
  });
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stable(value[key])]),
    );
  return value;
}

export function fingerprintV2Decision({
  creatorContext,
  analyticsImportHash,
  signalSelection,
  memoryProvenance,
  externalEvidence,
  verifiedMindIdentity = V2_MIND_IDENTITY,
}) {
  const context = validateCreatorContext(creatorContext);
  const evidenceFingerprint = nonEmpty(
    externalEvidence?.fingerprint || externalEvidence?.content_fingerprint,
    "external evidence fingerprint",
  );
  const provider = nonEmpty(
    externalEvidence?.provider_id || externalEvidence?.source,
    "external evidence provider",
  );
  const payload = {
    decision_version: V2_DECISION_VERSION,
    objective_context_version: context.context_version,
    creator_context: context,
    analytics_import_hash: analyticsImportHash || null,
    selected_signals: signalSelection.selected_signals.map((signal) => ({
      signal_id: signal.signal_id,
      threshold_version: signal.threshold_version,
    })),
    memory_provenance: memoryProvenance || { availability: "UNAVAILABLE" },
    external_evidence: { fingerprint: evidenceFingerprint, provider },
    verified_mind_identity: requireVerifiedV2MindIdentity(verifiedMindIdentity),
  };
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(stable(payload)))
    .digest("hex");
}

function json(value) {
  return JSON.stringify(value, null, 2);
}

export function buildV2MindPrompt({
  creatorContext,
  signalSelection,
  memoryContext = {},
  memoryProvenance = {},
  externalEvidence,
  analyticsStatus = "AVAILABLE",
}) {
  const context = validateCreatorContext(creatorContext);
  if (
    !signalSelection ||
    signalSelection.selection_version !== SIGNAL_SELECTION_VERSION
  )
    throw new Error("Validated V2 signal selection is required");
  const evidence = externalEvidence || {};
  const safeMemory = {
    learned_rules: Array.isArray(memoryContext.learned_rules)
      ? memoryContext.learned_rules.slice(0, 3)
      : [],
    memory_nodes: Array.isArray(memoryContext.memory_nodes)
      ? memoryContext.memory_nodes.slice(0, 3)
      : [],
    provenance: memoryProvenance,
    evidence_class: "MEMORY",
  };
  const evidenceBlock = {
    evidence_id: nonEmpty(
      evidence.evidence_id || evidence.source_url,
      "external evidence id",
    ),
    provider_id: nonEmpty(
      evidence.provider_id || evidence.source,
      "external evidence provider",
    ),
    title: nonEmpty(evidence.title, "external evidence title"),
    summary: nonEmpty(evidence.summary, "external evidence summary"),
    source_url: nonEmpty(evidence.source_url, "external evidence source_url"),
    published_at: evidence.published_at || null,
    fingerprint: nonEmpty(
      evidence.fingerprint || evidence.content_fingerprint,
      "external evidence fingerprint",
    ),
    evidence_class: "EXTERNAL_EVIDENCE",
  };
  const allowedRefs = [
    "creator_goal",
    ...context.constraints.map((_, index) => `constraint:${index}`),
    ...safeMemory.learned_rules.map((_, index) => `memory_rule:${index}`),
    ...signalSelection.selected_signal_ids.map((id) => `signal:${id}`),
  ];
  return `GREENROOM V2 VERIFIED DECISION INPUT\n\nCREATOR GOAL [CREATOR-STATED FACTS]\n${json({ primary_platform: context.primary_platform, primary_goal: context.primary_goal, optional_target: context.optional_target, optional_target_date: context.optional_target_date, context_version: context.context_version })}\n\nCREATOR CONSTRAINTS [CREATOR-STATED FACTS]\n${json(context.constraints)}\n\nCREATOR-SUPPLIED PREFERENCES [CREATOR-STATED FACTS]\n${json(context.creator_supplied_preferences)}\n\nRELEVANT REMEMBERED CONTEXT [MEMORY]\n${json(safeMemory)}\n\nOBSERVED CHANNEL SIGNALS [OBSERVED CREATOR SIGNALS]\n${json({ analytics_status: analyticsStatus, selection: { selection_version: signalSelection.selection_version, available_signal_ids: signalSelection.available_signal_ids, selected_signal_ids: signalSelection.selected_signal_ids, omitted_signal_ids: signalSelection.omitted_signal_ids, selection_reason: signalSelection.selection_reason }, signals: signalSelection.selected_signals })}\n\nVERIFIED EXTERNAL UPDATE [EXTERNAL EVIDENCE]\n${json(evidenceBlock)}\n\nEVIDENCE LIMITATIONS\nTemporal coexistence does not establish causation. For this V2 slice, causal evidence does not exist. Do not say or imply that the external update caused any creator metric change. A real Mind processing an observed signal does not upgrade relevance into causality. Do not force a connection; CONNECTION may be NONE. Analytics may be unavailable or insufficient without invalidating an honest goal-and-evidence decision.\n\nDECISION INSTRUCTIONS\nUse only the bounded evidence above. Produce a decision specific to this creator, not generic creator commentary. WHAT I'D DO NEXT must contain exactly one bounded realistic action. WHY THIS MATTERS TO YOU must cite at least one applicable machine reference using [REF:reference], chosen only from: ${allowedRefs.join(", ")}. The reference is personalization provenance and must support the reasoning. Do not invent creator facts, demographics, subscriber or revenue data, availability, or causal claims.\n\nReturn exactly these six sections and no Markdown:\nATTENTION: ACT_NOW | KEEP_WATCHING | IGNORE_FOR_NOW\nWHAT I NOTICED:\nconcise meaningful evidence\nWHY THIS MATTERS TO YOU:\ncreator-specific relevance with at least one [REF:reference]\nWHAT I'D DO NEXT:\none bounded realistic action\nCONNECTION: SUPPORTED | POSSIBLE | NONE\nUNCERTAINTY:\nimportant unknowns`;
}

export function parseV2MindResponse(
  text,
  { allowedPersonalizationRefs = [] } = {},
) {
  const value = nonEmpty(text, "V2 Mind response")
    .replace(/\r\n/g, "\n")
    .trim();
  const headerPattern =
    /^(ATTENTION|WHAT I NOTICED|WHY THIS MATTERS TO YOU|WHAT I'D DO NEXT|CONNECTION|UNCERTAINTY)\s*:\s*/gim;
  const headers = [...value.matchAll(headerPattern)];
  if (
    headers.length !== SECTION_NAMES.length ||
    headers[0]?.index !== 0 ||
    headers.some(
      (match, index) => match[1].toUpperCase() !== SECTION_NAMES[index],
    )
  ) {
    throw new Error(
      "V2 Mind response must contain exactly the six required sections in order",
    );
  }
  const parsed = {};
  headers.forEach((match, index) => {
    const start = match.index + match[0].length;
    const end = headers[index + 1]?.index ?? value.length;
    const content = value.slice(start, end).trim();
    if (!content)
      throw new Error(
        `V2 Mind response missing or invalid section: ${SECTION_NAMES[index]}`,
      );
    parsed[SECTION_NAMES[index]] = content;
  });
  const attention = parsed.ATTENTION.split(/\s+/)[0].toUpperCase();
  const connection = parsed.CONNECTION.split(/\s+/)[0].toUpperCase();
  if (!ATTENTION.has(attention))
    throw new Error("V2 Mind response has invalid ATTENTION value");
  if (!CONNECTION.has(connection))
    throw new Error("V2 Mind response has invalid CONNECTION value");
  const refs = [
    ...parsed["WHY THIS MATTERS TO YOU"].matchAll(/\[REF:([^\]]+)\]/gi),
  ].map((match) => match[1]);
  const allowed = new Set(allowedPersonalizationRefs);
  if (!refs.length || refs.some((ref) => !allowed.has(ref)))
    throw new Error("V2 decision lacks valid personalization provenance");
  return Object.freeze({
    attention_verdict: attention,
    what_i_noticed: parsed["WHAT I NOTICED"],
    why_this_matters_to_you: parsed["WHY THIS MATTERS TO YOU"],
    what_id_do_next: parsed["WHAT I'D DO NEXT"],
    connection,
    uncertainty: parsed.UNCERTAINTY,
    personalization_refs: Object.freeze([...new Set(refs)]),
  });
}

export function buildV2DecisionRecord({
  runId,
  creatorContext,
  analyticsImportHash,
  analyticsStatus = "AVAILABLE",
  signalSelection,
  memoryContext = {},
  memoryProvenance = {},
  externalEvidence,
  verifiedMindIdentity = V2_MIND_IDENTITY,
  parsedDecision,
  completedAt,
}) {
  if (!parsedDecision?.personalization_refs?.length)
    throw new Error(
      "V2 decision cannot persist without personalization provenance",
    );
  const runFingerprint = fingerprintV2Decision({
    creatorContext,
    analyticsImportHash,
    signalSelection,
    memoryProvenance,
    externalEvidence,
    verifiedMindIdentity,
  });
  return Object.freeze({
    schema_version: V2_DECISION_VERSION,
    run_id: nonEmpty(runId, "runId"),
    run_fingerprint: runFingerprint,
    completed_at: nonEmpty(completedAt, "completedAt"),
    creator_context: validateCreatorContext(creatorContext),
    creator_context_provenance: "FIELD_LEVEL",
    analytics: {
      import_hash: analyticsImportHash || null,
      status: analyticsStatus,
    },
    signal_selection: {
      selection_version: signalSelection.selection_version,
      available_signal_ids: signalSelection.available_signal_ids,
      selected_signal_ids: signalSelection.selected_signal_ids,
      omitted_signal_ids: signalSelection.omitted_signal_ids,
      selection_reason: signalSelection.selection_reason,
      calculation_versions: Object.fromEntries(
        signalSelection.selected_signals.map((signal) => [
          signal.signal_id,
          signal.threshold_version,
        ]),
      ),
    },
    memory: { selected_context: memoryContext, provenance: memoryProvenance },
    external_evidence: externalEvidence,
    verified_mind_identity: requireVerifiedV2MindIdentity(verifiedMindIdentity),
    decision: parsedDecision,
  });
}

export function allowedV2PersonalizationRefs({
  creatorContext,
  signalSelection,
  memoryContext = {},
}) {
  const context = validateCreatorContext(creatorContext);
  return Object.freeze([
    "creator_goal",
    ...context.constraints.map((_, index) => `constraint:${index}`),
    ...(Array.isArray(memoryContext.learned_rules)
      ? memoryContext.learned_rules
          .slice(0, 3)
          .map((_, index) => `memory_rule:${index}`)
      : []),
    ...signalSelection.selected_signal_ids.map((id) => `signal:${id}`),
  ]);
}

export async function finalizeAndPersistV2Decision({
  redis,
  mindReplyText,
  ...recordInput
}) {
  if (!redis || typeof redis.set !== "function")
    throw new Error(
      "V2 decision persistence requires a Redis-compatible store",
    );
  const parsedDecision = parseV2MindResponse(mindReplyText, {
    allowedPersonalizationRefs: allowedV2PersonalizationRefs(recordInput),
  });
  const record = buildV2DecisionRecord({ ...recordInput, parsedDecision });
  await redis.set(
    `greenroom:v2_decision:${record.run_id}`,
    JSON.stringify(record),
  );
  return record;
}
