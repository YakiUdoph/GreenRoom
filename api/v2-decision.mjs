import crypto from "node:crypto";

export const V2_DECISION_VERSION = "greenroom_v2_decision_v1";
export const V2_DIAGNOSTIC_VERSION = "greenroom_v2_diagnostic_v1";
export const V2_ACTION_VALIDATION_VERSION = "v2_action_quality_v1";
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
  return `GREENROOM V2 VERIFIED DECISION INPUT\n\nCREATOR GOAL [CREATOR-STATED FACTS]\n${json({ primary_platform: context.primary_platform, primary_goal: context.primary_goal, optional_target: context.optional_target, optional_target_date: context.optional_target_date, context_version: context.context_version })}\n\nCREATOR CONSTRAINTS [CREATOR-STATED FACTS]\n${json(context.constraints)}\n\nCREATOR-SUPPLIED PREFERENCES [CREATOR-STATED FACTS]\n${json(context.creator_supplied_preferences)}\n\nRELEVANT REMEMBERED CONTEXT [MEMORY]\n${json(safeMemory)}\n\nOBSERVED CHANNEL SIGNALS [OBSERVED CREATOR SIGNALS]\n${json({ analytics_status: analyticsStatus, selection: { selection_version: signalSelection.selection_version, available_signal_ids: signalSelection.available_signal_ids, selected_signal_ids: signalSelection.selected_signal_ids, omitted_signal_ids: signalSelection.omitted_signal_ids, selection_reason: signalSelection.selection_reason }, signals: signalSelection.selected_signals })}\n\nVERIFIED EXTERNAL UPDATE [EXTERNAL EVIDENCE]\n${json(evidenceBlock)}\n\nEVIDENCE LIMITATIONS\nTemporal coexistence does not establish causation. For this V2 slice, causal evidence does not exist. Do not say or imply that the external update caused any creator metric change. A real Mind processing an observed signal does not upgrade relevance into causality. Do not force a connection; CONNECTION may be NONE. Analytics may be unavailable or insufficient without invalidating an honest goal-and-evidence decision.\n\nDECISION INSTRUCTIONS\nUse only the bounded evidence above. Produce a decision specific to this creator, not generic creator commentary. WHAT I'D DO NEXT must contain exactly one bounded realistic creator action using the information GreenRoom already retrieved. Do not delegate duplicate source research: do not tell the creator to read, check, visit, research, look up, monitor, or investigate the linked source, article, post, or announcement. Recommend the smallest action justified by the supplied evidence, respect the creator's constraints, avoid generic advice, and do not increase workload without evidence. If no behavior change is justified, an explicit bounded non-action such as no workflow change for now is valid and preferable to speculative busywork. Do not promise future monitoring or notification unless a supplied mechanism establishes it. WHY THIS MATTERS TO YOU must cite at least one applicable machine reference using [REF:reference], chosen only from: ${allowedRefs.join(", ")}. The reference is personalization provenance and must support the reasoning. Do not invent creator facts, demographics, subscriber or revenue data, availability, or causal claims.\n\nReturn exactly these six sections and no Markdown:\nATTENTION: ACT_NOW | KEEP_WATCHING | IGNORE_FOR_NOW\nWHAT I NOTICED:\nconcise meaningful evidence\nWHY THIS MATTERS TO YOU:\ncreator-specific relevance with at least one [REF:reference]\nWHAT I'D DO NEXT:\none bounded realistic action or explicit bounded non-action\nCONNECTION: SUPPORTED | POSSIBLE | NONE\nUNCERTAINTY:\nimportant unknowns`;
}

export function validateV2ActionQuality(action, {
  creatorContext,
  signalSelection,
  externalEvidence,
} = {}) {
  const value = nonEmpty(action, "WHAT I'D DO NEXT");
  const normalized = value.toLowerCase().replace(/\s+/g, " ").trim();
  const delegatesResearch = /^(?:please\s+)?(?:check|read|visit|research|look up|monitor|investigate)\b/i.test(normalized)
    && /\b(?:linked|source|article|blog post|post|announcement|what changed)\b/i.test(normalized)
    && Boolean(externalEvidence);
  if (delegatesResearch)
    throw new Error("V2 action delegates duplicate research of supplied external evidence");

  const constraints = Array.isArray(creatorContext?.constraints)
    ? creatorContext.constraints.map((item) => String(item?.value || "").toLowerCase()).join(" ")
    : "";
  const forbidsFrequencyIncrease = /(?:do not|without|avoid)\b.{0,45}\b(?:increase|increasing|raise|raising)\b.{0,30}\b(?:upload|posting|publishing)\s+(?:frequency|cadence)/i.test(constraints);
  const increasesFrequency = /\b(?:increase|raise|boost)\b.{0,30}\b(?:upload|posting|publishing)\s+(?:frequency|cadence)\b/i.test(normalized)
    || /\b(?:upload|post|publish)\b.{0,20}\b(?:more often|more frequently)\b/i.test(normalized);
  if (forbidsFrequencyIncrease && increasesFrequency)
    throw new Error("V2 action violates a supplied upload-frequency constraint");

  const selectedTypes = new Set((signalSelection?.selected_signals || []).map((signal) => signal.type));
  const unsupportedDirectionalClaims = [
    { pattern: /\b(?:ctr|click-through rate)\b.{0,40}\b(?:declin|fall|drop|improv|ris|increas|trend)/i, type: "VIDEO_CTR_VARIATION" },
    { pattern: /\bwatch time\b.{0,40}\b(?:declin|fall|drop|improv|ris|increas|trend)/i, type: "WATCH_TIME_MOMENTUM" },
    { pattern: /\b(?:avd|average view duration)\b.{0,40}\b(?:declin|fall|drop|improv|ris|increas|trend)/i, type: "AVD_MOMENTUM" },
    { pattern: /\bsubscribers?\b.{0,40}\b(?:declin|fall|drop|improv|ris|increas|trend)/i, type: "SUBSCRIBER_MOMENTUM" },
  ];
  if (unsupportedDirectionalClaims.some(({ pattern, type }) => pattern.test(normalized) && !selectedTypes.has(type)))
    throw new Error("V2 action relies on an unsupported analytics claim");

  if (/\b(?:i|greenroom)\s+(?:will|'ll)\s+(?:notify|alert|monitor|watch)\b/i.test(normalized))
    throw new Error("V2 action promises unsupported future monitoring");
  return value;
}

export function parseV2MindResponse(
  text,
  { allowedPersonalizationRefs = [], actionValidationContext = null } = {},
) {
  const value = nonEmpty(text, "V2 Mind response")
    .replace(/\r\n/g, "\n")
    .replace(/<br *\/?>/gi, "\n")
    .trim();
  if (/<\/?[a-z][^>]*>/i.test(value))
    throw new Error("V2 Mind response contains unsupported HTML");
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
  if (actionValidationContext)
    validateV2ActionQuality(parsed["WHAT I'D DO NEXT"], actionValidationContext);
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
    action_validation_version: V2_ACTION_VALIDATION_VERSION,
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

export function v2DiagnosticKey(runId) {
  return `greenroom:v2_diagnostic:${nonEmpty(runId, "runId")}`;
}

function sanitizedReplyProvenance(value = {}) {
  return Object.freeze({
    transport: typeof value.transport === "string" ? value.transport : null,
    sender_type: Number.isInteger(value.sender_type) ? value.sender_type : null,
    sender_id: typeof value.sender_id === "string" ? value.sender_id : null,
    sender_email: typeof value.sender_email === "string" ? value.sender_email : null,
    fingerprint: typeof value.fingerprint === "string" ? value.fingerprint : null,
  });
}

function sanitizedSseMetadata(value = {}) {
  return Object.freeze({
    event_count: Number.isInteger(value.event_count) && value.event_count >= 0 ? value.event_count : null,
    reconstructed_from_field: typeof value.reconstructed_from_field === "string" ? value.reconstructed_from_field : null,
    chunk_count: Number.isInteger(value.chunk_count) && value.chunk_count >= 0 ? value.chunk_count : null,
  });
}

function sanitizedParserError(error) {
  const message = error?.message || "";
  const allowed = [
    "V2 Mind response must contain exactly the six required sections in order",
    "V2 Mind response missing or invalid section:",
    "V2 Mind response has invalid ATTENTION value",
    "V2 Mind response has invalid CONNECTION value",
    "V2 decision lacks valid personalization provenance",
    "V2 Mind response must be a non-empty string",
    "V2 Mind response contains unsupported HTML",
    "V2 action delegates duplicate research of supplied external evidence",
    "V2 action violates a supplied upload-frequency constraint",
    "V2 action relies on an unsupported analytics claim",
    "V2 action promises unsupported future monitoring",
  ];
  return allowed.find((item) => message.startsWith(item))
    ? message.slice(0, 500)
    : "V2 response validation failed";
}

export function buildV2DiagnosticArtifact({
  runId,
  timestamp,
  promptHash,
  mindReplyText,
  verifiedMindIdentity = V2_MIND_IDENTITY,
  replyProvenance = {},
  sseMetadata = {},
  parserStatus = "PENDING",
  parserError = null,
}) {
  requireVerifiedV2MindIdentity(verifiedMindIdentity);
  const reply = nonEmpty(mindReplyText, "V2 Mind response");
  return Object.freeze({
    diagnostic_version: V2_DIAGNOSTIC_VERSION,
    contract_version: V2_DECISION_VERSION,
    run_id: nonEmpty(runId, "runId"),
    timestamp: nonEmpty(timestamp, "diagnostic timestamp"),
    prompt_hash: nonEmpty(promptHash, "prompt hash"),
    response_hash: crypto.createHash("sha256").update(reply).digest("hex"),
    verified_mind_identity_reference: Object.freeze({
      mind_id: V2_MIND_IDENTITY.mind_id,
      email: V2_MIND_IDENTITY.email,
    }),
    reply_provenance: sanitizedReplyProvenance(replyProvenance),
    reconstructed_reply_text: reply,
    response_character_length: reply.length,
    sse_reconstruction: sanitizedSseMetadata(sseMetadata),
    parser_status: parserStatus,
    parser_error: parserError,
    decision_persisted: false,
    visibility: "PRIVATE_OPERATIONAL_ONLY",
  });
}

export async function deleteV2Diagnostic(redis, runId) {
  if (!redis || typeof redis.del !== "function")
    throw new Error("V2 diagnostic deletion requires a Redis-compatible store");
  return redis.del(v2DiagnosticKey(runId));
}

export async function finalizeAndPersistV2Decision({
  redis,
  mindReplyText,
  promptHash,
  replyProvenance = {},
  sseMetadata = {},
  diagnosticTimestamp,
  ...recordInput
}) {
  if (!redis || typeof redis.set !== "function" || typeof redis.del !== "function")
    throw new Error(
      "V2 decision persistence requires a Redis-compatible store",
    );
  const timestamp = diagnosticTimestamp || new Date().toISOString();
  const diagnosticInput = {
    runId: recordInput.runId,
    timestamp,
    promptHash,
    mindReplyText,
    verifiedMindIdentity: recordInput.verifiedMindIdentity,
    replyProvenance,
    sseMetadata,
  };
  const pendingDiagnostic = buildV2DiagnosticArtifact(diagnosticInput);
  await redis.set(v2DiagnosticKey(recordInput.runId), JSON.stringify(pendingDiagnostic));

  let parsedDecision;
  try {
    parsedDecision = parseV2MindResponse(mindReplyText, {
      allowedPersonalizationRefs: allowedV2PersonalizationRefs(recordInput),
      actionValidationContext: {
        creatorContext: recordInput.creatorContext,
        signalSelection: recordInput.signalSelection,
        externalEvidence: recordInput.externalEvidence,
      },
    });
  } catch (error) {
    const rejectedDiagnostic = buildV2DiagnosticArtifact({
      ...diagnosticInput,
      parserStatus: "REJECTED",
      parserError: sanitizedParserError(error),
    });
    await redis.set(v2DiagnosticKey(recordInput.runId), JSON.stringify(rejectedDiagnostic));
    throw error;
  }

  const validatedDiagnostic = buildV2DiagnosticArtifact({
    ...diagnosticInput,
    parserStatus: "ACCEPTED_AWAITING_DECISION_PERSISTENCE",
  });
  await redis.set(v2DiagnosticKey(recordInput.runId), JSON.stringify(validatedDiagnostic));
  const record = buildV2DecisionRecord({ ...recordInput, parsedDecision });
  await redis.set(
    `greenroom:v2_decision:${record.run_id}`,
    JSON.stringify(record),
  );
  await deleteV2Diagnostic(redis, record.run_id);
  return record;
}
