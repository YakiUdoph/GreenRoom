import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { currentHomeResult, homeResultState } from '../lib/homeResult';
import { normalizeCreatorDecision } from '../lib/creatorDecision';

export const supportedExamples = [['YouTube changes', 'Tell me when YouTube changes something that could affect my channel.'], ['AI video tools', 'Watch for meaningful AI video-tool updates.'], ['Twitch opportunities', 'Watch for Twitch creator earning or sponsorship opportunities.']];
export const populateSupportedExample = (setGoal, example) => setGoal(example);
const verdict = value => ({ ACT_NOW: 'Act now', KEEP_WATCHING: 'Keep watching', IGNORE_FOR_NOW: 'Ignore for now' }[value] || 'Worth your attention');
const heroState = (state, decision) => state === 'working' ? 'GreenRoom is checking what changed.' : state === 'result' ? verdict(decision?.attention) : state === 'failed' ? 'This check didn’t complete.' : state === 'no-update' ? 'Nothing needs your attention right now.' : state === 'unsupported' ? 'This area is not supported live yet.' : 'Nothing needs your attention yet.';

export function HomePage({ memoryState, onOpenOfflineModal, onCreateObjective, isExecuting }) {
  const objective = memoryState?.creator_objectives?.[0];
  const run = memoryState?.latest_offline_run;
  const briefing = memoryState?.latest_briefing;
  const [goal, setGoal] = useState(objective?.title || '');
  useEffect(() => setGoal(objective?.title || ''), [objective?.title]);
  const state = useMemo(() => homeResultState(run, briefing), [run, briefing]);
  const decision = useMemo(() => normalizeCreatorDecision(currentHomeResult(run, briefing) ? briefing : null), [run, briefing]);
  const submit = async event => { event.preventDefault(); if (!goal.trim()) return; const result = await onCreateObjective(goal.trim()); setTimeout(() => onOpenOfflineModal(result.run), 0); };
  return <motion.div className="creator-desk today-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .45 }}>
    <header className="v2-brand-hero today-hero"><div className="v2-hero-copy"><p>TODAY · YOUR CREATOR INTELLIGENCE</p><h1>You create.<br />GreenRoom<br /><em>keeps watch.</em></h1><span>GreenRoom understands what you’re trying to build, checks supported creator sources, and brings back only what may matter to you.</span></div><div className="v2-hero-question"><small>THE QUESTION FOR TODAY</small><strong>What deserves my attention?</strong><span>{heroState(state, decision)}</span></div></header>
    <div className="decision-story-heading"><p>CURRENT DECISION</p><h2>A change becomes <em>a decision.</em></h2></div>
    <motion.section className={`attention-card state-${state}`} aria-live="polite" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, delay: .12 }}>
      {state === 'result' && decision ? <><div className="attention-topline"><strong>{verdict(decision.attention)}</strong>{decision.connection && <span>Connection: {decision.connection.toLowerCase()}</span>}</div><h2>{decision.headline}</h2><div className="decision-sections">
        {decision.noticed && <section><p>What I noticed</p><div>{decision.noticed}</div></section>}{decision.why && <section><p>Why this matters to you</p><div>{decision.why}</div></section>}{decision.action && <section className="next-action"><p>What I’d do next</p><div>{decision.action}</div></section>}{decision.uncertainty && <section className="uncertainty"><p>What’s uncertain</p><div>{decision.uncertainty}</div></section>}
      </div><footer>{decision.live ? 'Verified live evidence' : 'Verified run evidence'}{decision.verified ? ' · Decision by Udophia' : ''}</footer></> : <div className="attention-empty">
        {state === 'working' && <><span className="watch-pulse"/><h2>GreenRoom is checking what changed.</h2><p>You can leave and come back. An older decision will not replace this check.</p></>}
        {state === 'no-update' && <><h2>Nothing needs your attention right now.</h2><p>GreenRoom checked the supported evidence and found no reason to change what you’re doing.</p></>}
        {state === 'failed' && <><h2>This check didn’t complete.</h2><p>No older result has been substituted.</p><button onClick={onOpenOfflineModal}>Try again</button></>}
        {state === 'unsupported' && <><h2>GreenRoom can’t watch this area live yet.</h2><p>Try one of the supported areas below. GreenRoom will not manufacture an update.</p></>}
        {state === 'empty' && <><h2>Nothing needs your attention yet.</h2><p>Tell GreenRoom what to watch. A decision appears only after a genuine check completes.</p></>}
      </div>}
    </motion.section>
    <section className="watch-panel"><div><p>YOUR WATCH</p><h2>Keep an eye on something specific.</h2><span>Checks run only when you ask, across the supported first-party sources below.</span></div><form onSubmit={submit}><label htmlFor="watch-goal">What should GreenRoom watch?</label><div><input id="watch-goal" value={goal} onChange={event => setGoal(event.target.value)} placeholder="A creator change that matters to you" required/><button disabled={isExecuting || !goal.trim()}>{isExecuting ? 'Starting…' : 'Check now'}</button></div></form><div className="supported-examples">{supportedExamples.map(([label, example]) => <button type="button" key={label} onClick={() => setGoal(example)}>{label}</button>)}</div><small>Current coverage: selected official Adobe AI-video, YouTube platform, and Twitch creator updates.</small></section>
  </motion.div>;
}
export default HomePage;
