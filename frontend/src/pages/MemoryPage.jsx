import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { getDisplayMemories } from '../lib/memoryPresentation';

const signalCopy = signal => {
  if (signal.data_sufficiency !== 'SUFFICIENT') return null;
  if (signal.type === 'VIEW_MOMENTUM') return `Views are broadly ${signal.direction === 'STABLE' ? 'stable' : signal.direction.toLowerCase()} across the two most recent comparable 14-day periods.`;
  if (signal.type === 'WATCH_TIME_MOMENTUM') return `Watch time is ${signal.direction.toLowerCase()} across the two most recent comparable 14-day periods.`;
  if (signal.type === 'AVD_MOMENTUM') return `View-weighted average view duration is ${signal.direction.toLowerCase()} across the two most recent comparable 14-day periods.`;
  if (signal.type === 'VIDEO_CTR_VARIATION') return 'Thumbnail click-through rate varies across comparable videos; this is not a time trend.';
  if (signal.type === 'VIDEO_IMPRESSION_VARIATION') return 'Thumbnail impressions vary across comparable videos; this is not a time trend.';
  return null;
};

export function MemoryPage({ memoryState, onSubmitFeedback, onOpenOnboarding, onImportAnalytics, isExecuting }) {
  const [feedback, setFeedback] = useState(''); const [status, setStatus] = useState(null);
  const [contentFile, setContentFile] = useState(null); const [dateFile, setDateFile] = useState(null); const [importStatus, setImportStatus] = useState(null);
  const memories = getDisplayMemories(memoryState); const objective = memoryState?.creator_objectives?.[0];
  const profile = memoryState?.creator_profile || memoryState?.profile || memoryState || {};
  const constraints = [objective?.details, ...(Array.isArray(profile.rejected_topics) ? profile.rejected_topics : [])].filter(Boolean);
  const preferences = [profile.preferred_tone, ...(Array.isArray(profile.content_wanted) ? profile.content_wanted : []), ...memories].filter(Boolean);
  const channelFacts = [profile.creator_name, profile.channel_name, profile.niche, profile.audience_description].filter(Boolean);
  const analytics = memoryState?.v2_analytics;
  const observations = (analytics?.signals || []).map(signalCopy).filter(Boolean);
  const submit = async event => { event.preventDefault(); if (!feedback.trim()) return; setStatus('Saving…'); try { const result = await onSubmitFeedback(feedback.trim()); setFeedback(''); setStatus(result.created === false ? 'Already saved.' : 'Saved.'); } catch { setStatus('Could not save this preference.'); } };
  return <motion.div className="creator-desk business-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .45 }}>
    <header className="v2-brand-hero business-hero"><img src="/assets/greenroom-creator-night.png" alt="Creator at work in their studio"/><div className="v2-hero-copy"><p>YOUR BUSINESS</p><h1>What GreenRoom understands about your business.</h1><span>Your goals, boundaries, and preferences make every future decision more useful. You can see and correct what carries forward.</span></div></header>
    <div className="v2-image-ribbon"><img src="/assets/greenroom-away-workspace.png" alt="Creator workspace"/><span>Your context turns a signal into a decision that fits.</span></div>
    <section className="analytics-import"><div><p className="section-kicker">YOUR CHANNEL DATA</p><h2>Bring in your YouTube Studio analytics.</h2><span>GreenRoom currently supports exported YouTube Studio CSV data: one Content report and one Date report. Raw CSV stays private and is never sent to Udophia.</span></div><form onSubmit={async event => { event.preventDefault(); if (!contentFile || !dateFile) return; setImportStatus('Importing…'); try { await onImportAnalytics(contentFile, dateFile); setImportStatus('Imported'); } catch (error) { setImportStatus(error.message || 'Import failed'); } }}><label>Content report CSV<input type="file" accept=".csv,text/csv" onChange={event => setContentFile(event.target.files?.[0] || null)} required/></label><label>Date report CSV<input type="file" accept=".csv,text/csv" onChange={event => setDateFile(event.target.files?.[0] || null)} required/></label><button disabled={isExecuting || !contentFile || !dateFile}>Import YouTube analytics</button>{importStatus && <small role="status">{importStatus}</small>}</form>{analytics && <div className="analytics-summary"><strong>Imported</strong><span>Last imported: {new Date(analytics.imported_at).toLocaleString()}</span>{analytics.reports?.map(report => <span key={report.report_type}>{report.report_type} · {report.row_count} rows recognized</span>)}</div>}</section>
    <div className="business-grid">
      <section><div className="section-label"><p>Goal</p><span>Told by you</span></div><h2>{objective?.title || 'No goal has been added yet.'}</h2>{objective?.details && <p>{objective.details}</p>}</section>
      <section><div className="section-label"><p>Your constraints</p><span>Told by you</span></div>{constraints.length ? <ul>{constraints.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p className="soft-empty">No constraints saved yet.</p>}</section>
      <section><div className="section-label"><p>Your preferences</p><span>Told by you</span></div>{preferences.length ? <ul>{preferences.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p className="soft-empty">No preferences saved yet.</p>}</section>
      <section><div className="section-label"><p>Channel & audience</p><span>Told by you</span></div>{channelFacts.length ? <ul>{channelFacts.map(item => <li key={item}>{item}</li>)}</ul> : <p className="soft-empty">No channel details are available yet.</p>}<button className="text-button" onClick={onOpenOnboarding}>Edit your context</button></section>
      <section><div className="section-label"><p>What GreenRoom has observed</p><span>Observed from analytics</span></div>{observations.length ? <ul>{observations.map(item => <li key={item}>{item}</li>)}</ul> : <p className="soft-empty">{analytics ? 'Not enough comparable data yet.' : 'No analytics observations are available in this experience yet.'}</p>}</section>
    </div>
    <form className="preference-form" onSubmit={submit}><div><label htmlFor="preference">Add a preference</label><span>Something GreenRoom should remember when weighing future decisions.</span></div><div><input id="preference" value={feedback} onChange={event => { setFeedback(event.target.value); setStatus(null); }} placeholder="For example: Prefer low-cost tools"/><button disabled={isExecuting || !feedback.trim()}>Remember</button></div>{status && <small role="status">{status}</small>}</form>
  </motion.div>;
}
export default MemoryPage;
