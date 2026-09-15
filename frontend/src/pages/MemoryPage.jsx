import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { getDisplayMemories } from '../lib/memoryPresentation';

export function MemoryPage({ memoryState, onSubmitFeedback, onOpenOnboarding, isExecuting }) {
  const [feedback, setFeedback] = useState(''); const [status, setStatus] = useState(null);
  const memories = getDisplayMemories(memoryState); const objective = memoryState?.creator_objectives?.[0];
  const profile = memoryState?.creator_profile || memoryState?.profile || memoryState || {};
  const constraints = [objective?.details, ...(Array.isArray(profile.rejected_topics) ? profile.rejected_topics : [])].filter(Boolean);
  const preferences = [profile.preferred_tone, ...(Array.isArray(profile.content_wanted) ? profile.content_wanted : []), ...memories].filter(Boolean);
  const channelFacts = [profile.creator_name, profile.channel_name, profile.niche, profile.audience_description].filter(Boolean);
  const submit = async event => { event.preventDefault(); if (!feedback.trim()) return; setStatus('Saving…'); try { const result = await onSubmitFeedback(feedback.trim()); setFeedback(''); setStatus(result.created === false ? 'Already saved.' : 'Saved.'); } catch { setStatus('Could not save this preference.'); } };
  return <motion.div className="creator-desk business-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .45 }}>
    <header className="v2-brand-hero business-hero"><img src="/assets/greenroom-creator-night.png" alt="Creator at work in their studio"/><div className="v2-hero-copy"><p>YOUR BUSINESS</p><h1>What GreenRoom understands about your business.</h1><span>Your goals, boundaries, and preferences make every future decision more useful. You can see and correct what carries forward.</span></div></header>
    <div className="v2-image-ribbon"><img src="/assets/greenroom-away-workspace.png" alt="Creator workspace"/><span>Your context turns a signal into a decision that fits.</span></div>
    <div className="business-grid">
      <section><div className="section-label"><p>Goal</p><span>Told by you</span></div><h2>{objective?.title || 'No goal has been added yet.'}</h2>{objective?.details && <p>{objective.details}</p>}</section>
      <section><div className="section-label"><p>Your constraints</p><span>Told by you</span></div>{constraints.length ? <ul>{constraints.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p className="soft-empty">No constraints saved yet.</p>}</section>
      <section><div className="section-label"><p>Your preferences</p><span>Told by you</span></div>{preferences.length ? <ul>{preferences.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p className="soft-empty">No preferences saved yet.</p>}</section>
      <section><div className="section-label"><p>Channel & audience</p><span>Told by you</span></div>{channelFacts.length ? <ul>{channelFacts.map(item => <li key={item}>{item}</li>)}</ul> : <p className="soft-empty">No channel details are available yet.</p>}<button className="text-button" onClick={onOpenOnboarding}>Edit your context</button></section>
      <section><div className="section-label"><p>Observed patterns</p><span>Observed from analytics</span></div><p className="soft-empty">No analytics observations are available in this experience yet.</p></section>
    </div>
    <form className="preference-form" onSubmit={submit}><div><label htmlFor="preference">Add a preference</label><span>Something GreenRoom should remember when weighing future decisions.</span></div><div><input id="preference" value={feedback} onChange={event => { setFeedback(event.target.value); setStatus(null); }} placeholder="For example: Prefer low-cost tools"/><button disabled={isExecuting || !feedback.trim()}>Remember</button></div>{status && <small role="status">{status}</small>}</form>
  </motion.div>;
}
export default MemoryPage;
