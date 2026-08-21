import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundFx } from '../lib/sound';

export function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopyCode = (code, id) => {
    try {
      navigator.clipboard.writeText(code);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('[DocsPage] Copy error:', err);
    }
  };

  const sections = [
    { id: 'overview', title: '1. Overview & Core Thesis', icon: 'auto_awesome' },
    { id: 'onboarding', title: '2. Creator Onboarding Guide', icon: 'badge' },
    { id: 'minds-sdk', title: '3. Animoca Minds SDK Integration', icon: 'psychology' },
    { id: 'imp-protocol', title: '4. Inter-Mind Protocol (IMP v1.0)', icon: 'sensors' },
    { id: 'memory-engine', title: '5. Persistent Memory & Learning', icon: 'database' },
    { id: 'api-reference', title: '6. FastAPI REST & WS API Reference', icon: 'api' },
  ];

  return (
    <div className="manus-route manus-route--docs flex-1 p-6 md:p-10 space-y-8 max-w-container-max mx-auto text-white font-sans relative z-10">
      {/* Header */}
      <div className="border-b border-[#72ff70]/30 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary-fixed text-2xl">menu_book</span>
            <span className="font-mono text-xs text-primary-fixed uppercase tracking-widest font-bold bg-[#142616] px-3 py-0.5 rounded border border-[#234d28]">
              OFFICIAL PRODUCT & DEVELOPER DOCUMENTATION
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white uppercase tracking-tight">
            Greenroom Documentation Portal
          </h1>
          <p className="text-xs md:text-sm font-sans text-zinc-200 mt-1 font-medium">
            Complete technical guide, SDK integration specs, protocol schemas, and user walkthrough.
          </p>
        </div>

        {/* Search Documentation */}
        <div className="relative w-full md:w-72 font-mono text-xs">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-zinc-400 text-sm">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documentation..."
            className="w-full bg-[#0a0c0e] border border-outline-variant rounded pl-9 pr-3 py-2 text-white focus:border-primary-fixed focus:outline-none"
          />
        </div>
      </div>

      {/* Grid Layout: Sidebar Sections + Main Documentation Content */}
      <div className="grid grid-cols-12 gap-8 items-start">
        {/* Left Sub-Navigation Column (3 cols) */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3 space-y-2 sticky top-4">
          <div className="font-mono text-xs font-bold text-primary-fixed uppercase tracking-wider mb-2 px-2">
            DOCUMENTATION SECTIONS
          </div>
          {sections.map((sec) => {
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => {
                  soundFx.playSynapsePulse();
                  setActiveSection(sec.id);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-mono rounded transition-all text-left ${
                  isActive
                    ? 'bg-[#142616] text-primary-fixed font-bold border-l-4 border-primary-fixed shadow-md'
                    : 'bg-[#0e1014] text-zinc-400 hover:text-white hover:bg-[#15171c] border-l-4 border-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-base">{sec.icon}</span>
                <span className="truncate">{sec.title}</span>
              </button>
            );
          })}
        </div>

        {/* Right Content View Area (9 cols) */}
        <div className="col-span-12 md:col-span-8 lg:col-span-9 noir-card p-6 md:p-8 bg-[#0e1014]/95 border border-outline-variant/60 shadow-2xl space-y-6">
          
          {/* SECTION 1: OVERVIEW & CORE THESIS */}
          {activeSection === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="border-b border-outline-variant/60 pb-4">
                <span className="font-mono text-xs text-primary-fixed font-bold uppercase bg-[#142616] px-2.5 py-0.5 rounded border border-[#234d28]">
                  PRODUCT THESIS
                </span>
                <h2 className="text-xl md:text-2xl font-display font-bold text-white mt-2">
                  What is Greenroom?
                </h2>
              </div>

              <blockquote className="p-4 bg-[#142616]/40 border-l-4 border-primary-fixed rounded-r text-sm text-primary-fixed font-mono leading-relaxed font-semibold">
                "GREENROOM WORKS WHILE YOU WORK."
              </blockquote>

              <p className="text-xs md:text-sm font-sans text-zinc-200 leading-relaxed font-medium">
                Greenroom is a <strong>persistent AI Chief of Staff for solo creators</strong>, powered by multi-mind collaboration and the Animoca Brands Minds SDK. Rather than acting as a simple Q&A chatbot, Greenroom operates in the background—monitoring audience retention signals, evaluating niche trends, drafting sponsorship pitch briefs, and adapting recommendations based on long-term creator voice rules.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs pt-2">
                <div className="p-4 bg-[#0a0c0e] rounded border border-outline-variant space-y-1.5">
                  <span className="text-primary-fixed font-bold block uppercase text-[10px]">PERSISTENT INTELLIGENCE</span>
                  <p className="text-zinc-300">Remembers brand rules, audience metrics, and constraints across sessions.</p>
                </div>
                <div className="p-4 bg-[#0a0c0e] rounded border border-outline-variant space-y-1.5">
                  <span className="text-cyan-400 font-bold block uppercase text-[10px]">MULTI-MIND AGENT NETWORK</span>
                  <p className="text-zinc-300">Core, Scout, Community, and Business sub-minds collaborating over IMP v1.0.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* SECTION 2: CREATOR ONBOARDING GUIDE */}
          {activeSection === 'onboarding' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="border-b border-outline-variant/60 pb-4">
                <span className="font-mono text-xs text-primary-fixed font-bold uppercase bg-[#142616] px-2.5 py-0.5 rounded border border-[#234d28]">
                  ONBOARDING FLOW
                </span>
                <h2 className="text-xl md:text-2xl font-display font-bold text-white mt-2">
                  Step-by-Step Creator Onboarding
                </h2>
              </div>

              <div className="space-y-4 font-sans text-xs md:text-sm text-zinc-200">
                <div className="p-4 bg-[#0a0c0e] rounded border border-outline-variant space-y-2">
                  <span className="font-mono text-xs font-bold text-primary-fixed">Step 1: Open Profile Settings</span>
                  <p>Click <code className="text-primary-fixed font-mono">Edit Profile</code> on the Home or Memory page to launch the Creator Onboarding Modal.</p>
                </div>

                <div className="p-4 bg-[#0a0c0e] rounded border border-outline-variant space-y-2">
                  <span className="font-mono text-xs font-bold text-primary-fixed">Step 2: Enter Creator DNA Context</span>
                  <p>Provide Creator Name, Niche (e.g. <em>Developer Tools & AI Automation</em>), Audience Description, Preferred Tone, Main Goal, and explicit Content Constraints (topics to avoid).</p>
                </div>

                <div className="p-4 bg-[#0a0c0e] rounded border border-outline-variant space-y-2">
                  <span className="font-mono text-xs font-bold text-primary-fixed">Step 3: Save & Persist Profile</span>
                  <p>Click <code className="text-primary-fixed font-mono">Persist Profile Memory</code>. The backend writes your context to <code className="font-mono text-primary-fixed">creator_profile.json</code> and updates all agent prompts.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* SECTION 3: ANIMOCA MINDS SDK INTEGRATION */}
          {activeSection === 'minds-sdk' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="border-b border-outline-variant/60 pb-4">
                <span className="font-mono text-xs text-primary-fixed font-bold uppercase bg-[#142616] px-2.5 py-0.5 rounded border border-[#234d28]">
                  SDK SPECIFICATION
                </span>
                <h2 className="text-xl md:text-2xl font-display font-bold text-white mt-2">
                  Animoca Brands Minds SDK Architecture
                </h2>
              </div>

              <p className="text-xs md:text-sm font-sans text-zinc-200 leading-relaxed">
                Greenroom integrates directly with the official <strong>Animoca Brands Minds Builder SDK</strong>. The primary Greenroom Core Mind is bound to remote platform UUID <code className="text-primary-fixed font-mono bg-[#0a0c0e] px-2 py-0.5 rounded border border-outline-variant">8208493e-f36b-1410-8466-00039ce7df11</code>.
              </p>

              <div className="p-4 bg-[#0a0c0e] border border-outline-variant rounded font-mono text-xs space-y-3">
                <div className="flex justify-between items-center text-zinc-400">
                  <span>minds_integration.py snippet</span>
                  <button
                    onClick={() => handleCopyCode(`minds_manager.get_agent("GreenroomCore")`, 'minds')}
                    className="text-primary-fixed hover:underline text-[11px]"
                  >
                    {copiedCode === 'minds' ? 'COPIED!' : 'COPY'}
                  </button>
                </div>
                <pre className="text-zinc-200 overflow-x-auto leading-relaxed">
{`from minds_integration import minds_manager

# Verified platform Mind binding
core_agent = minds_manager.get_agent("GreenroomCore")
status = minds_manager.get_status()
# Returns: { "mind_uuid": "8208493e-f36b-1410-8466-00039ce7df11", "verified": True }`}
                </pre>
              </div>
            </motion.div>
          )}

          {/* SECTION 4: INTER-MIND PROTOCOL (IMP v1.0) */}
          {activeSection === 'imp-protocol' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="border-b border-outline-variant/60 pb-4">
                <span className="font-mono text-xs text-primary-fixed font-bold uppercase bg-[#142616] px-2.5 py-0.5 rounded border border-[#234d28]">
                  PROTOCOL SPECIFICATION
                </span>
                <h2 className="text-xl md:text-2xl font-display font-bold text-white mt-2">
                  Inter-Mind Protocol (IMP v1.0)
                </h2>
              </div>

              <p className="text-xs md:text-sm font-sans text-zinc-200 leading-relaxed">
                The Inter-Mind Protocol (IMP v1.0) is a trust-gated, asynchronous event bus powering communication between Greenroom Minds over real-time WebSockets (<code className="text-primary-fixed font-mono">/ws</code>).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                <div className="p-3 bg-[#0a0c0e] rounded border border-outline-variant">
                  <span className="text-cyan-400 font-bold block">FLAG_TREND</span>
                  <span className="text-zinc-300">ScoutMind → GreenroomCore</span>
                </div>
                <div className="p-3 bg-[#0a0c0e] rounded border border-outline-variant">
                  <span className="text-amber-400 font-bold block">AUDIENCE_INSIGHT</span>
                  <span className="text-zinc-300">CommunityMind → GreenroomCore</span>
                </div>
                <div className="p-3 bg-[#0a0c0e] rounded border border-outline-variant">
                  <span className="text-emerald-400 font-bold block">PITCH_PROPOSAL</span>
                  <span className="text-zinc-300">BusinessMind → GreenroomCore</span>
                </div>
                <div className="p-3 bg-[#0a0c0e] rounded border border-outline-variant">
                  <span className="text-primary-fixed font-bold block">DELEGATE_DRAFT</span>
                  <span className="text-zinc-300">GreenroomCore → Creator</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* SECTION 5: PERSISTENT MEMORY & LEARNING LOOP */}
          {activeSection === 'memory-engine' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="border-b border-outline-variant/60 pb-4">
                <span className="font-mono text-xs text-primary-fixed font-bold uppercase bg-[#142616] px-2.5 py-0.5 rounded border border-[#234d28]">
                  MEMORY MODEL
                </span>
                <h2 className="text-xl md:text-2xl font-display font-bold text-white mt-2">
                  Memory Model & Rejection Feedback Loop
                </h2>
              </div>

              <p className="text-xs md:text-sm font-sans text-zinc-200 leading-relaxed">
                Greenroom's memory model distinguishes between <strong>Identity</strong>, <strong>Preferences</strong>, <strong>Constraints</strong>, <strong>Rules</strong>, <strong>Goals</strong>, and <strong>History</strong> with 720-hour recency weight decay.
              </p>

              <div className="p-4 bg-[#142616]/40 border border-[#234d28] rounded font-mono text-xs space-y-2">
                <span className="text-primary-fixed font-bold uppercase block text-[10px]">THE LEARNING LOOP</span>
                <p className="text-zinc-200">
                  RECOMMENDATION → CREATOR REJECTION ("Too clickbait") → RULE EXTRACTION ("Avoid clickbait hooks") → MEMORY PERSISTENCE → ADAPTED FUTURE RECOMMENDATION
                </p>
              </div>
            </motion.div>
          )}

          {/* SECTION 6: API REFERENCE */}
          {activeSection === 'api-reference' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="border-b border-outline-variant/60 pb-4">
                <span className="font-mono text-xs text-primary-fixed font-bold uppercase bg-[#142616] px-2.5 py-0.5 rounded border border-[#234d28]">
                  REST & WS ENDPOINTS
                </span>
                <h2 className="text-xl md:text-2xl font-display font-bold text-white mt-2">
                  FastAPI REST Endpoints
                </h2>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 bg-[#0a0c0e] rounded border border-outline-variant flex items-center justify-between">
                  <div className="space-x-2">
                    <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 font-bold rounded">GET</span>
                    <span className="text-zinc-200 font-bold">/api/state</span>
                  </div>
                  <span className="text-zinc-400 text-[11px]">Returns full creator state</span>
                </div>

                <div className="p-3 bg-[#0a0c0e] rounded border border-outline-variant flex items-center justify-between">
                  <div className="space-x-2">
                    <span className="px-2 py-0.5 bg-cyan-950 text-cyan-400 font-bold rounded">POST</span>
                    <span className="text-zinc-200 font-bold">/api/creator/onboard</span>
                  </div>
                  <span className="text-zinc-400 text-[11px]">Persists creator profile context</span>
                </div>

                <div className="p-3 bg-[#0a0c0e] rounded border border-outline-variant flex items-center justify-between">
                  <div className="space-x-2">
                    <span className="px-2 py-0.5 bg-rose-950 text-rose-400 font-bold rounded">POST</span>
                    <span className="text-zinc-200 font-bold">/api/action/reject</span>
                  </div>
                  <span className="text-zinc-400 text-[11px]">Extracts constraint rule from rejection</span>
                </div>

                <div className="p-3 bg-[#0a0c0e] rounded border border-outline-variant flex items-center justify-between">
                  <div className="space-x-2">
                    <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 font-bold rounded">POST</span>
                    <span className="text-zinc-200 font-bold">/api/objective/create</span>
                  </div>
                  <span className="text-zinc-400 text-[11px]">Creates & persists new creator objective</span>
                </div>

                <div className="p-3 bg-[#0a0c0e] rounded border border-outline-variant flex items-center justify-between">
                  <div className="space-x-2">
                    <span className="px-2 py-0.5 bg-cyan-950 text-cyan-400 font-bold rounded">POST</span>
                    <span className="text-zinc-200 font-bold">/api/objective/run</span>
                  </div>
                  <span className="text-zinc-400 text-[11px]">Executes objective across specialist Minds</span>
                </div>

                <div className="p-3 bg-[#0a0c0e] rounded border border-outline-variant flex items-center justify-between">
                  <div className="space-x-2">
                    <span className="px-2 py-0.5 bg-purple-950 text-purple-400 font-bold rounded">POST</span>
                    <span className="text-zinc-200 font-bold">/api/recommendation/compare</span>
                  </div>
                  <span className="text-zinc-400 text-[11px]">Returns Before vs After personalization</span>
                </div>

                <div className="p-3 bg-[#0a0c0e] rounded border border-outline-variant flex items-center justify-between">
                  <div className="space-x-2">
                    <span className="px-2 py-0.5 bg-amber-950 text-amber-400 font-bold rounded">WS</span>
                    <span className="text-zinc-200 font-bold">/ws</span>
                  </div>
                  <span className="text-zinc-400 text-[11px]">Real-time WebSocket event stream</span>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}

export default DocsPage;
