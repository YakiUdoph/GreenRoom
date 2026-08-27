import React from 'react';
import { GreenroomCore } from '../components/mind/GreenroomCore';

export function MindPage({ memoryState, isExecuting }) {
  const objective = memoryState?.creator_objectives?.[0];
  const returned = memoryState?.latest_briefing?.items?.length;
  const state = isExecuting ? 'WORKING' : returned ? 'RESULT READY' : objective ? 'READY' : 'WAITING';
  const coreState = isExecuting ? 'WORKING' : returned ? 'RETURNED' : objective ? 'WATCHING' : 'REMEMBERING';

  return <div className="rich-route mind-route">
    <section className="route-visual-hero">
      <img src="/assets/greenroom-living-network.png" alt="" />
      <div className="route-visual-copy"><p>MIND / PERSISTENT INTELLIGENCE</p><h1><span>Your persistent</span><span>GreenRoom Mind</span></h1><span>GreenRoom carries creator context across objectives, sessions, and background work.</span></div>
      <div className="route-visual-object"><GreenroomCore stateName={coreState} /></div>
      <div className="route-visual-meta"><span>State: {state}</span><span>Context: {objective ? 'Held' : 'Waiting'}</span></div>
    </section>
    <section className="density-shell">
      <div className="density-band is-three">
        <article><small>REMEMBERS / 01</small><h2>Creator context</h2><p>Creator preferences and decision context persist across sessions.</p></article>
        <article><small>OBJECTIVE HELD / 02</small><h2>{objective ? 'In context' : 'Waiting for an objective'}</h2><p>{objective?.title || 'Set an objective so GreenRoom has a durable thread to hold.'}</p></article>
        <article><small>BACKGROUND READY / 03</small><h2>{objective ? 'Ready when needed' : 'Ready after setup'}</h2><p>Work can continue without requiring the creator to remain in a chat.</p></article>
      </div>
      <div className="mind-identity-block"><p>CONNECTED MIND CAPABILITY</p><h2>Udophia, truthfully separated.</h2><div className="mind-capability-copy">Udophia is GreenRoom’s verified persistent Mind integration. Today’s reliable source-backed briefings use the GreenRoom deterministic live core and are not attributed to Udophia. The connected Mind capability remains available separately.</div></div>
    </section>
  </div>;
}

export default MindPage;
