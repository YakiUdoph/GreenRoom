import React, { useEffect, useMemo, useState } from 'react';
import { cleanDecisionText } from '../lib/decisionText';

const WORKING_STATES = ['QUEUED', 'RUNNING', 'WORKING', 'SUBMITTING', 'WAITING_FOR_MINDS'];
const exampleResult = {
  title: 'A useful tool update, interpreted for your workflow',
  what_changed: 'An AI video tool added a faster way to clean up dialogue and prepare clips for editing.',
  why_it_matters: 'It could shorten a repetitive part of your workflow without forcing you to change your whole setup.',
  recommended_action: 'Try it on one short clip and compare the time and quality with your current process.',
};
const steps = [
  ['01', '◎', 'Tell us your goal', "Share what you're working toward and what matters to you."],
  ['02', '◉', 'Your Mind remembers', 'Your preferences and past decisions carry forward.'],
  ['03', '✦', 'Get useful decisions', 'When something relevant changes, GreenRoom tells you what changed, why it matters, and what to do next.'],
];
const clean = (value = '') => cleanDecisionText(String(value).replace(/ScoutMind detected/i, 'GreenRoom found').replaceAll('_', ' '));

export function HomePage({ memoryState, onNavigate, onOpenOfflineModal, onCreateObjective, isExecuting }) {
  const objective = memoryState?.creator_objectives?.[0];
  const run = memoryState?.latest_offline_run;
  const briefing = memoryState?.latest_briefing;
  const runStatus = run?.status;
  const isWorking = WORKING_STATES.includes(runStatus);
  const isCurrentBriefing = runStatus === 'COMPLETED'
    && briefing?.run_id === run?.run_id
    && briefing?.objective_id === run?.objective_id;
  const currentItem = isCurrentBriefing && Array.isArray(briefing?.items) ? briefing.items[0] : null;
  const result = currentItem || exampleResult;
  const isExample = !currentItem;
  const [goal, setGoal] = useState(objective?.title || '');

  useEffect(() => {
    setGoal(objective?.title || '');
  }, [objective?.title]);

  const resultState = useMemo(() => {
    if (runStatus === 'UNSUPPORTED_DOMAIN') return 'unsupported';
    if (runStatus === 'FAILED') return 'failed';
    if (runStatus === 'NO_RELEVANT_UPDATE') return 'no-update';
    if (isWorking) return 'working';
    return 'result';
  }, [isWorking, runStatus]);

  const submitGoal = async (event) => {
    event.preventDefault();
    const title = goal.trim();
    if (!title) return;
    const result = await onCreateObjective(title);
    setTimeout(() => onOpenOfflineModal(result.run), 0);
  };

  return <div className="manus-home home-compressed">
    <section className="new-hero home-goal" aria-labelledby="home-title">
      <div className="hero-intro home-goal__content">
        <p className="hero-overline">YOUR CREATIVE COMPANION</p>
        <h1 id="home-title">GreenRoom<br />keeps <em>watch</em><br />while you create.</h1>
        <p>Tell GreenRoom what you're working toward. It remembers what matters to you, watches for useful changes, and tells you what deserves your attention.</p>
        <form className="goal-form" onSubmit={submitGoal}>
          <label htmlFor="watch-goal">What should GreenRoom keep an eye on for you?</label>
          <div className="goal-entry">
            <input id="watch-goal" value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="e.g. Find better tools for making my videos" autoFocus={Boolean(objective)} required />
            <button type="submit" disabled={isExecuting || !goal.trim()}>Start watching <span aria-hidden="true">→</span></button>
          </div>
        </form>
        <p className="coverage-note"><span aria-hidden="true">✓</span><span><strong>Live monitoring currently supports AI video tools. More creator categories are coming.</strong><small>Starting with creator tools. Built for the decisions around your whole creative work.</small></span></p>
      </div>
      <aside className="hero-result-toast" aria-label="Illustrative product preview">
        <span>ILLUSTRATIVE PREVIEW</span>
        <strong>GreenRoom found something</strong>
        <p>New AI video tools and updates that match your goal.</p>
        <button type="button" onClick={() => onNavigate('intelligence')}>View example</button>
      </aside>
    </section>

    <section className="process-story home-process" aria-labelledby="process-title">
      <div className="process-heading"><div><p>HOW IT WORKS</p><h2 id="process-title">Three steps to useful decisions</h2></div></div>
      <ol className="process-strip">{steps.map(([number, icon, title, copy]) => <li key={number}>
        <span className="process-number">{number}</span><span className="process-icon" aria-hidden="true">{icon}</span><div><h3>{title}</h3><p>{copy}</p></div>
      </li>)}</ol>
    </section>

    <section className="return-story home-result" aria-labelledby="result-title">
      <div className="home-result__visual" role="img" aria-label="Camera beside a creator video-editing workstation" />
      <article className={`result-preview is-${resultState}`}>
        <header className="result-preview__heading"><span>{isExample ? 'RESULT PREVIEW · EXAMPLE' : 'LATEST RESULT'}</span><h2 id="result-title">A change becomes <em>a decision.</em></h2></header>
        {resultState === 'working' ? <div className="result-message"><span className="watch-pulse" /><strong>GreenRoom is watching</strong><p>Your Mind is deciding whether the latest changes matter to you. You can come back later.</p></div>
        : resultState === 'unsupported' ? <div className="result-message"><strong>GreenRoom can't watch this category live yet.</strong><p>AI video tools are supported now. More creator categories are coming.</p></div>
        : resultState === 'failed' ? <div className="result-message"><strong>This check didn't complete.</strong><p>No older result has been substituted. Try checking again when you're ready.</p><button type="button" onClick={onOpenOfflineModal}>Try again</button></div>
        : resultState === 'no-update' ? <div className="result-message"><strong>Nothing needs your attention right now.</strong><p>GreenRoom checked the current sources and found no relevant update.</p></div>
        : <><dl>
          <div><span className="result-icon" aria-hidden="true">↗</span><div><dt>WHAT CHANGED</dt><dd>{clean(result.what_changed)}</dd></div></div>
          <div><span className="result-icon" aria-hidden="true">◇</span><div><dt>WHY IT MATTERS</dt><dd>{clean(result.why_it_matters)}</dd></div></div>
          <div><span className="result-icon" aria-hidden="true">✓</span><div><dt>WHAT TO DO NEXT</dt><dd>{clean(result.recommended_action)}</dd></div></div>
        </dl><footer><span aria-hidden="true">◇</span> Based on verified first-party sources · Powered by Your Mind{isExample ? ' · Example only' : ''}</footer>{currentItem && <button type="button" onClick={() => onNavigate('intelligence')}>See full result</button>}</>}
      </article>
    </section>
  </div>;
}

export default HomePage;
