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
