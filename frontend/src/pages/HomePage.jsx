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
  ['01', 'Tell us your goal', 'What are you trying to improve?'],
  ['02', 'Your Mind remembers', 'Useful preferences and previous decisions carry forward.'],
  ['03', 'Get useful decisions', 'When something relevant changes, GreenRoom tells you what changed, why it matters, and what to do next.'],
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
  const [editingGoal, setEditingGoal] = useState(!objective);
  const [goal, setGoal] = useState(objective?.title || '');

  useEffect(() => {
    if (!editingGoal) setGoal(objective?.title || '');
  }, [objective?.title, editingGoal]);

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
    await onCreateObjective(title);
    setEditingGoal(false);
  };

  return <div className="manus-home home-compressed">
    <section className="new-hero home-goal" aria-labelledby="home-title">
      <div className="hero-intro home-goal__content">
        <p className="hero-overline">GREENROOM</p>
        <h1 id="home-title">GreenRoom keeps watch <em>while you create.</em></h1>
        <p>Tell GreenRoom what you're working toward. It remembers what matters to you, watches for useful changes, and tells you what deserves your attention.</p>
        <form className="goal-form" onSubmit={submitGoal}>
          <label htmlFor="watch-goal">What should GreenRoom keep an eye on for you?</label>
          {objective && !editingGoal ? <div className="goal-current">
            <strong>{objective.title}</strong>
            <button type="button" onClick={() => setEditingGoal(true)}>Edit</button>
          </div> : <div className="goal-entry">
            <input id="watch-goal" value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="e.g. Find better tools for making my videos" autoFocus={Boolean(objective)} required />
            <button type="submit" disabled={isExecuting || !goal.trim()}>Start watching</button>
          </div>}
        </form>
        <p className="coverage-note">Live monitoring currently supports AI video tools. More creator categories are coming.</p>
      </div>
    </section>

    <section className="process-story home-process" aria-labelledby="process-title">
      <div className="process-heading"><div><p>HOW IT WORKS</p><h2 id="process-title">One clear thread.</h2></div></div>
      <ol className="process-strip">{steps.map(([number, title, copy]) => <li key={number}>
        <span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div>
      </li>)}</ol>
    </section>

    <section className="return-story home-result" aria-labelledby="result-title">
      <div className="home-result__intro">
        <p>{isExample ? 'EXAMPLE RESULT' : 'LATEST RESULT'}</p>
        <h2 id="result-title">A change becomes <em>a decision.</em></h2>
        <p>GreenRoom filters the noise and brings back the part that deserves your attention.</p>
        {currentItem && <button type="button" onClick={() => onNavigate('intelligence')}>See result</button>}
      </div>
      <article className={`result-preview is-${resultState}`}>
        {resultState === 'working' ? <div className="result-message"><span className="watch-pulse" /><strong>GreenRoom is watching</strong><p>Your Mind is deciding whether the latest changes matter to you. You can come back later.</p></div>
        : resultState === 'unsupported' ? <div className="result-message"><strong>GreenRoom can't watch this category live yet.</strong><p>AI video tools are supported now. More creator categories are coming.</p></div>
        : resultState === 'failed' ? <div className="result-message"><strong>This check didn't complete.</strong><p>No older result has been substituted. Try checking again when you're ready.</p><button type="button" onClick={onOpenOfflineModal}>Try again</button></div>
        : resultState === 'no-update' ? <div className="result-message"><strong>Nothing needs your attention right now.</strong><p>GreenRoom checked the current sources and found no relevant update.</p></div>
        : <><header><span>{isExample ? 'EXAMPLE' : 'CURRENT'}</span><h3>{result.title}</h3></header><dl>
          <div><dt>WHAT CHANGED</dt><dd>{clean(result.what_changed)}</dd></div>
          <div><dt>WHY IT MATTERS</dt><dd>{clean(result.why_it_matters)}</dd></div>
          <div><dt>WHAT TO DO NEXT</dt><dd>{clean(result.recommended_action)}</dd></div>
        </dl></>}
      </article>
    </section>
  </div>;
}

export default HomePage;
