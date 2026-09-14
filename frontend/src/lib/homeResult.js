export const HOME_WORKING_STATES = ['QUEUED', 'RUNNING', 'WORKING', 'SUBMITTING', 'WAITING_FOR_MINDS'];

export function currentHomeResult(run, briefing) {
  if (run?.status !== 'COMPLETED' || !briefing) return null;
  const runObjectiveId = run.objective_snapshot?.objective_id || run.objective_id;
  const runFingerprint = run.objective_snapshot?.fingerprint || run.objective_fingerprint;
  if (briefing.run_id !== run.run_id || briefing.objective_id !== runObjectiveId) return null;
  if (runFingerprint && briefing.objective_snapshot?.fingerprint !== runFingerprint) return null;
  const item = Array.isArray(briefing.items) ? briefing.items[0] : null;
  return item && typeof item === 'object' ? item : null;
}

export function homeResultState(run, briefing) {
  if (run?.status === 'UNSUPPORTED_DOMAIN') return 'unsupported';
  if (run?.status === 'FAILED') return 'failed';
  if (run?.status === 'NO_RELEVANT_UPDATE') return 'no-update';
  if (HOME_WORKING_STATES.includes(run?.status)) return 'working';
  return currentHomeResult(run, briefing) ? 'result' : 'empty';
}
