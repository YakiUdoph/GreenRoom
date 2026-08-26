const PENDING_STATUSES = new Set(['QUEUED', 'RUNNING', 'SUBMITTING', 'WAITING_FOR_MINDS']);

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

export function shortRunId(runId = '') {
  return String(runId).replace(/^run_/, '').slice(0, 8);
}

export function formatCompletedDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Completion date unavailable';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}
