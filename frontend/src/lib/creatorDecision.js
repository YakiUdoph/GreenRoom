import { cleanDecisionText } from './decisionText.js';

const text = value => typeof value === 'string' && value.trim() ? cleanDecisionText(value).trim() : null;

export function normalizeCreatorDecision(input) {
  const decision = input?.decision || input;
  const legacy = Array.isArray(input?.items) ? input.items[0] : null;
  if (!decision && !legacy) return null;
  const noticed = text(decision?.what_i_noticed) || text(legacy?.what_changed) || text(legacy?.summary);
  const why = text(decision?.why_this_matters_to_you) || text(legacy?.why_it_matters);
  const action = text(decision?.what_id_do_next) || text(legacy?.recommended_action);
  if (!noticed && !why && !action) return null;
  return {
    runId: text(input?.run_id),
    completedAt: text(input?.completed_at),
    attention: text(decision?.attention_verdict || input?.attention_verdict),
    headline: text(decision?.headline || legacy?.title) || noticed,
    noticed,
    why,
    action,
    uncertainty: text(decision?.uncertainty),
    connection: text(decision?.connection),
    sources: Array.isArray(input?.sources) ? input.sources : input?.evidence ? [input.evidence] : [],
    live: input?.evidence_mode === 'LIVE' || input?.provenance?.evidence_mode === 'LIVE' || Boolean(input?.evidence),
    verified: input?.minds_verified === true || Boolean(input?.verified_mind_identity) || Boolean(input?.mind?.mind_id),
  };
}
