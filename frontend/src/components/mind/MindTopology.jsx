import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GreenroomCore } from './GreenroomCore';

export function MindTopology({
  activeMind = 'GreenroomCore',
  currentState = 'IDLE',
  onRunStep,
  isExecuting,
}) {
  const [selectedMindId, setSelectedMindId] = useState('GreenroomCore');

  const minds = [
    {
      id: 'GreenroomCore',
      name: 'Greenroom Chief of Staff',
      role: 'Executive Director & Voice Context Synthesizer',
      skill: 'synthesize_strategy',
      stepNum: 3,
      badgeColor: 'border-[#72ff70] bg-[#142616] text-primary-fixed',
      icon: 'psychology',
      description:
        'Oversees all specialist sub-minds, enforces learned creator voice rules, and synthesizes final executive decisions.',
      outputHeader: 'Executive Core Output',
      outputBody:
        'Strategic synthesis active. Aligning Scout trends, Community demand signals, and Business CPM benchmarks.',
      capabilities: [
        'Persistent Memory Rule Enforcement',
        'Multi-Mind Collaboration Routing',
        'Executive Direction Synthesis',
      ],
    },
    {
      id: 'ScoutMind',
      name: 'Scout Mind',
      role: 'Trend Researcher & Noise Filter',
      skill: 'search_trends',
      stepNum: 2,
      badgeColor: 'border-cyan-500/60 bg-cyan-950/40 text-cyan-400',
      icon: 'radar',
      description:
        'Scans external platforms for emerging technical trends while filtering clickbait against your creator DNA.',
      outputHeader: 'Latest Scout Discovery',
      outputBody:
        'Flagged Topic: "Beginner AI Workflows & Automation" (Fit Score: 0.92, Volume: 145k discussions/day). Filtered generic trading spam.',
      capabilities: [
        'Macro Niche Trend Mining',
        'Brand Boundary Noise Filtering',
        'Fit Score Calculation (0.0 - 1.0)',
      ],
    },
    {
      id: 'CommunityMind',
      name: 'Community Mind',
      role: 'Audience Intelligence & Retention Analyst',
      skill: 'analyze_comments',
      stepNum: 3,
      badgeColor: 'border-amber-500/60 bg-amber-950/40 text-amber-400',
      icon: 'groups',
      description:
        'Mines viewer comment streams, retention drops, and sentiment patterns to extract high-intent content hooks.',
      outputHeader: 'Latest Audience Signal',
      outputBody:
        'Comment Mining: 88% positive demand for step-by-step code execution tutorials and direct GitHub repository links.',
      capabilities: [
        'Sentiment Mining (88% Positive)',
        'Retention Curve Breakdown (78% at 30s)',
        'High-Intent Hook Extraction',
      ],
    },
    {
      id: 'BusinessMind',
      name: 'Business Mind',
      role: 'Monetization Strategist & Pitch Architect',
      skill: 'score_deal',
      stepNum: 4,
      badgeColor: 'border-emerald-500/60 bg-emerald-950/40 text-emerald-400',
      icon: 'monetization_on',
      description:
        'Evaluates incoming sponsorship deals against CPM benchmarks and drafts customized pitch briefs.',
      outputHeader: 'Latest Business Deal Score',
      outputBody:
        'Scored TechBrand Inc. at 89% match size. Drafted $5,400 pitch brief based on your $45 CPM target benchmark.',
      capabilities: [
        'CPM Benchmark Valuation ($45 Target)',
        'Sponsorship Match Scoring',
        'Autonomous Pitch Brief Drafting',
      ],
    },
  ];

  const selectedMind = minds.find((m) => m.id === selectedMindId) || minds[0];

  return (
    <div className="space-y-8">
      {/* Mind Topology Canvas Header */}
      <div className="noir-card p-8 bg-[#0e1014]/90 backdrop-blur-md border border-[#72ff70]/30 shadow-2xl relative overflow-hidden">
        {/* SVG Synapse Connection Rays Background */}
        <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <line x1="50%" y1="30%" x2="20%" y2="80%" stroke="#72ff70" strokeWidth="2" strokeDasharray="6 4" />
            <line x1="50%" y1="30%" x2="50%" y2="80%" stroke="#72ff70" strokeWidth="2" strokeDasharray="6 4" />
            <line x1="50%" y1="30%" x2="80%" y2="80%" stroke="#72ff70" strokeWidth="2" strokeDasharray="6 4" />
          </svg>
        </div>

        <div className="relative z-10 space-y-6">
          {/* Top Row: Mind Node Selector Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/60 pb-5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-fixed text-2xl animate-pulse">hub</span>
              <span className="font-mono text-xs font-bold text-primary-fixed uppercase tracking-wider">
                SYNAPSE NEURAL TOPOLOGY
              </span>
            </div>

            {/* Selector Buttons for Minds */}
            <div className="flex flex-wrap items-center gap-2">
              {minds.map((m) => {
                const isSelected = selectedMindId === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMindId(m.id)}
                    className={`px-3.5 py-1.5 rounded font-mono text-xs font-bold transition flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-primary-container text-on-primary-container border-primary-fixed shadow-md shadow-primary-container/20'
                        : 'bg-[#111115] text-zinc-300 border-outline-variant hover:border-[#72ff70]/50 hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">{m.icon}</span>
                    <span>{m.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Central Visualizer & Selected Node Overview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Living Core Visualizer (5 cols) */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm">
                <GreenroomCore
                  stateName={currentState}
                  subtitle={`Focus: ${selectedMind.name}`}
                />
              </div>
            </div>

            {/* Right: Selected Mind Detailed Inspector (7 cols) */}
            <div className="lg:col-span-7 space-y-5 font-sans">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedMind.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`inline-block text-[10px] font-mono font-bold uppercase border px-2.5 py-0.5 rounded ${selectedMind.badgeColor}`}>
                        Skill: {selectedMind.skill}
                      </span>
                      <h3 className="text-2xl font-display font-bold text-white mt-1.5">
                        {selectedMind.name}
                      </h3>
                      <p className="text-xs font-mono text-zinc-400 font-medium">{selectedMind.role}</p>
                    </div>

                    <button
                      onClick={() => onRunStep && onRunStep(selectedMind.stepNum)}
                      disabled={isExecuting}
                      className="px-5 py-2.5 bg-primary-container text-on-primary-container font-mono text-xs font-bold uppercase rounded hover:bg-primary-fixed-dim transition-colors disabled:opacity-50 shadow-lg shadow-primary-container/20 flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <span className="material-symbols-outlined text-sm font-bold">play_arrow</span>
                      <span>Execute Skill</span>
                    </button>
                  </div>

                  <p className="text-xs text-zinc-200 leading-relaxed font-medium bg-[#0a0c0e] p-4 rounded border border-outline-variant">
                    {selectedMind.description}
                  </p>

                  {/* Output Header & Body */}
                  <div className="p-4 bg-[#142616]/40 border border-[#234d28] rounded space-y-1.5">
                    <span className="font-mono text-[10px] font-bold text-primary-fixed uppercase tracking-wider block">
                      ⚡ {selectedMind.outputHeader}
                    </span>
                    <p className="text-xs font-sans text-white leading-relaxed font-medium">
                      {selectedMind.outputBody}
                    </p>
                  </div>

                  {/* Capabilities Tags */}
                  <div className="space-y-1.5">
                    <span className="font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Domain Capabilities
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedMind.capabilities.map((cap, i) => (
                        <span key={i} className="px-2.5 py-1 bg-[#111115] border border-outline-variant text-zinc-200 rounded text-xs font-mono">
                          ✓ {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Specialist Mind Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {minds.map((m) => {
          const isSelected = selectedMindId === m.id;
          return (
            <motion.div
              key={m.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedMindId(m.id)}
              className={`noir-card p-6 flex flex-col justify-between space-y-4 cursor-pointer transition-all duration-300 ${
                isSelected
                  ? 'border-primary-fixed bg-[#142616]/50 shadow-xl ring-1 ring-primary-fixed'
                  : 'hover:border-primary-fixed/50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-[#0a0c0e] border border-outline-variant flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary-fixed text-xl">{m.icon}</span>
                </div>
                <span className={`text-[9px] font-mono font-bold border px-2 py-0.5 rounded ${m.badgeColor}`}>
                  {m.skill}
                </span>
              </div>

              <div>
                <h4 className="text-base font-display font-bold text-white flex items-center justify-between">
                  <span>{m.name}</span>
                  <span className="material-symbols-outlined text-sm text-zinc-400">arrow_outward</span>
                </h4>
                <p className="text-xs font-mono text-zinc-400 mt-0.5">{m.role}</p>
                <p className="text-xs font-sans text-zinc-300 mt-2 line-clamp-2 leading-relaxed font-medium">
                  {m.description}
                </p>
              </div>

              <div className="pt-3 border-t border-outline-variant/60 flex items-center justify-between font-mono text-[10px]">
                <span className="text-primary-fixed font-bold">Status: Online</span>
                <span className="text-zinc-400 hover:text-white underline">Inspect →</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default MindTopology;
