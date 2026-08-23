import React, { useMemo, useState } from 'react';

const sections = [
  ['overview', '01. OVERVIEW'], ['how', '02. HOW IT WORKS'], ['onboarding', '03. CREATOR CONTEXT'],
  ['mind', '04. THE MIND'], ['memory', '05. MEMORY'], ['background', '06. BACKGROUND WORK'],
  ['briefing', '07. DECISION BRIEFING'], ['truth', '08. EVIDENCE & LIMITS'], ['faq', '09. FAQ'],
];

const lifecycle = [
  ['01 — OBJECTIVE', 'The creator defines the outcome GreenRoom should keep in view.'],
  ['02 — RELEVANT MEMORY', 'GreenRoom selects useful preferences, constraints, and prior decisions.'],
  ['03 — BACKGROUND WORK', 'The run continues without trapping the creator on a loading screen.'],
  ['04 — INTELLIGENCE', 'A completed return explains what changed, why it matters, and what to do next.'],
  ['05 — FEEDBACK', 'Creator feedback becomes context for later decisions without rewriting old results.'],
];

const faqs = [
  ['What is GreenRoom?', 'Persistent decision intelligence for solo creators. It remembers creator context, keeps an objective active, and returns concise decision briefings.'],
  ['How is it different from a normal chatbot?', 'GreenRoom is organized around durable context, immutable objective-bound runs, and feedback across sessions—not a single conversation.'],
  ['Does work continue after I leave?', 'When background execution is configured, the run persists independently of the open interface. The UI reports working, result ready, or run failed without inventing progress.'],
  ['Which platform Mind is verified?', 'Udophia at udophia@hellominds.ai, UUID 8208493e-f36b-1410-8466-00039ce7df11, is the only verified platform Mind.'],
  ['Is the current evidence live research?', 'No. The current objective-aware evidence bundle is Demo Dataset — Simulated. Real Mind execution and live external research are separate claims.'],
  ['What happens when execution fails?', 'The run is shown as failed. A timeout, missing reply, identity mismatch, or invalid response is never presented as a completed briefing.'],
];

function DocHead({ label, title }) { return <header className="docs-content-head"><span>{label}</span><h2>{title}</h2></header>; }

function SectionBody({ id }) {
  if (id === 'overview') return <><DocHead label="PRODUCT THESIS" title="Persistent decision intelligence for creators."/><p>GreenRoom helps solo creators carry goals, preferences, constraints, and prior decisions from one session to the next. A creator sets an objective and gets back only the decisions worth attention.</p><h3>The product promise</h3><div className="docs-feature-grid">{['Remembers how you work','Keeps an objective active','Works in the background','Returns an actionable briefing','Learns from feedback'].map(item => <span key={item}>{item}</span>)}</div></>;
  if (id === 'how') return <><DocHead label="CORE LOOP" title="One thread through the work."/><div className="docs-lifecycle">{lifecycle.map(([title, copy]) => <article key={title}><h3>{title}</h3><p>{copy}</p></article>)}</div></>;
  if (id === 'onboarding') return <><DocHead label="CREATOR CONTEXT" title="Start with what should persist."/><p>Onboarding records the existing creator profile fields: name, niche, audience, preferred tone, primary goal, brand attributes, and topic constraints. This phase preserves that schema; its value should be validated against real personalization behavior.</p><p>Creator context can be reviewed from Memory, where additional preferences and feedback can be taught in human language.</p></>;
  if (id === 'mind') return <><DocHead label="VERIFIED PLATFORM IDENTITY" title="Udophia is the GreenRoom Mind."/><p>GreenRoom uses the official Minds Builder client path and accepts a response only after identity and reply validation. Udophia is the only verified platform Mind: <code>udophia@hellominds.ai</code>, UUID <code>8208493e-f36b-1410-8466-00039ce7df11</code>.</p><p>Local classification and orchestration code is not represented as additional remote Minds.</p></>;
  if (id === 'memory') return <><DocHead label="PERSISTENT MEMORY" title="Useful context, carried forward."/><p>Memory includes creator profile facts, objectives, learned preferences, constraints, feedback, decision history, and briefing references. Relevant memory is selected for a run; the complete creator profile remains durable.</p><div className="docs-flow">PROFILE + FEEDBACK <b>→</b> RELEVANT CONTEXT <b>→</b> OBJECTIVE-BOUND RUN <b>→</b> FUTURE MEMORY</div></>;
  if (id === 'background') return <><DocHead label="HONEST LIFECYCLE" title="Leave the screen. Keep the thread."/><p>Production can run through the existing signed background worker and durable persistence. The creator-facing contract is intentionally simpler than the infrastructure:</p><div className="docs-state-row"><span>WORKING</span><span>RESULT READY</span><span>RUN FAILED</span></div><p>Closing the lifecycle view does not cancel durable work. Waiting is never presented as completion.</p></>;
  if (id === 'briefing') return <><DocHead label="DECISION BRIEFING" title="What deserves attention."/><p>Every completed item preserves the existing briefing contract and stays attached to its run and objective.</p><div className="docs-lifecycle"><article><h3>WHAT CHANGED</h3><p>The relevant finding.</p></article><article><h3>WHY IT MATTERS</h3><p>Its significance for this creator and objective.</p></article><article><h3>WHAT TO DO NEXT</h3><p>One practical next action.</p></article></div></>;
  if (id === 'truth') return <><DocHead label="DEMO DATASET — SIMULATED" title="Evidence stays honest."/><p>The current evidence bundle is simulated. A verified response from the real Mind does not turn simulated inputs into live market research.</p><ul><li>No claim of live URLs, pricing, availability, adoption, or market discovery is made without a real source integration.</li><li>Failed runs cannot reuse an older successful briefing.</li><li>Builder reply reliability remains an open technical constraint documented in the repository.</li></ul></>;
  return <><DocHead label="QUESTIONS" title="GreenRoom FAQ"/><div className="docs-faq">{faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></>;
}

export function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => sections.filter(([, title]) => title.toLowerCase().includes(search.toLowerCase())), [search]);
  return <div className="docs-page"><header className="docs-hero"><p>PRODUCT DOCUMENTATION</p><h1>GreenRoom, explained.</h1><span>The product model—from creator context to an honest, persisted decision briefing.</span></header><div className="docs-layout"><aside className="docs-nav"><label><span>SEARCH DOCUMENTATION</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search sections"/></label><nav>{filtered.map(([id, title]) => <button key={id} className={activeSection === id ? 'is-active' : ''} onClick={() => setActiveSection(id)}>{title}</button>)}</nav></aside><article className="docs-content"><SectionBody id={activeSection}/></article></div></div>;
}

export default DocsPage;
