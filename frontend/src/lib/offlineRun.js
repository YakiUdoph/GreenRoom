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
  return ['QUEUED', 'RUNNING', 'WORKING', 'SUBMITTING', 'WAITING_FOR_MINDS'].includes(status);
}

export function offlineRunProgressLabel(runStatus, nowMs = Date.now()) {
  const status = runStatus?.status;
  if (status === 'QUEUED') return 'Queued for secure submission';
  if (status === 'RUNNING' || status === 'WORKING' || status === 'SUBMITTING') return 'Checking live evidence';
  if (status === 'WAITING_FOR_MINDS') {
    if (!runStatus.collection_attempt) return 'Submitted to Mind';
    const checkedAt = Date.parse(runStatus.last_history_observation?.checked_at || '');
    if (Number.isFinite(checkedAt) && nowMs - checkedAt < 2_000) return 'Checking response';
    return 'Waiting for verified reply';
  }
  if (status === 'COMPLETED') return 'Ranking result';
  if (status === 'NO_RELEVANT_UPDATE') return 'No relevant live update';
  if (status === 'UNSUPPORTED_DOMAIN') return 'No live provider for this objective';
  if (status === 'FAILED') return 'Run failed';
  return 'Preparing offline work';
}

export function runIndicatorLabel(status) {
  if (isOfflineRunPending(status)) return 'WORKING';
  if (status === 'COMPLETED') return 'RESULT READY';
  if (status === 'NO_RELEVANT_UPDATE') return 'NO RELEVANT UPDATE';
  if (status === 'UNSUPPORTED_DOMAIN') return 'NO LIVE PROVIDER';
  if (status === 'FAILED') return 'RUN FAILED';
  return null;
}

export function shouldPollOfflineRun(run) {
  return Boolean(run?.run_id && isOfflineRunPending(run.status));
}

export const CURRENT_OFFLINE_RUN_STORAGE_KEY = 'greenroom.currentOfflineRunId';

export function restoreCurrentOfflineRun(recentRuns, rememberedRunId = null) {
  const runs = Array.isArray(recentRuns?.runs) ? recentRuns.runs : [];
  const rememberedRun = rememberedRunId
    ? runs.find((run) => run?.run_id === rememberedRunId) || null
    : null;
  if (rememberedRun) return rememberedRun;
  const newestRun = runs[0];
  return newestRun?.run_id && isOfflineRunPending(newestRun.status) ? newestRun : null;
}

export function selectCurrentRunForRefresh(recentRuns, restoredRun = null) {
  const newestRun = Array.isArray(recentRuns?.runs) ? recentRuns.runs[0] : null;
  if (newestRun?.status === 'COMPLETED') return newestRun;
  if (restoredRun?.run_id) return restoredRun;
  return null;
}
