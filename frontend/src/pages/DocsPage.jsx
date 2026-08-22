import React, { useMemo, useState } from 'react';

const sections = [
  ['overview', '01. OVERVIEW & CORE THESIS'], ['how', '02. HOW GREENROOM WORKS'], ['onboarding', '03. CREATOR ONBOARDING'],
  ['mind', '04. THE PERSISTENT MIND'], ['minds', '05. ANIMOCA MINDS INTEGRATION'], ['imp', '06. INTER-MIND PROTOCOL (IMP)'],
  ['memory', '07. MEMORY & LEARNING'], ['background', '08. BACKGROUND EXECUTION'], ['ranking', '09. INTELLIGENCE & RANKING'],
  ['architecture', '10. ARCHITECTURE'], ['api', '11. API REFERENCE'], ['security', '12. SECURITY & PERSISTENCE'], ['faq', '13. FAQ'],
];

const lifecycle = [
  ['01 — REMEMBER', 'GreenRoom retains useful creator context, preferences, constraints, and previous feedback.'],
  ['02 — OBJECTIVE', 'The creator defines the outcome GreenRoom should keep working toward.'],
  ['03 — WATCH / WORK', 'The persistent Mind holds that objective while background execution evaluates relevant signals.'],
  ['04 — RANK', 'Returned findings are evaluated and prioritized instead of presented as an undifferentiated feed.'],
  ['05 — RETURN', 'GreenRoom persists a briefing and presents the most relevant opportunities or recommendations when the creator returns.'],
];

const architecture = ['React frontend', 'FastAPI / GreenRoom API', 'Creator state + objectives', 'Animoca Minds Builder + specialist Minds', 'Background lifecycle', 'QStash signed worker', 'Redis durable persistence', 'Ranked briefing', 'Creator return'];

const endpoints = [
  ['GET', '/api/state', 'Loads persisted creator state and objectives.'], ['GET', '/api/minds/status', 'Reports configured Mind identity and connectivity state.'],
  ['GET', '/api/briefing/latest', 'Loads the most recently persisted briefing.'], ['GET', '/api/briefing/status', 'Returns the current background-run lifecycle status.'],
  ['POST', '/api/creator/onboard', 'Persists creator profile context.'], ['POST', '/api/objective/create', 'Creates and persists an objective.'],
  ['POST', '/api/objective/run', 'Runs an objective through the existing specialist workflow.'], ['POST', '/api/briefing/trigger', 'Queues background briefing work.'],
  ['POST', '/api/action/reject', 'Persists rejection feedback as creator learning.'], ['WS', '/ws', 'Streams real IMP events to the frontend.'],
];

const faqs = [
  ['What is GreenRoom?', 'A persistent AI Chief of Staff for creators that holds useful context, accepts objectives, and returns ranked recommendations.'],
  ['How is GreenRoom different from ChatGPT or a normal AI assistant?', 'GreenRoom is organized around durable creator context and objective-driven work across sessions, rather than only responding inside one conversation.'],
  ['Does GreenRoom keep working after I leave?', 'Yes, when production background configuration is available. A request is queued, processed by the worker lifecycle, and exposed through persisted status and briefing records.'],
  ['What does GreenRoom remember?', 'Creator identity context, preferences, constraints, learned voice rules, objectives, feedback, and useful history represented by the existing memory model.'],
  ['What is a GreenRoom Mind?', 'The primary Mind is the persistent decision layer that holds the creator objective and coordinates specialist work.'],
  ['How are Animoca Brands Minds used?', 'Production execution uses the official Minds client integration and verifies configured Mind identity before treating a completed response as verified.'],
  ['What happens when I set an objective?', 'The objective is persisted and becomes the context against which later work and returned recommendations are evaluated.'],
  ['How does GreenRoom decide what to return?', 'Briefing items are validated, ranked, grounded in available creator context, and returned with relevance and recommended-action fields.'],
  ['Does GreenRoom store creator context?', 'Yes. Local development can use file persistence; production supports durable Upstash Redis persistence.'],
  ['Can GreenRoom learn from rejected recommendations?', 'Yes. Rejection feedback is converted into a persistent constraint or learned rule used by later recommendations.'],
  ['What is the Inter-Mind Protocol?', 'IMP v1.0 is the repository’s structured event format and message history for communication among GreenRoom and its specialist Minds.'],
  ['Is the background work simulated or real?', 'Production uses QStash and the signed Node worker when configured. Explicit demo mode exists for local demonstration and is labeled as demo behavior.'],
  ['What happens if an AI execution fails?', 'The run is marked failed and no timed-out, missing, or invalid Mind response is reported as a completed verified briefing.'],
  ['How is background execution secured?', 'The production worker verifies QStash signatures and rejects unauthorized direct requests.'],
  ['Where are completed results stored?', 'Completed ranked briefings and lifecycle state are written through the configured persistence store; production is designed for durable Redis storage.'],
];

function SectionBody({ id }) {
  if (id === 'overview') return <><DocHead label="PRODUCT THESIS" title="What is GreenRoom?"/><p><strong>GreenRoom is a persistent AI Chief of Staff for creators.</strong> Unlike a normal chatbot that responds only while the user is present, GreenRoom maintains useful creator context between sessions, remembers preferences and constraints, accepts a creator-defined objective, continues work through a background lifecycle, and returns ranked opportunities or recommendations.</p><h3>Why it exists</h3><p>Creators repeatedly reconstruct context for AI tools, manually monitor scattered information, and return to disconnected sessions. GreenRoom is designed to preserve the working thread and keep pursuing a defined outcome.</p><h3>What makes it different</h3><div className="docs-feature-grid">{['Persistent creator state','Human-readable memory','Objective-driven operation','Background execution','Specialist Minds','Ranked returns','Feedback and learning'].map(x=><span key={x}>{x}</span>)}</div></>;
  if (id === 'how') return <><DocHead label="PRODUCT LIFECYCLE" title="One thread through the work."/><div className="docs-lifecycle">{lifecycle.map(([title,copy])=><article key={title}><h3>{title}</h3><p>{copy}</p></article>)}</div></>;
  if (id === 'onboarding') return <><DocHead label="CREATOR CONTEXT" title="Start with what should persist."/><p>Creator onboarding records the name, niche, audience description, preferred tone, primary goal, brand attributes, and explicit topic constraints accepted by the existing onboarding API.</p><ol><li>Open creator context from Memory.</li><li>Provide the creator and audience information relevant to later decisions.</li><li>Save it through <code>/api/creator/onboard</code>.</li><li>Review or teach additional rules from the Memory route.</li></ol></>;
  if (id === 'mind') return <><DocHead label="PERSISTENT DECISION LAYER" title="The living GreenRoom Mind"/><p>The primary Mind holds the objective, reads persisted creator context, coordinates specialist outputs, and changes visible state only as real work advances.</p><div className="docs-state-row">{['REMEMBERING','WATCHING','WORKING','RANKING','RETURNED'].map(x=><span key={x}>{x}</span>)}</div><p>The interface never uses animation to invent backend progress. Polling and persisted lifecycle records determine the real state.</p></>;
  if (id === 'minds') return <><DocHead label="ANIMOCA BRANDS" title="Verified Minds execution."/><p>GreenRoom integrates through the official <code>@animocabrands/minds-client-lib</code> bridge. The production path validates the configured Mind UUID, developer email, wallet address, and enabled state. A missing reply, timeout, invalid identity, or client failure raises an execution error rather than falling back to a fake production result.</p><pre>{`GreenroomCore\n  ├─ ScoutMind: discovers signals\n  ├─ CommunityMind: evaluates audience relevance\n  └─ BusinessMind: evaluates commercial fit`}</pre></>;
  if (id === 'imp') return <><DocHead label="IMP v1.0" title="Structured collaboration events."/><p>The Inter-Mind Protocol records typed messages among the core and specialist Minds. Events such as trend findings, audience insights, proposals, and delegated drafts are stored in message history and streamed to the frontend over the existing WebSocket gateway.</p><p>IMP provides inspectable collaboration context; it does not replace the background worker or persistence layer.</p></>;
  if (id === 'memory') return <><DocHead label="PERSISTENT MEMORY" title="Feedback becomes useful context."/><p>The memory engine stores creator profile context, objectives, learned voice rules, rejected topics, memory nodes, decision feedback, and the latest briefing. Rejected recommendations can produce explicit constraints that affect later independent runs.</p><div className="docs-flow">RECOMMENDATION <b>→</b> FEEDBACK <b>→</b> RULE EXTRACTION <b>→</b> PERSISTENCE <b>→</b> ADAPTED RETURN</div></>;
  if (id === 'background') return <><DocHead label="QSTASH LIFECYCLE" title="Work continues through a real queue."/><p><code>/api/briefing/trigger</code> creates a run and queues the production worker through QStash. Submission returns after the Minds message is durably recorded; delayed QStash collection checks verified conversation history without holding a serverless request open. The frontend polls persisted lifecycle state through <code>/api/briefing/status</code>.</p><div className="docs-state-row"><span>QUEUED</span><span>SUBMITTING</span><span>WAITING_FOR_MINDS</span><span>COMPLETED</span><span>FAILED</span></div><p>Local demo mode can execute without QStash and is explicitly identified as demo behavior. Production completion requires the configured worker, persistence, and Minds execution path.</p></>;
  if (id === 'ranking') return <><DocHead label="RANKED BRIEFING" title="Signal becomes a decision."/><p>A completed briefing contains validated <code>items[]</code>. Each ranked item carries a title, what changed, why it matters, recommended action, and available grounding or provenance. GreenRoom returns the strongest opportunities first instead of exposing an unfiltered feed.</p><p>Completed briefings are reloaded from durable persistence on refresh.</p></>;
  if (id === 'architecture') return <><DocHead label="SYSTEM ARCHITECTURE" title="From creator context to return."/><div className="docs-architecture">{architecture.map((x,i)=><React.Fragment key={x}><span>{x}</span>{i<architecture.length-1&&<b>↓</b>}</React.Fragment>)}</div><p>IMP participates inside the Minds collaboration layer and exposes structured events to the React interface. It does not bypass FastAPI, QStash verification, or the persistence store.</p></>;
  if (id === 'api') return <><DocHead label="REST & WEBSOCKET" title="Production API reference."/><div className="docs-endpoints">{endpoints.map(([method,path,copy])=><article key={path}><strong>{method}</strong><code>{path}</code><p>{copy}</p></article>)}</div></>;
  if (id === 'security') return <><DocHead label="TRUST BOUNDARIES" title="Secure execution, durable results."/><ul><li>The production worker verifies QStash signatures and rejects unauthorized direct requests.</li><li>Production Minds execution fails loudly when required credentials or verified output are unavailable.</li><li>Timeouts and invalid responses cannot be labeled completed.</li><li>Production persistence supports Upstash Redis and recognizes the configured KV aliases.</li><li>Local file and ephemeral stores are explicitly labeled and are not represented as durable production storage.</li></ul></>;
  return <><DocHead label="QUESTIONS" title="GreenRoom FAQ"/><div className="docs-faq">{faqs.map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></>;
}

function DocHead({ label, title }) { return <header className="docs-content-head"><span>{label}</span><h2>{title}</h2></header>; }

export function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview'); const [search, setSearch] = useState('');
  const filtered = useMemo(() => sections.filter(([,title]) => title.toLowerCase().includes(search.toLowerCase())), [search]);
  return <div className="docs-page">
    <header className="docs-hero"><p>PRODUCT & DEVELOPER DOCUMENTATION</p><h1>GreenRoom, explained.</h1><span>The complete product model—from creator context to a secure, persisted return.</span></header>
    <div className="docs-layout">
      <aside className="docs-nav"><label><span>SEARCH DOCUMENTATION</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search sections"/></label><nav>{filtered.map(([id,title])=><button key={id} className={activeSection===id?'is-active':''} onClick={()=>setActiveSection(id)}>{title}</button>)}</nav></aside>
      <article className="docs-content"><SectionBody id={activeSection}/></article>
    </div>
  </div>;
}

export default DocsPage;
