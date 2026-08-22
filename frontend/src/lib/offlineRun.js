export function verifySavedObjective(memoryState, expectedObjective) {
  if (!expectedObjective?.id) throw new Error('Save an objective before launching offline work.');
  const saved = (memoryState?.creator_objectives || []).find(item => item.id === expectedObjective.id);
  if (!saved) throw new Error('The selected objective is not present in durable state.');
  if (saved.title !== expectedObjective.title || (saved.details || '') !== (expectedObjective.details || '')) {
    throw new Error('The durable objective does not match the objective selected for this run.');
  }
  return saved;
}

export function verifyRunBriefing(briefing, runId, objectiveId) {
  if (!briefing) throw new Error(`Briefing for run ${runId} is missing.`);
  if (briefing.run_id !== runId) throw new Error('Delivered briefing does not match the completed run.');
  if (briefing.objective_id !== objectiveId) {
    throw new Error('Delivered briefing does not match the queued objective.');
  }
  return briefing;
}

export function isOlderBriefingAfterFailedRun(briefing, latestRun) {
  return Boolean(
    latestRun?.status === 'FAILED'
    && latestRun.run_id
    && briefing?.run_id
    && latestRun.run_id !== briefing.run_id
  );
}

export function isOfflineRunPending(status) {
  return ['QUEUED', 'RUNNING', 'SUBMITTING', 'WAITING_FOR_MINDS'].includes(status);
}

export function offlineRunProgressLabel(runStatus, nowMs = Date.now()) {
  const status = runStatus?.status;
  if (status === 'QUEUED') return 'Queued for secure submission';
  if (status === 'RUNNING' || status === 'SUBMITTING') return 'Submitting to Mind';
  if (status === 'WAITING_FOR_MINDS') {
    if (!runStatus.collection_attempt) return 'Submitted to Mind';
    const checkedAt = Date.parse(runStatus.last_history_observation?.checked_at || '');
    if (Number.isFinite(checkedAt) && nowMs - checkedAt < 2_000) return 'Checking response';
    return 'Waiting for verified reply';
  }
  if (status === 'COMPLETED') return 'Ranking result';
  if (status === 'FAILED') return 'Run failed';
  return 'Preparing offline work';
}
