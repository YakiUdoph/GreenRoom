import React, { useState } from 'react';
import { getDisplayMemories } from '../lib/memoryPresentation';

export function MemoryPage({ memoryState, onSubmitFeedback, onOpenOnboarding, isExecuting }) {
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const memories = getDisplayMemories(memoryState);
  const objective = memoryState?.creator_objectives?.[0];
  const submit = async (event) => {
    event.preventDefault();
    if (!feedback.trim() || submitting) return;
    const submitted = feedback;
    setSubmitting(true);
    setSaveStatus(null);
    try {
      const result = await onSubmitFeedback(submitted);
      setFeedback('');
      setSaveStatus({ type: 'success', message: result.created === false ? 'Already remembered.' : 'Preference remembered.' });
    } catch (error) {
      setSaveStatus({ type: 'error', message: error.message || 'Could not save this preference.' });
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="rich-route memory-route">
    <section className="route-visual-hero"><img src="/assets/greenroom-creator-night.png" alt="Creator at work"/><div className="route-visual-copy"><p>MY MEMORY</p><h1>What GreenRoom remembers about you.</h1><span>These preferences help Your Mind make future recommendations more personal.</span></div><div className="route-visual-meta"><span>Remembers {memories.length} preference{memories.length === 1 ? '' : 's'}</span><span>Your Mind ✓ Connected</span></div></section>
    <section className="density-shell">
      <div className="density-band is-three">
        <article><small>OBJECTIVE / 01</small><h2>{objective?.title || 'No objective is active.'}</h2><p>The outcome GreenRoom currently keeps in view.</p></article>
        <article><small>LEARNED PREFERENCES / 02</small><strong>{String(memories.length).padStart(2,'0')}</strong><p>{memories.length ? 'Human-readable preferences are active.' : 'No preferences saved yet.'}</p></article>
        <article><small>YOUR MIND / 03</small><h2>✓ Connected</h2><p>Relevant saved context can inform your next decision.</p></article>
      </div>
      <div className="route-image-ribbon"><img src="/assets/greenroom-away-workspace.png" alt="Creator workspace"/><span>Context is the input to better decisions</span></div>
      {memories.length ? <ul className="density-list memory-preference-list">{memories.map((memory, index) => <li key={index}><span>{String(index + 1).padStart(2,'0')}</span><p>{memory}</p></li>)}</ul> : <div className="density-empty">No learned Memory yet. Add a preference below or edit creator context.</div>}
      <form className="memory-teach" onSubmit={submit}><p>ADD A PREFERENCE</p><div className="memory-teach-field"><input value={feedback} onChange={event => { setFeedback(event.target.value); setSaveStatus(null); }} placeholder="e.g. Prefer free or low-cost tools." disabled={submitting}/>{saveStatus && <span className={`memory-save-status is-${saveStatus.type}`} role={saveStatus.type === 'error' ? 'alert' : 'status'}>{saveStatus.message}</span>}</div><button disabled={isExecuting || submitting || !feedback.trim()}>{submitting ? 'Remembering…' : 'Remember this'}</button></form>
      <div className="route-cta-row"><div><p>PROFILE FACTS</p><span>Edit the creator and audience context that persists between sessions.</span></div><button onClick={onOpenOnboarding}>Edit creator context</button></div>
    </section>
  </div>;
}

export default MemoryPage;
