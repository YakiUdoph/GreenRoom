import React from 'react';
import { GreenroomCore } from '../components/mind/GreenroomCore';

const lifecycle = [
  ['01', 'OBJECTIVE', 'The creator outcome held in view.'],
  ['02', 'CONTEXT', 'Useful memory collected around that outcome.'],
  ['03', 'WATCH', 'Signals compared against the held thread.'],
  ['04', 'INTERPRET', 'Signal read for relevance and confidence.'],
  ['05', 'RETURN', 'An actionable briefing ranked and returned.'],
];

export function MindPage({ mindsStatus, memoryState, onRunStep, isExecuting }) {
  const objective = memoryState?.creator_objectives?.[0];
  const returned = memoryState?.latest_briefing?.items?.length;
  const state = isExecuting ? 'WORKING' : returned ? 'RETURNED' : objective ? 'WATCHING' : 'REMEMBERING';

  return <div className="rich-route mind-route">
    <section className="route-visual-hero">
      <img src="/assets/greenroom-living-network.png" alt="" />
      <div className="route-visual-copy">
        <p>MIND / PERSISTENT LAYER</p>
        <h1><span>The living</span><span>GreenRoom Mind</span></h1>
        <span>It holds the objective, keeps watching, and resolves the work when a verified return arrives.</span>
      </div>
      <div className="route-visual-object"><GreenroomCore stateName={state} /></div>
      <div className="route-visual-meta"><span>State: {state}</span><span>Context: {objective ? 'Held' : 'Waiting'}</span></div>
    </section>
    <section className="density-shell">
      <div className="density-band is-three">
        <article><small>CONTEXT HOLDER / 01</small><h2>Objective</h2><p>{objective?.title || 'No objective is set yet. Greenroom is waiting for the thread to hold.'}</p></article>
        <article><small>CURRENT STATE / 02</small><strong>{state}</strong><p>The Mind changes state only as real work moves through the product.</p></article>
        <article><small>MIND IDENTITY / 03</small><h3>{mindsStatus?.real_platform_mind?.mindId || mindsStatus?.mind_id || 'Awaiting verified run'}</h3><p>{mindsStatus?.connected ? 'Production Mind connected.' : 'Identity is shown only when verified.'}</p></article>
      </div>
      <div className="route-micro-flow"><p>MIND LIFECYCLE</p><div>{lifecycle.map((item, index) => <article key={item[1]}><span>{item[0]}</span><h3>{item[1]}</h3><p>{item[2]}</p><button disabled={isExecuting} onClick={() => onRunStep(index + 1)}>Run step</button></article>)}</div></div>
      <div className="route-cta-row"><div><p>REMEMBER. WATCH. RETURN.</p><span>Each control invokes the existing production lifecycle handler.</span></div><button disabled={isExecuting} onClick={() => onRunStep(1)}>Begin lifecycle ↗</button></div>
    </section>
  </div>;
}

export default MindPage;
