import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { GreenroomCore } from '../components/mind/GreenroomCore';
import { soundFx } from '../lib/sound';

const reveal = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.58, ease: [0.16, 1, 0.3, 1] },
};

const humanizeHomeCopy = (value = '') => String(value)
  .replace(/ScoutMind detected/i, 'Greenroom found')
  .replace(/Grounding:\s*Persisted rule applied\s*[—-]\s*/i, 'Based on your preference for ')
  .replace(/Creator prefers opportunities matching item ['"]?[^'"]+['"]?/i, 'Prefers opportunities that match previous approvals')
  .replace(/Creator rejected opportunity format in item ['"]?[^'"]+['"]?/i, 'Avoid formats the creator has rejected');

const humanizeSource = (value = '') => {
  const source = String(value);
  if (/profile|memory|retention|node|brand_voice/i.test(source)) return 'Creator memory and saved performance preferences';
  return humanizeHomeCopy(source).replaceAll('_', ' ');
};

export function HomePage({
  memoryState,
  mindsStatus,
  onNavigate,
  onRunFullDemo,
  onOpenOfflineModal,
  onCreateObjective,
  onRunObjective,
  isExecuting,
}) {
  const [isEditingObjective, setIsEditingObjective] = useState(false);
  const [objectiveTitle, setObjectiveTitle] = useState('');
  const [objectiveDetails, setObjectiveDetails] = useState('');

  const creatorName = memoryState?.creator_name || 'Creator';
  const objective = memoryState?.creator_objectives?.[0] || null;
  const objectiveStatus = objective?.status || 'CREATED';
  const briefing = memoryState?.latest_briefing || null;
  const rankedItems = Array.isArray(briefing?.items) ? briefing.items.slice(0, 3) : [];
  const provenance = briefing?.provenance || {};
  const mindState = objectiveStatus === 'RUNNING' ? 'COLLABORATING' : (rankedItems.length > 0 ? 'RETURNED' : 'IDLE');

  const memories = useMemo(() => {
    const rules = Array.isArray(memoryState?.learned_voice_rules) ? memoryState.learned_voice_rules : [];
    const nodes = Array.isArray(memoryState?.memory_nodes) ? memoryState.memory_nodes : [];
    const nodeText = nodes.map((node) => node?.content || node?.memory || node?.text || node?.summary).filter(Boolean);
    return [...new Set([...rules, ...nodeText].map(humanizeHomeCopy))].slice(0, 5);
  }, [memoryState]);

  const runBackgroundWork = () => {
    soundFx.playSynapsePulse();
    if (onOpenOfflineModal) onOpenOfflineModal();
  };

  const saveObjective = async (event) => {
    event.preventDefault();
    if (!objectiveTitle.trim() || !onCreateObjective) return;
    await onCreateObjective(objectiveTitle.trim(), objectiveDetails.trim());
    setObjectiveTitle('');
    setObjectiveDetails('');
    setIsEditingObjective(false);
  };

  const runObjectiveAgain = () => {
    soundFx.playSynapsePulse();
    if (objective && onRunObjective) onRunObjective(objective.id);
    else if (onRunFullDemo) onRunFullDemo();
  };

  const editObjective = () => {
    setIsEditingObjective(true);
    window.requestAnimationFrame(() => {
      document.querySelector('#home-hero .home-objective')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  const proofRows = [
    ['Mind identity', provenance.mind_id || mindsStatus?.mind_id || 'Not verified by a completed run'],
    ['Lifecycle', provenance.status || objectiveStatus],
    ['Background execution', provenance.execution_mode || 'QStash status appears after a run'],
    ['Persistence', provenance.persistence_mode || briefing?.persistence_mode || 'Not reported'],
    ['Provenance', provenance.run_id || briefing?.run_id || 'No completed run'],
    ['Signal mode', provenance.signal_mode || briefing?.signal_source_label || 'Not reported'],
    ['Verification', provenance.mind_verified === true ? 'Verified' : 'Not verified'],
  ];

  return (
    <div className="home-calm flex-1 min-w-0 max-w-container-max mx-auto px-4 sm:px-6 md:px-10 pb-20 pt-4 text-white">
      <motion.section {...reveal} id="home-hero" className="home-calm__hero">
        <div className="home-calm__hero-copy">
          <span className="oryzo-label">GREENROOM · {creatorName}</span>
          <h1>Greenroom remembers.<br />It keeps working.<br />It returns ranked opportunities.</h1>
          <p className="home-calm__statement">It learns how you work, keeps watch between sessions, and brings back what matters.</p>

          <div className="home-objective">
            <span className="oryzo-label">CURRENT OBJECTIVE</span>
            {!isEditingObjective ? (
              <div className="home-objective__read">
                <strong>{objective?.title || 'Set the outcome Greenroom should work toward.'}</strong>
                <button type="button" onClick={editObjective}>{objective ? 'Edit' : 'Set objective'}</button>
              </div>
            ) : (
              <form onSubmit={saveObjective} className="home-objective__form">
                <label>
                  <span>Objective</span>
                  <input value={objectiveTitle} onChange={(event) => setObjectiveTitle(event.target.value)} placeholder="What should Greenroom accomplish?" autoFocus required />
                </label>
                <label>
                  <span>Useful context</span>
                  <input value={objectiveDetails} onChange={(event) => setObjectiveDetails(event.target.value)} placeholder="Constraints, timing, or target" />
                </label>
                <div><button type="button" onClick={() => setIsEditingObjective(false)}>Cancel</button><button type="submit" disabled={isExecuting}>Save objective</button></div>
              </form>
            )}
          </div>

          <div className="home-calm__actions">
            <button type="button" className="home-primary-action" onClick={runBackgroundWork} disabled={isExecuting}>Work while I’m away</button>
            <button type="button" className="home-text-action" onClick={() => onNavigate('memory')}>View memory</button>
          </div>
        </div>
        <GreenroomCore stateName={mindState} subtitle={rankedItems.length > 0 ? 'Completed work is ranked and ready.' : 'Remembering your objective while watching for useful changes.'} />
      </motion.section>

      <motion.section {...reveal} id="home-results" className="home-calm__section">
        <header className="home-calm__section-heading"><span>01</span><div><p>While You Were Away</p><h2>{rankedItems.length > 0 ? 'The strongest opportunities, in order.' : 'Your ranked briefing will land here.'}</h2></div></header>
        {rankedItems.length > 0 ? (
          <div className="ranked-briefing">
            <article className="ranked-feature">
              <div className="ranked-number">#1</div>
              <div>
                <span className="oryzo-label">{rankedItems[0].category || rankedItems[0].priority || 'TOP OPPORTUNITY'}</span>
                <h3>{rankedItems[0].title}</h3>
                <dl>
                  <div><dt>What happened</dt><dd>{humanizeHomeCopy(rankedItems[0].what_changed || 'No change summary supplied.')}</dd></div>
                  <div><dt>Why it matters</dt><dd>{humanizeHomeCopy(rankedItems[0].why_it_matters || 'No relevance summary supplied.')}</dd></div>
                  <div><dt>Recommended action</dt><dd>{rankedItems[0].recommended_action || 'Review this opportunity.'}</dd></div>
                  <div><dt>Source</dt><dd>{humanizeSource(rankedItems[0].memory_context_used || provenance.signal_source || 'Completed Greenroom run')}</dd></div>
                </dl>
              </div>
            </article>
            <div className="ranked-secondary">
              {rankedItems.slice(1).map((item, index) => (
                <article key={item.id || item.title}>
                  <span>#{index + 2}</span><div><p>{item.category || item.priority}</p><h3>{item.title}</h3><button type="button" onClick={() => onNavigate('actions')}>Review action</button></div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="home-empty"><p>No completed briefing yet.</p><span>Set an objective, then let Greenroom run in the background. Results appear only after persistence completes.</span></div>
        )}
        {rankedItems.length > 0 && <button type="button" className="home-text-action self-start" onClick={() => onNavigate('actions')}>Open all actions</button>}
      </motion.section>

      <motion.section {...reveal} id="home-memory" className="home-calm__section home-memory-summary">
        <header className="home-calm__section-heading"><span>02</span><div><p>Greenroom remembers</p><h2>The few rules shaping every result.</h2></div></header>
        {memories.length > 0 ? <ol>{memories.map((memory, index) => <li key={`${memory}-${index}`}><span>0{index + 1}</span><p>{memory}</p></li>)}</ol> : <div className="home-empty"><p>No learned rules yet.</p><span>Feedback and decisions will become durable creator memory.</span></div>}
        <button type="button" className="home-text-action self-start" onClick={() => onNavigate('memory')}>View full memory</button>
      </motion.section>

      <motion.section {...reveal} id="home-proof" className="home-calm__section">
        <details className="home-proof">
          <summary><span><small>03</small><span><b>How Greenroom worked</b><em>Technical proof and provenance</em></span></span><strong>Inspect</strong></summary>
          <div className="home-proof__content">
            <dl>{proofRows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{String(value)}</dd></div>)}</dl>
            <nav aria-label="Technical detail routes">
              <button type="button" onClick={() => onNavigate('mind')}>Mind identity</button>
              <button type="button" onClick={() => onNavigate('intelligence')}>Signals</button>
              <button type="button" onClick={() => onNavigate('system')}>System proof</button>
              <button type="button" onClick={() => onNavigate('docs')}>Architecture</button>
            </nav>
          </div>
        </details>
      </motion.section>

      <motion.section {...reveal} id="home-next-action" className="home-final-action">
        <div><span className="oryzo-label">NEXT</span><h2>{objective ? 'Run the objective again with everything Greenroom now remembers.' : 'Give Greenroom its first objective.'}</h2></div>
        <div>{objective && <button type="button" className="home-primary-action" onClick={runObjectiveAgain} disabled={isExecuting}>{isExecuting ? 'Working…' : 'Run again'}</button>}<button type="button" className="home-text-action" onClick={editObjective}>{objective ? 'Change objective' : 'Set objective'}</button></div>
      </motion.section>
    </div>
  );
}

export default HomePage;
