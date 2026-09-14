import React, { useEffect, useMemo, useState } from 'react';
import { cleanDecisionText } from '../lib/decisionText';
import { currentHomeResult, homeResultState } from '../lib/homeResult';

export const supportedExamples = [
  ['YouTube changes', 'Tell me when YouTube changes something that could affect my channel.'],
  ['AI video tools', 'Watch for meaningful AI video-tool updates.'],
  ['Twitch opportunities', 'Watch for Twitch creator earning or sponsorship opportunities.'],
];
export const populateSupportedExample = (setGoal, example) => setGoal(example);
const steps = [
  ['01', '◎', 'Tell us your goal', "Share what you're working toward and what matters to you."],
  ['02', '◉', 'Your Mind remembers', 'Your preferences and past decisions carry forward.'],
  ['03', '✦', 'Get useful decisions', 'When something relevant changes, GreenRoom tells you what changed, why it matters, and what to do next.'],
];
const clean = (value = '') => cleanDecisionText(String(value).replaceAll('_', ' '));

export function HomePage({ memoryState, onNavigate, onOpenOfflineModal, onCreateObjective, isExecuting }) {
  const objective = memoryState?.creator_objectives?.[0];
  const run = memoryState?.latest_offline_run;
  const briefing = memoryState?.latest_briefing;
  const runStatus = run?.status;
  const currentItem = currentHomeResult(run, briefing);
  const [goal, setGoal] = useState(objective?.title || '');

  useEffect(() => {
    setGoal(objective?.title || '');
  }, [objective?.title]);

  const resultState = useMemo(() => homeResultState(run, briefing), [run, briefing]);

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
        <p className="hero-overline">FOR INDEPENDENT CREATORS</p>
        <h1 id="home-title">You create.<br />GreenRoom<br /><em>keeps watch.</em></h1>
        <p>GreenRoom remembers what matters to you and checks supported creator sources when you ask. Your persistent Mind uses what GreenRoom remembers about you to decide whether verified evidence deserves your attention.</p>
        <form className="goal-form" onSubmit={submitGoal}>
          <label htmlFor="watch-goal">What should GreenRoom keep watch on?</label>
          <div className="goal-entry">
            <input id="watch-goal" value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="e.g. Find better tools for making my videos" autoFocus={Boolean(objective)} required />
            <button type="submit" disabled={isExecuting || !goal.trim()}>Keep watch <span aria-hidden="true">→</span></button>
          </div>
        </form>
        <div className="supported-examples" aria-label="Supported objective examples">{supportedExamples.map(([label, example]) => <button type="button" key={label} onClick={() => populateSupportedExample(setGoal, example)}>{label}</button>)}</div>
        <p className="coverage-note"><span aria-hidden="true">✓</span><span><strong>User-triggered checks currently support AI-video tools, selected YouTube platform changes, and selected Twitch creator opportunities.</strong><small>Checks official Adobe, YouTube, and Twitch sources.</small></span></p>
      </div>
      <aside className="hero-result-toast" aria-label="Current product status">
        <span>CURRENT STATUS</span>
        <strong>{resultState === 'working' ? 'CHECKING LIVE SOURCES' : resultState === 'result' ? 'DECISION READY' : resultState === 'failed' ? 'CHECK FAILED' : resultState === 'no-update' ? 'NOTHING NEEDS ATTENTION' : resultState === 'unsupported' ? 'NO LIVE COVERAGE' : 'READY TO WATCH'}</strong>
        <p>{resultState === 'working' ? 'GreenRoom is checking supported first-party sources.' : resultState === 'result' ? 'A verified result is ready to review.' : resultState === 'failed' ? 'No result was created or substituted.' : resultState === 'no-update' ? 'The latest check found no relevant fresh evidence.' : resultState === 'unsupported' ? 'Choose one of the supported examples to run a live check.' : 'Start with a supported goal above.'}</p>
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
        <header className="result-preview__heading"><span>{currentItem ? 'LATEST RESULT' : 'YOUR RESULTS'}</span><h2 id="result-title">A change becomes <em>a decision.</em></h2></header>
        {resultState === 'working' ? <div className="result-message"><span className="watch-pulse" /><strong>GreenRoom is watching</strong><p>Your Mind is deciding whether the latest changes matter to you. You can come back later.</p></div>
        : resultState === 'unsupported' ? <div className="result-message"><strong>GreenRoom can't watch this category live yet.</strong><p>Try AI-video tools, selected YouTube platform changes, or selected Twitch creator opportunities.</p></div>
        : resultState === 'failed' ? <div className="result-message"><strong>This check didn't complete.</strong><p>No older result has been substituted. Try checking again when you're ready.</p><button type="button" onClick={onOpenOfflineModal}>Try again</button></div>
        : resultState === 'no-update' ? <div className="result-message"><strong>Nothing needs your attention right now.</strong><p>GreenRoom checked the current sources and found no relevant update.</p></div>
        : resultState === 'empty' ? <div className="result-message"><strong>Nothing to review yet.</strong><p>Tell GreenRoom what matters to you and run your first live check. No recommendation appears until a genuine run completes.</p></div>
        : <><dl>
          <div><span className="result-icon" aria-hidden="true">↗</span><div><dt>WHAT CHANGED</dt><dd>{clean(currentItem.what_changed)}</dd></div></div>
          <div><span className="result-icon" aria-hidden="true">◇</span><div><dt>WHY IT MATTERS TO YOU</dt><dd>{clean(currentItem.why_it_matters)}</dd></div></div>
          <div><span className="result-icon" aria-hidden="true">✓</span><div><dt>WHAT TO DO NEXT</dt><dd>{clean(currentItem.recommended_action)}</dd></div></div>
        </dl><footer><span aria-hidden="true">◇</span> Based on verified first-party sources · Decision by verified persistent Mind: Udophia</footer><button type="button" onClick={() => onNavigate('intelligence')}>See full result</button></>}
      </article>
    </section>
  </div>;
}

export default HomePage;
