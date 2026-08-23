import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { completedHistoryRuns, currentIntelligence, formatCompletedDate, isSimulatedBriefing, shortRunId, verifyHistoricalBriefing } from '../lib/briefingHistory';

function BriefingFields({ briefing }) {
  const items = Array.isArray(briefing?.items) ? briefing.items : [];
  return <div className="decision-briefings">{items.map((item, index) => <article key={item.id || index}><header><span>{String(index + 1).padStart(2, '0')}</span><h2>{item.title}</h2></header><dl><div><dt>WHAT CHANGED</dt><dd>{item.what_changed || item.summary || 'No verified change was supplied.'}</dd></div><div><dt>WHY IT MATTERS</dt><dd>{item.why_it_matters || 'No creator-specific significance was supplied.'}</dd></div><div><dt>WHAT TO DO NEXT</dt><dd>{item.recommended_action || 'No next action was supplied.'}</dd></div></dl></article>)}</div>;
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
      const completed = completedHistoryRuns(recent, currentBriefing);
      const resolved = await Promise.allSettled(completed.map(async record => {
        const [statusResponse, briefingResponse] = await Promise.all([
          api.getBriefingStatus(record.run_id),
          api.getRunBriefing(record.run_id),
        ]);
        const verified = verifyHistoricalBriefing(record, statusResponse, briefingResponse);
        return { ...record, title: verified.objectiveSnapshot.title, completed_at: statusResponse.completed_at || record.completed_at };
      }));
      if (disposed) return;
      const valid = resolved.filter(result => result.status === 'fulfilled').map(result => result.value);
      setHistoryRuns(valid);
      setHistoryStatus(completed.length > 0 && valid.length === 0 ? 'error' : 'ready');
    }).catch(() => {
      if (!disposed) setHistoryStatus('error');
    });
    return () => { disposed = true; };
  }, [currentBriefing?.run_id]);

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
    <section className="route-visual-hero"><img src="/assets/greenroom-creator-night.png" alt="Creator reviewing intelligence"/><div className="route-visual-copy"><p>Intelligence / what deserves attention</p><h1>Your decision briefing.</h1><span>Current work stays separate from the completed intelligence you can revisit.</span></div><div className="route-visual-meta"><span>{String(currentItems.length).padStart(2, '0')} current returns</span></div></section>
    <section className="density-shell">
      <header className="intelligence-section-head"><p>CURRENT INTELLIGENCE</p><span>The active run is authoritative. Previous results never complete it.</span></header>
      <div className="density-band is-three"><article><small>CURRENT OBJECTIVE / 01</small><h3>{currentObjective?.title || currentRun?.objective_snapshot?.title || 'No current objective is active.'}</h3><p>Only a matching completed run can supply the current result.</p></article><article><small>CURRENT STATUS / 02</small><strong>{currentStatus}</strong><p>{currentStatus === 'WORKING' ? 'GreenRoom is working in the background.' : currentStatus === 'RUN FAILED' ? 'The current run did not produce a result.' : currentStatus === 'RESULT READY' ? 'This run has its own verified briefing.' : 'No current result is ready.'}</p></article><article><small>EVIDENCE / 03</small><h3>{currentBriefing && isSimulatedBriefing(currentBriefing) ? 'DEMO DATASET — SIMULATED' : 'AWAITING COMPLETED EVIDENCE'}</h3><p>{currentBriefing ? 'Evidence provenance stays attached to this run.' : 'No historical evidence is presented as current.'}</p></article></div>
      <div className="route-image-ribbon"><img src="/assets/greenroom-living-network.png" alt="Signal network"/><span>The current decision, with its reasoning attached</span></div>
      {currentBriefing ? <BriefingFields briefing={currentBriefing}/> : <div className="density-empty">{currentStatus === 'WORKING' ? 'GreenRoom is working in the background. You can leave this screen and return later.' : currentStatus === 'RUN FAILED' ? 'This run failed. GreenRoom will not show an older briefing as the current result.' : 'No current briefing yet. Completed historical intelligence remains available below.'}</div>}

      <section className="briefing-history" aria-labelledby="previous-briefings-heading">
        <header className="intelligence-section-head"><p id="previous-briefings-heading">PREVIOUS BRIEFINGS</p><span>Completed intelligence from earlier objectives.</span></header>
        {historyStatus === 'loading' && <div className="history-message" role="status">Loading previous briefings…</div>}
        {historyStatus === 'error' && <div className="history-message" role="alert">Previous briefings are temporarily unavailable.</div>}
        {historyStatus === 'ready' && historyRuns.length === 0 && <div className="history-message">No completed briefings yet.</div>}
        {historyStatus === 'ready' && historyRuns.length > 0 && <div className="history-list">{historyRuns.map(record => <button type="button" key={record.run_id} className={selectedHistoricalRunId === record.run_id ? 'is-selected' : ''} onClick={() => selectHistoricalRun(record)}><time dateTime={record.completed_at}>{formatCompletedDate(record.completed_at)}</time><span>{record.title || 'Completed creator briefing'}</span><small>COMPLETED</small></button>)}</div>}

        {historicalSelectionStatus === 'loading' && <div className="history-message" role="status">Loading previous briefing…</div>}
        {historicalSelectionStatus === 'error' && <div className="history-message" role="alert">This previous briefing could not be verified.</div>}
        {historicalSelectionStatus === 'ready' && selectedHistoricalBriefing && <article className="historical-briefing"><header><p>PREVIOUS BRIEFING</p><h2>{selectedHistoricalSnapshot?.title || 'Completed creator briefing'}</h2><div><span>Completed {formatCompletedDate(selectedHistoricalSnapshot?.completed_at)}</span><span>Run {shortRunId(selectedHistoricalBriefing.run_id)}</span></div>{isSimulatedBriefing(selectedHistoricalBriefing) && <strong>DEMO DATASET — SIMULATED</strong>}</header><BriefingFields briefing={selectedHistoricalBriefing}/></article>}
      </section>
    </section>
  </div>;
}

export default IntelligencePage;
