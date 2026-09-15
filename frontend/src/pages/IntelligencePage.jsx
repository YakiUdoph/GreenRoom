import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { formatCompletedDate, isSimulatedBriefing, recentHistoryRuns, verifyHistoricalBriefing, verifyHistoricalRunRecord } from '../lib/briefingHistory';
import { normalizeCreatorDecision } from '../lib/creatorDecision';

function DecisionDetail({ briefing }) {
  const decision = normalizeCreatorDecision(briefing);
  if (!decision) return <p className="soft-empty">This completed result contains no decision to display.</p>;
  return <div className="history-detail"><strong>{decision.attention?.replaceAll('_', ' ') || 'Completed decision'}</strong><h2>{decision.headline}</h2>{decision.noticed && <section><p>What GreenRoom noticed</p><div>{decision.noticed}</div></section>}{decision.why && <section><p>Why it mattered</p><div>{decision.why}</div></section>}{decision.action && <section className="next-action"><p>What GreenRoom recommended</p><div>{decision.action}</div></section>}{decision.uncertainty && <section><p>What was uncertain</p><div>{decision.uncertainty}</div></section>}<details><summary>Evidence and provenance</summary><p>{decision.live ? 'Verified live evidence.' : 'Evidence mode recorded with this run.'}{decision.verified ? ' Decision by verified Udophia.' : ''}</p>{decision.sources.map((source, index) => source.source_url ? <a key={source.source_url || index} href={source.source_url} target="_blank" rel="noreferrer">{source.title || source.source || 'View source'} ↗</a> : null)}</details></div>;
}

export function IntelligencePage({ memoryState }) {
  const currentRunId = memoryState?.latest_offline_run?.run_id;
  const [state, setState] = useState('loading'); const [runs, setRuns] = useState([]); const [selected, setSelected] = useState(null); const [detailState, setDetailState] = useState('idle');
  useEffect(() => { let disposed = false; api.getRecentBriefingRuns().then(async recent => {
    const records = recentHistoryRuns(recent, currentRunId);
    const checked = await Promise.allSettled(records.map(async record => { const status = await api.getBriefingStatus(record.run_id); verifyHistoricalRunRecord(record, status); if (status.status !== 'COMPLETED') return null; const response = await api.getRunBriefing(record.run_id); const verified = verifyHistoricalBriefing(record, status, response); if (isSimulatedBriefing(verified.briefing)) return null; return { record, status, briefing: verified.briefing, snapshot: verified.objectiveSnapshot }; }));
    if (!disposed) { setRuns(checked.filter(item => item.status === 'fulfilled' && item.value).map(item => item.value)); setState('ready'); }
  }).catch(() => !disposed && setState('error')); return () => { disposed = true; }; }, [currentRunId]);
  const choose = item => { setDetailState('loading'); setSelected(null); Promise.all([api.getBriefingStatus(item.record.run_id), api.getRunBriefing(item.record.run_id)]).then(([status, response]) => { const verified = verifyHistoricalBriefing(item.record, status, response); if (isSimulatedBriefing(verified.briefing)) throw new Error('Simulated'); setSelected({ ...item, briefing: verified.briefing }); setDetailState('ready'); }).catch(() => setDetailState('error')); };
  return <motion.div className="creator-desk history-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .45 }}><header className="v2-brand-hero history-hero"><img src="/assets/greenroom-living-network.png" alt="A quiet network of connected signals"/><div className="v2-hero-copy"><p>HISTORY</p><h1>What GreenRoom decided, and why.</h1><span>Verified completed checks you can revisit. Previous work is never presented as today’s result.</span></div></header>
    <section className="history-layout"><div className="history-index">
      {state === 'loading' && <p role="status">Loading history…</p>}{state === 'error' && <p role="alert">History is temporarily unavailable.</p>}{state === 'ready' && runs.length === 0 && <p className="soft-empty">No verified completed decisions yet.</p>}
      {runs.map(item => { const decision = normalizeCreatorDecision(item.briefing); const completed = item.status.completed_at || item.record.completed_at; return <button key={item.record.run_id} className={selected?.record.run_id === item.record.run_id ? 'is-selected' : ''} onClick={() => choose(item)}><time dateTime={completed}>{formatCompletedDate(completed)}</time><strong>{decision?.headline || item.snapshot?.title || 'Creator decision'}</strong><span>{decision?.attention?.replaceAll('_', ' ') || 'COMPLETED'}</span></button>; })}
    </div><div>{detailState === 'idle' && runs.length > 0 && <p className="history-prompt">Choose a decision to revisit.</p>}{detailState === 'loading' && <p role="status">Opening decision…</p>}{detailState === 'error' && <p role="alert">This result could not be verified.</p>}{detailState === 'ready' && selected && <DecisionDetail briefing={selected.briefing}/>}</div></section>
  </motion.div>;
}
export default IntelligencePage;
