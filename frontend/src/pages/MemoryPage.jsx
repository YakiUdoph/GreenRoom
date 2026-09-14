import React, { useState } from 'react';
import { getDisplayMemories } from '../lib/memoryPresentation';

export function MemoryPage({ memoryState, onSubmitFeedback, onOpenOnboarding, isExecuting }) {
  const [feedback, setFeedback] = useState(''); const [status, setStatus] = useState(null);
  const memories = getDisplayMemories(memoryState); const objective = memoryState?.creator_objectives?.[0];
  const profile = memoryState?.creator_profile || memoryState?.profile || {};
  const channelFacts = [profile.channel_name, profile.creator_type, profile.audience].filter(Boolean);
  const submit = async event => { event.preventDefault(); if (!feedback.trim()) return; setStatus('Saving…'); try { const result = await onSubmitFeedback(feedback.trim()); setFeedback(''); setStatus(result.created === false ? 'Already saved.' : 'Saved.'); } catch { setStatus('Could not save this preference.'); } };
  return <div className="creator-desk business-page">
    <header className="desk-heading"><p>YOUR BUSINESS</p><h1>The context behind better decisions.</h1><span>You can see and correct what GreenRoom carries forward.</span></header>
    <div className="business-grid">
      <section><div className="section-label"><p>Goal</p><span>Told by you</span></div><h2>{objective?.title || 'No goal has been added yet.'}</h2>{objective?.details && <p>{objective.details}</p>}</section>
      <section><div className="section-label"><p>Constraints & preferences</p><span>Told by you</span></div>{memories.length ? <ul>{memories.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p className="soft-empty">No constraints or preferences saved yet.</p>}</section>
      <section><div className="section-label"><p>Channel & audience</p><span>Told by you</span></div>{channelFacts.length ? <ul>{channelFacts.map(item => <li key={item}>{item}</li>)}</ul> : <p className="soft-empty">No channel details are available yet.</p>}<button className="text-button" onClick={onOpenOnboarding}>Edit your context</button></section>
      <section><div className="section-label"><p>Observed patterns</p><span>Observed from analytics</span></div><p className="soft-empty">No analytics observations are available in this experience yet.</p></section>
    </div>
    <form className="preference-form" onSubmit={submit}><div><label htmlFor="preference">Add a preference</label><span>Something GreenRoom should remember when weighing future decisions.</span></div><div><input id="preference" value={feedback} onChange={event => { setFeedback(event.target.value); setStatus(null); }} placeholder="For example: Prefer low-cost tools"/><button disabled={isExecuting || !feedback.trim()}>Remember</button></div>{status && <small role="status">{status}</small>}</form>
  </div>;
}
export default MemoryPage;
