import React from 'react';

export function IntelligencePage({ memoryState }) {
  const briefing = memoryState?.latest_briefing;
  const items = Array.isArray(briefing?.items) ? briefing.items : [];
  const objective = memoryState?.creator_objectives?.[0];
  const runStatus = memoryState?.latest_offline_run?.status;
  const state = runStatus === 'FAILED' ? 'RUN FAILED' : ['QUEUED', 'RUNNING', 'SUBMITTING', 'WAITING_FOR_MINDS'].includes(runStatus) ? 'WORKING' : items.length ? 'RESULT READY' : 'WAITING';

  return <div className="rich-route intelligence-route">
    <section className="route-visual-hero"><img src="/assets/greenroom-creator-night.png" alt="Creator reviewing intelligence"/><div className="route-visual-copy"><p>Intelligence / what deserves attention</p><h1>Your decision briefing.</h1><span>Each completed return explains what changed, why it matters, and what to do next.</span></div><div className="route-visual-meta"><span>{String(items.length).padStart(2,'0')} ranked returns</span></div></section>
    <section className="density-shell">
      <div className="density-band is-three"><article><small>OBJECTIVE / 01</small><h3>{objective?.title || 'No objective is active.'}</h3><p>Every result stays bound to the objective that produced it.</p></article><article><small>STATUS / 02</small><strong>{state}</strong><p>{state === 'WORKING' ? 'GreenRoom is working in the background.' : state === 'RUN FAILED' ? 'The current run did not produce a result.' : state === 'RESULT READY' ? 'A completed briefing is ready to review.' : 'No briefing has returned yet.'}</p></article><article><small>EVIDENCE / 03</small><h3>DEMO DATASET — SIMULATED</h3><p>Current evidence is demonstrative, not live web research.</p></article></div>
      <div className="route-image-ribbon"><img src="/assets/greenroom-living-network.png" alt="Signal network"/><span>The decision, with its reasoning attached</span></div>
      {items.length ? <div className="decision-briefings">{items.map((item, i) => <article key={item.id || i}><header><span>{String(i + 1).padStart(2, '0')}</span><h2>{item.title}</h2></header><dl><div><dt>WHAT CHANGED</dt><dd>{item.what_changed || item.summary || 'No verified change was supplied.'}</dd></div><div><dt>WHY IT MATTERS</dt><dd>{item.why_it_matters || 'No creator-specific significance was supplied.'}</dd></div><div><dt>WHAT TO DO NEXT</dt><dd>{item.recommended_action || 'No next action was supplied.'}</dd></div></dl></article>)}</div> : <div className="density-empty">{state === 'WORKING' ? 'GreenRoom is working in the background. You can leave this screen and return later.' : state === 'RUN FAILED' ? 'This run failed. GreenRoom will not show an older briefing as the current result.' : 'No briefing yet. Set an objective on Home, then start background work.'}</div>}
    </section>
  </div>;
}

export default IntelligencePage;
