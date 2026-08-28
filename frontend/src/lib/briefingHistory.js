const PENDING_STATUSES = new Set(['QUEUED', 'RUNNING', 'WORKING', 'SUBMITTING', 'WAITING_FOR_MINDS']);

export function currentIntelligence(memoryState) {
  const run = memoryState?.latest_offline_run || null;
  const briefing = memoryState?.latest_briefing || null;
  const runObjectiveId = run?.objective_snapshot?.objective_id || run?.objective_id;
  const objectiveMatches = Boolean(runObjectiveId && briefing?.objective_id === runObjectiveId);
  const runFingerprint = run?.objective_snapshot?.fingerprint || run?.objective_fingerprint;
  const briefingFingerprint = briefing?.objective_snapshot?.fingerprint;
  const fingerprintMatches = !runFingerprint || briefingFingerprint === runFingerprint;
  const currentBriefing = run?.status === 'COMPLETED'
    && briefing?.run_id === run?.run_id
    && objectiveMatches
    && fingerprintMatches
    ? briefing
    : null;
  const status = run?.status === 'FAILED'
    ? 'RUN FAILED'
    : run?.status === 'NO_RELEVANT_UPDATE'
      ? 'NO RELEVANT UPDATE'
    : run?.status === 'UNSUPPORTED_DOMAIN'
      ? 'NO LIVE PROVIDER'
    : PENDING_STATUSES.has(run?.status)
      ? 'WORKING'
      : currentBriefing
        ? 'RESULT READY'
        : 'WAITING';
  return { run, status, currentBriefing };
}

export function completedHistoryRuns(recentRuns, currentBriefing = null) {
  const runs = Array.isArray(recentRuns?.runs) ? recentRuns.runs : [];
  return runs.filter(run => run?.run_id
    && run.status === 'COMPLETED'
    && run.run_id !== currentBriefing?.run_id);
}

function runTimestamp(run) {
  return Date.parse(run?.completed_at || run?.started_at || run?.queued_at || '') || 0;
}

export function recentHistoryRuns(recentRuns, currentRunId = null) {
  const runs = Array.isArray(recentRuns?.runs) ? recentRuns.runs : [];
  return runs
    .filter(run => run?.run_id && run.run_id !== currentRunId)
    .map((run, index) => ({ run, index }))
    .sort((left, right) => runTimestamp(right.run) - runTimestamp(left.run) || left.index - right.index)
    .map(({ run }) => run);
}

export function verifyHistoricalRunRecord(record, statusResponse) {
  const snapshot = statusResponse?.objective_snapshot;
  if (!record?.run_id || statusResponse?.run_id !== record.run_id) {
    throw new Error('Historical run ID mismatch.');
  }
  if (record.objective_id && snapshot?.objective_id !== record.objective_id) {
    throw new Error('Historical objective binding mismatch.');
  }
  if (record.objective_fingerprint && snapshot?.fingerprint !== record.objective_fingerprint) {
    throw new Error('Historical objective fingerprint mismatch.');
  }
  return { status: statusResponse.status, objectiveSnapshot: snapshot };
}

export function verifyHistoricalBriefing(record, statusResponse, briefingResponse) {
  const briefing = briefingResponse?.briefing;
  const snapshot = briefingResponse?.objective_snapshot || statusResponse?.objective_snapshot;
  if (!record?.run_id || !briefing || statusResponse?.status !== 'COMPLETED') {
    throw new Error('Historical briefing is not completed.');
  }
  if (briefing.run_id !== record.run_id || briefing.objective_id !== record.objective_id) {
    throw new Error('Historical briefing binding mismatch.');
  }
  if (snapshot?.objective_id !== record.objective_id) {
    throw new Error('Historical objective binding mismatch.');
  }
  const expectedFingerprint = record.objective_fingerprint;
  const snapshotFingerprint = snapshot?.fingerprint;
  const briefingFingerprint = briefing.objective_snapshot?.fingerprint;
  if (expectedFingerprint && snapshotFingerprint !== expectedFingerprint) {
    throw new Error('Historical objective fingerprint mismatch.');
  }
  if (snapshotFingerprint && briefingFingerprint !== snapshotFingerprint) {
    throw new Error('Historical briefing fingerprint mismatch.');
  }
  return { briefing, objectiveSnapshot: snapshot };
}

export function isSimulatedBriefing(briefing) {
  const evidence = JSON.stringify({
    signalSource: briefing?.signal_source,
    evidenceSource: briefing?.evidence_source,
    provenance: briefing?.provenance,
    classification: briefing?.classification,
  });
  return /demo dataset|simulat/i.test(evidence);
}

export function isLiveBriefing(briefing) {
  return briefing?.evidence_mode === 'LIVE' || briefing?.provenance?.evidence_mode === 'LIVE';
}

export function creatorResultHeadline(briefing) {
  const item = Array.isArray(briefing?.items) ? briefing.items[0] : null;
  if (!item) return 'Your latest creator decision.';
  const source = briefing?.sources?.[0]?.source || '';
  const grounding = [item.what_changed, item.why_it_matters, item.recommended_action].filter(Boolean).join(' ');
  const pricingNeedsChecking = /\b(pricing|price|cost)\b/i.test(grounding)
    && /\b(not|does not|isn't|is not|verify|check|without)\b/i.test(grounding);
  if (/adobe/i.test(source) && /\bvideo\b/i.test(grounding)) {
    return pricingNeedsChecking
      ? 'Adobe unveiled new video tools — but pricing still needs checking.'
      : 'Adobe unveiled new video tools worth reviewing.';
  }
  const changed = String(item.what_changed || '').trim();
  const firstSentence = changed.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() || changed;
  return firstSentence || 'A relevant change deserves your attention.';
}

export function shortRunId(runId = '') {
  return String(runId).replace(/^run_/, '').slice(0, 8);
}

export function formatCompletedDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Completion date unavailable';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}
