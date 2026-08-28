import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { creatorResultHeadline, currentIntelligence, formatCompletedDate, isLiveBriefing, isSimulatedBriefing, recentHistoryRuns, shortRunId, verifyHistoricalBriefing, verifyHistoricalRunRecord } from '../lib/briefingHistory';
import { cleanDecisionText } from '../lib/decisionText';

function BriefingFields({ briefing }) {
  const items = Array.isArray(briefing?.items) ? briefing.items.map((item) => ({
    ...item,
    title: cleanDecisionText(item.title),
    what_changed: cleanDecisionText(item.what_changed),
    summary: cleanDecisionText(item.summary),
    why_it_matters: cleanDecisionText(item.why_it_matters),
    recommended_action: cleanDecisionText(item.recommended_action),
    memory_context_used: cleanDecisionText(item.memory_context_used),
  })) : [];
  const sources = Array.isArray(briefing?.sources) ? briefing.sources : [];
  return <><div className="decision-briefings">{items.map((item, index) => <article key={item.id || index}><header><span>{String(index + 1).padStart(2, '0')}</span><h2>{creatorResultHeadline({ ...briefing, items: [item] })}</h2></header><dl><div><dt>WHAT CHANGED</dt><dd>{item.what_changed || item.summary || 'No verified change was supplied.'}</dd></div><div><dt>WHY IT MATTERS TO YOU</dt><dd>{item.why_it_matters || 'No creator-specific significance was supplied.'}</dd></div><div><dt>WHAT TO DO NEXT</dt><dd>{item.recommended_action || 'No next action was supplied.'}</dd></div>{item.memory_context_used && <div><dt>MEMORY USED</dt><dd>{item.memory_context_used}</dd></div>}</dl></article>)}</div>{sources.length > 0 && <section className="briefing-sources" aria-label="Live evidence sources"><header className="intelligence-section-head"><p>SOURCE</p><span>Verified first-party provenance for this decision.</span></header>{sources.map((source, index) => <article key={source.source_url || index}><small>SOURCE</small><strong>{source.source}</strong><h3>{source.title}</h3><div><time dateTime={source.published_at}>Published {formatCompletedDate(source.published_at)}</time><time dateTime={source.retrieved_at}>Retrieved {formatCompletedDate(source.retrieved_at)}</time></div><a href={source.source_url} target="_blank" rel="noreferrer">View source ↗</a></article>)}</section>}</>;
}

export function IntelligencePage({ memoryState }) {
  const { run: currentRun, status: currentStatus, currentBriefing } = useMemo(() => currentIntelligence(memoryState), [memoryState]);
  const [historyStatus, setHistoryStatus] = useState('loading');
  const [historyRuns, setHistoryRuns] = useState([]);
  const [selectedHistoricalRunId, setSelectedHistoricalRunId] = useState(null);
  const [selectedHistoricalBriefing, setSelectedHistoricalBriefing] = useState(null);
  const [selectedHistoricalSnapshot, setSelectedHistoricalSnapshot] = useState(null);
  const [historicalSelectionStatus, setHistoricalSelectionStatus] = useState('idle');
  const objectives = memoryState?.creator_objectives || [];
  const currentObjectiveId = currentRun?.objective_snapshot?.objective_id || currentRun?.objective_id;
  const currentObjective = objectives.find(objective => objective.id === currentObjectiveId) || (!currentRun ? objectives[0] : null);

  useEffect(() => {
    let disposed = false;
    setHistoryStatus('loading');
    api.getRecentBriefingRuns().then(async recent => {
      const records = recentHistoryRuns(recent, currentRun?.run_id);
      const resolved = await Promise.allSettled(records.map(async record => {
        const statusResponse = await api.getBriefingStatus(record.run_id);
        const verifiedRun = verifyHistoricalRunRecord(record, statusResponse);
        if (statusResponse.status === 'COMPLETED') {
          const briefingResponse = await api.getRunBriefing(record.run_id);
          const verified = verifyHistoricalBriefing(record, statusResponse, briefingResponse);
          return { ...record, title: verified.objectiveSnapshot.title, completed_at: statusResponse.completed_at || record.completed_at };
        }
        return { ...record, status: verifiedRun.status, title: verifiedRun.objectiveSnapshot?.title || 'Creator objective', completed_at: statusResponse.completed_at || record.completed_at };
      }));
      if (disposed) return;
      const valid = resolved.filter(result => result.status === 'fulfilled').map(result => result.value);
      setHistoryRuns(valid);
      setHistoryStatus(records.length > 0 && valid.length === 0 ? 'error' : 'ready');
    }).catch(() => {
      if (!disposed) setHistoryStatus('error');
    });
    return () => { disposed = true; };
  }, [currentBriefing?.run_id, currentRun?.run_id]);

  const selectHistoricalRun = async record => {
    setSelectedHistoricalRunId(record.run_id);
    setSelectedHistoricalBriefing(null);
    setSelectedHistoricalSnapshot(null);
    setHistoricalSelectionStatus('loading');
    try {
      const [statusResponse, briefingResponse] = await Promise.all([
        api.getBriefingStatus(record.run_id),
        api.getRunBriefing(record.run_id),
      ]);
      const verified = verifyHistoricalBriefing(record, statusResponse, briefingResponse);
      setSelectedHistoricalBriefing(verified.briefing);
      setSelectedHistoricalSnapshot({ ...verified.objectiveSnapshot, completed_at: statusResponse.completed_at || record.completed_at });
      setHistoricalSelectionStatus('ready');
    } catch {
      setSelectedHistoricalBriefing(null);
      setSelectedHistoricalSnapshot(null);
      setHistoricalSelectionStatus('error');
    }
  };

  const currentItems = Array.isArray(currentBriefing?.items) ? currentBriefing.items : [];
  return <div className="rich-route intelligence-route">
    <section className="route-visual-hero"><img src="/assets/greenroom-creator-night.png" alt="Creator reviewing results"/><div className="route-visual-copy"><p>Results / what deserves attention</p><h1>Your decision briefing.</h1><span>Current work stays separate from the completed results you can revisit.</span></div><div className="route-visual-meta"><span>{String(currentItems.length).padStart(2, '0')} current results</span></div></section>
    <section className="density-shell">
      <header className="intelligence-section-head"><p>CURRENT RESULT</p><span>The active run is authoritative. Previous results never complete it.</span></header>
      <div className="density-band is-three"><article><small>CURRENT OBJECTIVE / 01</small><h3>{currentObjective?.title || currentRun?.objective_snapshot?.title || 'No current objective is active.'}</h3><p>Only a matching completed run can supply the current result.</p></article><article><small>CURRENT STATUS / 02</small><strong>{currentStatus}</strong><p>{currentStatus === 'WORKING' ? 'GreenRoom is checking first-party evidence in the background.' : currentStatus === 'RUN FAILED' ? 'The current run did not produce a result.' : currentStatus === 'NO RELEVANT UPDATE' ? 'No sufficiently relevant current evidence passed the live filters.' : currentStatus === 'NO LIVE PROVIDER' ? 'This creator objective does not have a live evidence provider yet.' : currentStatus === 'RESULT READY' ? 'This run has its own source-backed briefing.' : 'No current result is ready.'}</p></article><article><small>EVIDENCE / 03</small><h3>{currentBriefing && isSimulatedBriefing(currentBriefing) ? 'DEMO DATASET — SIMULATED' : currentBriefing && isLiveBriefing(currentBriefing) ? 'LIVE EVIDENCE' : 'AWAITING COMPLETED EVIDENCE'}</h3><p>{currentBriefing ? 'Evidence provenance stays attached to this run.' : 'No historical evidence is presented as current.'}</p></article></div>
      <div className="route-image-ribbon"><img src="/assets/greenroom-living-network.png" alt="Signal network"/><span>The current decision, with its reasoning attached</span></div>
      {currentBriefing ? <BriefingFields briefing={currentBriefing}/> : <div className="density-empty">{currentStatus === 'WORKING' ? 'GreenRoom is checking live evidence in the background. You can leave this screen and return later.' : currentStatus === 'RUN FAILED' ? 'This run failed. GreenRoom will not show an older briefing as the current result.' : currentStatus === 'NO RELEVANT UPDATE' ? 'No relevant live update was found. Previous briefings remain available below but are not this run’s result.' : currentStatus === 'NO LIVE PROVIDER' ? 'This objective is saved, but GreenRoom does not yet have a live provider for its domain. No faked update was substituted.' : 'No current result is ready. Completed historical results remain available below.'}</div>}

      <section className="briefing-history" aria-labelledby="previous-briefings-heading">
        <header className="intelligence-section-head"><p id="previous-briefings-heading">RUN HISTORY</p><span>Previous checks, newest first, with their real completion state.</span></header>
        {historyStatus === 'loading' && <div className="history-message" role="status">Loading run history…</div>}
        {historyStatus === 'error' && <div className="history-message" role="alert">Run history is temporarily unavailable.</div>}
        {historyStatus === 'ready' && historyRuns.length === 0 && <div className="history-message">No previous runs yet.</div>}
        {historyStatus === 'ready' && historyRuns.length > 0 && <div className="history-list">{historyRuns.map(record => <button type="button" key={record.run_id} disabled={record.status !== 'COMPLETED'} className={selectedHistoricalRunId === record.run_id ? 'is-selected' : ''} onClick={() => record.status === 'COMPLETED' && selectHistoricalRun(record)}><time dateTime={record.completed_at || record.queued_at}>{formatCompletedDate(record.completed_at || record.queued_at)}</time><span>{record.title || 'Creator objective'}</span><small>{record.status.replaceAll('_', ' ')}</small></button>)}</div>}

        {historicalSelectionStatus === 'loading' && <div className="history-message" role="status">Loading previous result…</div>}
        {historicalSelectionStatus === 'error' && <div className="history-message" role="alert">This previous result could not be verified.</div>}
        {historicalSelectionStatus === 'ready' && selectedHistoricalBriefing && <article className="historical-briefing"><header><p>PREVIOUS RESULT</p><h2>{selectedHistoricalSnapshot?.title || 'Completed creator briefing'}</h2><div><span>Completed {formatCompletedDate(selectedHistoricalSnapshot?.completed_at)}</span><span>Run {shortRunId(selectedHistoricalBriefing.run_id)}</span></div>{isSimulatedBriefing(selectedHistoricalBriefing) && <strong>DEMO DATASET — SIMULATED</strong>}{isLiveBriefing(selectedHistoricalBriefing) && <strong>LIVE EVIDENCE</strong>}</header><BriefingFields briefing={selectedHistoricalBriefing}/></article>}
      </section>
    </section>
  </div>;
}

export default IntelligencePage;
