import React, { useMemo, useState } from 'react';
import { GreenroomCore } from '../components/mind/GreenroomCore';
import { getDisplayMemories } from '../lib/memoryPresentation';

const clean = (v = '') => String(v).replace(/ScoutMind detected/i, 'GreenRoom found').replaceAll('_', ' ');

const processSteps = [
  ['01', 'Give GreenRoom a goal', "Tell it what you're trying to improve."],
  ['02', 'Your Mind remembers you', 'Your preferences and previous decisions carry forward.'],
  ['03', 'GreenRoom keeps watch', 'It checks real sources for useful changes.'],
  ['04', 'Get a decision', 'Not a pile of links. GreenRoom tells you what changed, why it matters to you, and what to do next.']
];

const LIVE_OBJECTIVE = 'Help me find better tools for making my videos';

export function HomePage({ memoryState, onNavigate, onOpenOfflineModal, onCreateObjective, isExecuting }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');

  const objective = memoryState?.creator_objectives?.[0];
  const briefing = memoryState?.latest_briefing;
  const items = Array.isArray(briefing?.items) ? briefing.items.slice(0, 3) : [];
  const memories = useMemo(() => getDisplayMemories(memoryState).slice(0, 3), [memoryState]);
  const runStatus = memoryState?.latest_offline_run?.status;

  const rawState = runStatus === 'FAILED'
    ? 'RUN FAILED'
    : runStatus === 'NO_RELEVANT_UPDATE'
    ? 'NO RELEVANT UPDATE'
    : runStatus === 'UNSUPPORTED_DOMAIN'
    ? 'NO LIVE PROVIDER'
    : ['QUEUED', 'RUNNING', 'WORKING', 'SUBMITTING', 'WAITING_FOR_MINDS'].includes(runStatus) || objective?.status === 'RUNNING'
    ? 'WORKING'
    : items.length
    ? 'RESULT READY'
    : objective
    ? 'READY'
    : 'NO OBJECTIVE';

  const save = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onCreateObjective(title.trim(), details.trim());
    setEditing(false);
    setTitle('');
    setDetails('');
  };

  return (
    <div className="manus-home">
      <section className="new-hero">
        <div className="hero-intro">
          <p className="hero-overline">GREENROOM</p>
          <h1>GreenRoom keeps watch <em>while you create.</em></h1>
          <p>
            Tell it what you're working toward. Your Mind remembers what matters to you, watches for useful changes, and tells you what deserves your attention.
          </p>
          <div className="hero-actions">
            <button className="hero-primary" onClick={() => setEditing(true)}>
              {objective ? 'Change goal' : 'Tell GreenRoom your goal'} ↗
            </button>
            <button className="hero-secondary" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
              See how it works ↘
            </button>
          </div>
          <div className="live-coverage-note">
            <strong>FIRST LIVE CATEGORY</strong>
            <span>AI video tools &amp; workflow</span>
            <small>Adobe Blog is the current live provider. More creator categories can be connected over time.</small>
          </div>

          <div className="home-status-ribbon">
            <div>
              <span>Objective</span>
              <strong>{objective ? 'HELD' : 'WAITING'}</strong>
              <p>{objective?.title || 'Set the outcome GreenRoom should keep in view.'}</p>
            </div>
            <div>
              <span>Status</span>
              <strong>{rawState}</strong>
              <p>
                {rawState === 'WORKING'
                  ? "Your Mind is thinking. You can leave this screen—we'll keep working."
                  : rawState === 'RUN FAILED'
                  ? 'This run did not complete. No stale result has replaced it.'
                  : rawState === 'NO LIVE PROVIDER'
                  ? 'GreenRoom does not have a live source connected for this category yet. Try an AI-video goal.'
                  : rawState === 'NO RELEVANT UPDATE'
                  ? 'No current evidence passed the live filters.'
                  : rawState === 'RESULT READY'
                  ? 'A completed, persisted briefing is ready.'
                  : 'GreenRoom is ready when you are.'}
              </p>
            </div>
            <div>
              <span>Your Mind</span>
              <strong>✓ Connected</strong>
              <p>
                {memories.length
                  ? `Remembers ${memories.length} preference${memories.length > 1 ? 's' : ''}. Last learned: "${clean(memories[0])}".`
                  : 'No creator preferences saved yet.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {editing && (
        <section className="objective-editor">
          <form onSubmit={save}>
            <p>SET THE THREAD</p>
            <aside>
              <strong>LIVE NOW</strong>
              <span>AI video tools and workflow objectives</span>
              <small>
                Other creator categories can be saved, but will report NO LIVE PROVIDER until a verified source is connected.
              </small>
              <button type="button" onClick={() => setTitle('Keep me updated on useful AI video tools that could improve my workflow.')}>
                Use supported objective
              </button>
            </aside>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Help me find better tools for making my videos"
              autoFocus
              required
            />
            <input
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Constraints (e.g. prefer free or low-cost tools)"
            />
            <div>
              <button type="button" onClick={() => setEditing(false)}>Cancel</button>
              <button disabled={isExecuting}>Save objective</button>
            </div>
          </form>
        </section>
      )}

      <section className="story-section remember-story" id="how-it-works">
        <div className="story-heading">
          <p>01 — REMEMBER</p>
          <h2>Context that <em>stays.</em></h2>
          <p className="section-support">
            GreenRoom keeps the useful parts of your context close to the next decision.
          </p>
        </div>
        <div className="memory-composition">
          <div className="memory-photo-frame">
            <img src="/assets/greenroom-creator-night.png" alt="Creator at work" />
            <img src="/assets/greenroom-living-network.png" alt="" />
            <span>CREATOR CONTEXT</span>
          </div>
          <div className="memory-fact">
            <p>CURRENT OBJECTIVE</p>
            <strong>{objective?.title || 'Set the work you want GreenRoom to keep in view.'}</strong>
            <button onClick={() => setEditing(true)}>
              {objective ? 'Edit objective' : 'Set an objective'} ↗
            </button>
          </div>
          <div className="memory-index">{String(memories.length).padStart(2, '0')} MEMORIES AVAILABLE</div>
        </div>
        <aside className="remembered-context">
          <div className="context-head">
            <span>REMEMBERED CONTEXT</span>
            <button onClick={() => onNavigate('memory')}>VIEW FULL MEMORY ↗</button>
          </div>
          {memories.length ? (
            <ul>
              {memories.map((m, i) => (
                <li key={i}>
                  <span>0{i + 1}</span>
                  <p>{clean(m)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="capability-grid">
              <article>
                <span>CREATOR PREFERENCES</span>
                <p>How you prefer to work and decide.</p>
              </article>
              <article>
                <span>ACTIVE OBJECTIVES</span>
                <p>The outcomes GreenRoom should keep in view.</p>
              </article>
              <article>
                <span>LEARNED RULES</span>
                <p>Repeated instructions that become useful context.</p>
              </article>
              <article>
                <span>USEFUL HISTORY</span>
                <p>Prior context that makes a later return clearer.</p>
              </article>
            </div>
          )}
        </aside>
      </section>

      <section className="process-story">
        <div className="process-heading">
          <p>HOW GREENROOM WORKS</p>
          <h2>One thread through the work.</h2>
        </div>
        <div className="process-strip">
          {processSteps.map((x) => (
            <article key={x[1]}>
              <span>{x[0]}</span>
              <h3>{x[1]}</h3>
              <p>{x[2]}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="story-section work-story">
        <div className="work-visual">
          <img src="/assets/greenroom-living-network.png" alt="" />
          <GreenroomCore stateName={rawState} />
          <div className="work-caption">
            <span>LIVE DECISION CORE</span>
            <strong>{rawState}</strong>
          </div>
        </div>
        <div className="story-heading work-copy">
          <p>02 — WORK</p>
          <h2>Present even when <em>you are not.</em></h2>
          <p>
            For supported objectives, GreenRoom checks first-party evidence, applies relevant Memory, and holds the result until you return.
          </p>
          <button className="inline-edit" disabled={!objective || isExecuting} onClick={onOpenOfflineModal}>
            Start live intelligence ↗
          </button>
        </div>
      </section>

      <section className="return-story">
        <div className="return-intro">
          <p>03 — RETURN</p>
          <h2>You were away.<br /><em>GreenRoom found this.</em></h2>
        </div>
        {items.length ? (
          <div className="ranked-return">
            {items.map((item, i) => (
              <article className={i === 0 ? 'is-first' : ''} key={item.id || item.title}>
                <span>0{i + 1}</span>
                <div>
                  <p>{item.category || item.priority || 'OPPORTUNITY'}</p>
                  <h3>{item.title}</h3>
                  <dl>
                    <div>
                      <dt>WHAT CHANGED</dt>
                      <dd>{clean(item.what_changed || item.summary || 'No verified change was supplied.')}</dd>
                    </div>
                    <div>
                      <dt>WHY IT MATTERS</dt>
                      <dd>{clean(item.why_it_matters || 'Relevance supplied by the completed briefing.')}</dd>
                    </div>
                    <div>
                      <dt>WHAT TO DO NEXT</dt>
                      <dd>{item.recommended_action || 'Review this opportunity.'}</dd>
                    </div>
                    {item.source_url && (
                      <div>
                        <dt>SOURCE</dt>
                        <dd>
                          <a
                            href={item.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#10b981', textDecoration: 'underline' }}
                          >
                            {item.source} ({new Date(item.published_at).toLocaleDateString()})
                          </a>
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </article>
            ))}
          </div>
        ) : runStatus === 'WAITING_FOR_MINDS' && memoryState?.latest_offline_run?.evidence_snapshot ? (
          <div className="ranked-return">
            <article className="is-first">
              <span>01</span>
              <div>
                <p>YOUR MIND IS THINKING · RUN PENDING</p>
                <h3>{memoryState.latest_offline_run.evidence_snapshot.title}</h3>
                <dl>
                  <div>
                    <dt>STATUS</dt>
                    <dd style={{ color: '#fbbf24' }}>
                      GreenRoom found something relevant. Your Mind is working out whether it matters to you. You can leave and come back—we'll keep working.
                    </dd>
                  </div>
                  <div>
                    <dt>SOURCE</dt>
                    <dd>
                      <a
                        href={memoryState.latest_offline_run.evidence_snapshot.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#10b981', textDecoration: 'underline' }}
                      >
                        {memoryState.latest_offline_run.evidence_snapshot.source} ({new Date(memoryState.latest_offline_run.evidence_snapshot.published_at).toLocaleDateString()})
                      </a>
                    </dd>
                  </div>
                </dl>
              </div>
            </article>
          </div>
        ) : runStatus === 'FAILED' && memoryState?.latest_offline_run?.error === 'Minds personalized interpretation is temporarily unavailable.' && memoryState?.latest_offline_run?.evidence_snapshot ? (
          <div className="ranked-return">
            <article className="is-first">
              <span>01</span>
              <div>
                <p>MINDS LATENT · INTERPRETATION DELAYED</p>
                <h3>{memoryState.latest_offline_run.evidence_snapshot.title}</h3>
                <dl>
                  <div>
                    <dt>WHY IT MATTERS</dt>
                    <dd style={{ color: '#ef4444' }}>Minds personalized interpretation is temporarily unavailable.</dd>
                  </div>
                  <div>
                    <dt>WHAT TO DO NEXT</dt>
                    <dd>Review the verified update directly.</dd>
                  </div>
                  <div>
                    <dt>SOURCE</dt>
                    <dd>
                      <a
                        href={memoryState.latest_offline_run.evidence_snapshot.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#10b981', textDecoration: 'underline' }}
                      >
                        {memoryState.latest_offline_run.evidence_snapshot.source} ({new Date(memoryState.latest_offline_run.evidence_snapshot.published_at).toLocaleDateString()})
                      </a>
                    </dd>
                  </div>
                </dl>
              </div>
            </article>
          </div>
        ) : runStatus === 'UNSUPPORTED_DOMAIN' ? (
          <div className="ranked-return">
            <article className="is-first">
              <span>01</span>
              <div>
                <p>CATEGORY NOT SUPPORTED LIVE YET</p>
                <h3>{objective?.title}</h3>
                <dl>
                  <div>
                    <dt>STATUS</dt>
                    <dd style={{ color: '#ef4444' }}>
                      We can't watch this category live yet. AI video tools are the first category GreenRoom can currently watch. More creator categories are coming soon.
                    </dd>
                  </div>
                  <div>
                    <dt>SUGGESTION</dt>
                    <dd>
                      <button
                        onClick={() => {
                          onCreateObjective('Keep me updated on useful AI video tools that could improve my workflow.');
                          setTimeout(() => window.location.reload(), 300);
                        }}
                        style={{ color: '#10b981', textDecoration: 'underline', background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}
                      >
                        Try an AI-video goal
                      </button>
                    </dd>
                  </div>
                </dl>
              </div>
            </article>
          </div>
        ) : (
          <div className="return-empty">
            <img src="/assets/greenroom-away-workspace.png" alt="Empty workspace" />
            <div>
              <p>NO BRIEFING HAS RETURNED YET.</p>
              <span>Set an objective, then let GreenRoom work while you are away. Results appear only after a completed run.</span>
            </div>
          </div>
        )}
      </section>

      <section className="closing-story">
        <div>
          <p>GREENROOM REMEMBERS</p>
          <h2>Feedback makes the <em>next cycle specific.</em></h2>
        </div>
        <div className="closing-links">
          {objective && <button disabled={isExecuting} onClick={onOpenOfflineModal}>Start live intelligence ↗</button>}
          <button onClick={() => setEditing(true)}>Set an objective ↗</button>
          <button onClick={() => onNavigate('memory')}>View Memory ↗</button>
          <button onClick={() => onNavigate('intelligence')}>Open Results ↗</button>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
