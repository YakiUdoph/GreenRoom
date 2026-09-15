export const CURRENT_V2_RUN_STORAGE_KEY = 'greenroom.currentV2RunId';

export function validCurrentV2RunId(value) {
  return typeof value === 'string' && /^run_v2_[A-Za-z0-9_-]{6,120}$/.test(value);
}

export function bindV2Decision(run, decision) {
  if (!run?.decision_available || !decision || decision.run_id !== run.run_id) return null;
  return decision;
}

export function shouldPollV2Run(run) {
  return Boolean(run?.run_id) && !['COMPLETED', 'FAILED', 'NO_RELEVANT_UPDATE', 'UNSUPPORTED_DOMAIN'].includes(run.status);
}
