import React from 'react';
import { GreenroomCore } from '../components/mind/GreenroomCore';

export function MindPage({ mindsStatus, memoryState, isExecuting }) {
  const objective = memoryState?.creator_objectives?.[0];
  const returned = memoryState?.latest_briefing?.items?.length;
  const connected = mindsStatus?.connected === true;
  const state = isExecuting ? 'WORKING' : returned ? 'RESULT READY' : objective ? 'READY' : 'WAITING';
  const coreState = isExecuting ? 'WORKING' : returned ? 'RETURNED' : objective ? 'WATCHING' : 'REMEMBERING';

  return <div className="rich-route mind-route">
    <section className="route-visual-hero">
      <img src="/assets/greenroom-living-network.png" alt="" />
      <div className="route-visual-copy"><p>MIND / UDOPHIA</p><h1><span>Your persistent</span><span>GreenRoom Mind</span></h1><span>Udophia works with the creator context and objective GreenRoom keeps between sessions.</span></div>
      <div className="route-visual-object"><GreenroomCore stateName={coreState} /></div>
      <div className="route-visual-meta"><span>State: {state}</span><span>Context: {objective ? 'Held' : 'Waiting'}</span></div>
    </section>
    <section className="density-shell">
      <div className="density-band is-three">
        <article><small>CONNECTION / 01</small><strong>{connected ? 'CONNECTED' : 'UNAVAILABLE'}</strong><p>{connected ? 'The configured platform identity is verified by current application state.' : 'GreenRoom is not claiming an active connection.'}</p></article>
        <article><small>REMEMBERS CONTEXT / 02</small><h2>{objective ? 'Objective held' : 'Waiting for an objective'}</h2><p>{objective?.title || 'Set an objective so GreenRoom has a durable thread to hold.'}</p></article>
        <article><small>BACKGROUND CAPABLE / 03</small><strong>{objective ? 'READY' : 'WAITING'}</strong><p>{objective ? 'Background work can begin from the objective experience.' : 'Background work requires a saved objective.'}</p></article>
      </div>
      <div className="mind-identity-block"><p>VERIFIED PLATFORM MIND</p><h2>Udophia</h2><a href="mailto:udophia@hellominds.ai">udophia@hellominds.ai</a><code>8208493e-f36b-1410-8466-00039ce7df11</code></div>
    </section>
  </div>;
}

export default MindPage;
