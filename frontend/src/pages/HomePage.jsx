import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Shield, Terminal, Activity, Zap, Layers, Cpu } from 'lucide-react';
import { KineticNoirCore } from '../components/mind/KineticNoirCore';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

export function HomePage({ memoryState, activeCards, onNavigate, onRunFullDemo, isExecuting }) {
  const creatorName = memoryState?.creator_name || 'CREATOR';

  const intelligenceCells = [
    {
      id: 1,
      tag: 'AUDIENCE SIGNAL',
      title: 'High Demand for Local Agent Pipelines',
      body: '88% of community comments requesting step-by-step local model workflow guide.',
      icon: Activity,
    },
    {
      id: 2,
      tag: 'TREND DETECTED',
      title: 'Beginner AI Workflows & Automation',
      body: 'Flagged by Scout Mind with fit score 0.92 across 145k daily discussions.',
      icon: Zap,
    },
    {
      id: 3,
      tag: 'MONETIZATION DEAL',
      title: 'TechBrand Inc. Sponsorship Proposal',
      body: 'Calculated target deal size $5,400 based on $45 CPM benchmark.',
      icon: Shield,
    },
    {
      id: 4,
      tag: 'VOICE ADAPTATION',
      title: 'Learned Punchy Terminal Preference',
      body: 'Persisted preference: Creator prefers concise, action-oriented terminal hooks.',
      icon: Terminal,
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="flex-1 p-8 md:p-10 space-y-10 max-w-[1500px] mx-auto text-zinc-100"
    >
      {/* Hero Section */}
      <motion.div variants={itemVariants} className="space-y-3 border-b border-[#1a1a22] pb-8">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00ff87] shadow-[0_0_10px_#00ff87] animate-pulse" />
          <span className="text-xs font-mono font-bold text-[#00ff87] uppercase tracking-widest">
            GREENROOM AI CHIEF OF STAFF • KINETIC NOIR OS
          </span>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl md:text-6xl font-sans font-black tracking-tight text-[#00ff87] uppercase drop-shadow-[0_0_20px_rgba(0,255,135,0.35)] leading-tight"
        >
          GOOD MORNING, {creatorName}.<br />
          <span className="text-zinc-100 font-light">Greenroom is online.</span>
        </motion.h1>

        <p className="text-sm font-sans text-zinc-400 max-w-2xl">
          Autonomous intelligence matrix active. Your chief of staff has synthesized audience demand, monetizable signals, and content recommendations while you were away.
        </p>
      </motion.div>

      {/* WHILE YOU WERE AWAY Section */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#00ff87]" />
            WHILE YOU WERE AWAY
          </h2>
          <span className="text-[11px] font-mono text-zinc-500">4 INTELLIGENCE CELLS ACTIVE</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {intelligenceCells.map((cell) => {
            const CellIcon = cell.icon;
            return (
              <motion.div
                key={cell.id}
                variants={itemVariants}
                whileHover={{ y: -4, borderColor: 'rgba(0,255,135,0.4)', boxShadow: '0 10px 30px -10px rgba(0,255,135,0.15)' }}
                className="motion-card p-6 rounded-xl border border-[#1a1a22] bg-[#111115] space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[#00ff87] uppercase tracking-wider bg-[#062416] border border-[#0b4d2e] px-2.5 py-0.5 rounded">
                      {cell.tag}
                    </span>
                    <CellIcon className="w-4 h-4 text-zinc-500" />
                  </div>
                  <h3 className="text-xs font-sans font-bold text-zinc-100 leading-snug">
                    {cell.title}
                  </h3>
                  <p className="text-xs font-sans text-zinc-400 leading-relaxed">
                    {cell.body}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#1a1a22] text-[10px] font-mono text-zinc-500 flex items-center justify-between">
                  <span>CONFIDENCE: 94%</span>
                  <span className="text-[#00ff87]">● LIVE</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* GREENROOM'S TAKE & THE KINETIC NOIR MANIFESTO Panel */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Recommendation Panel (8 cols) */}
        <motion.div
          whileHover={{ borderColor: 'rgba(0,255,135,0.3)' }}
          className="lg:col-span-8 motion-card p-8 rounded-2xl border border-[#1a1a22] bg-[#111115] space-y-6 flex flex-col justify-between shadow-2xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#1a1a22] pb-4">
              <span className="text-xs font-mono font-bold text-[#00ff87] uppercase tracking-widest bg-[#062416] border border-[#0b4d2e] px-3 py-1 rounded-full">
                GREENROOM'S TAKE
              </span>
              <span className="text-xs font-mono text-zinc-500">EXECUTIVE RECOMMENDATION</span>
            </div>

            <h2 className="text-2xl md:text-3xl font-sans font-black text-white tracking-tight leading-tight uppercase">
              THE KINETIC NOIR MANIFESTO
            </h2>

            <p className="text-sm font-sans text-zinc-300 leading-relaxed">
              "Greenroom does not merely respond to prompts. It operates as a persistent AI Chief of Staff—continually reading audience signals, remembering creator preferences, drafting monetization deals, and proposing executive actions."
            </p>

            <div className="p-4 bg-[#08080b] rounded-xl border border-[#1a1a22] space-y-2">
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
                WHY THIS STRATEGY IS RECOMMENDED
              </span>
              <ul className="text-xs font-sans text-zinc-300 space-y-1.5 list-disc list-inside">
                <li><strong className="text-[#00ff87]">Audience Signal:</strong> 88% demand for practical agent pipeline breakdowns.</li>
                <li><strong className="text-[#00ff87]">Monetization Match:</strong> $5,400 sponsorship pitch drafted for TechBrand Inc.</li>
                <li><strong className="text-[#00ff87]">Learned Voice:</strong> Punchier, direct, technical tone automatically applied.</li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-[#1a1a22] flex items-center justify-between">
            <button
              onClick={onRunFullDemo}
              disabled={isExecuting}
              className="px-5 py-2.5 bg-[#00ff87] hover:bg-[#34d399] text-zinc-950 font-mono text-xs font-black uppercase rounded-xl transition shadow-lg shadow-[#00ff87]/20 flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              RUN BRIEFING SIMULATION
            </button>

            <button
              onClick={() => onNavigate('memory')}
              className="text-xs font-mono font-bold text-[#00ff87] hover:text-[#34d399] flex items-center gap-1.5 group"
            >
              VIEW MEMORY MATRIX <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>

        {/* Side Panel (4 cols) */}
        <motion.div
          whileHover={{ borderColor: 'rgba(0,255,135,0.3)' }}
          className="lg:col-span-4 motion-card p-8 rounded-2xl border border-[#1a1a22] bg-[#111115] space-y-6 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest block border-b border-[#1a1a22] pb-3">
              CREATOR VOICE DNA
            </span>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-[#08080b] rounded border border-[#1a1a22]">
                <span className="text-zinc-500 block text-[10px]">VOICE ATTRIBUTES</span>
                <span className="text-zinc-200 font-bold">Direct, Intellectual, Authoritative</span>
              </div>

              <div className="p-3 bg-[#08080b] rounded border border-[#1a1a22]">
                <span className="text-zinc-500 block text-[10px]">CPM BENCHMARK</span>
                <span className="text-[#00ff87] font-bold">$45.00 Tech Creator Rate</span>
              </div>

              <div className="p-3 bg-[#08080b] rounded border border-[#1a1a22]">
                <span className="text-zinc-500 block text-[10px]">AUDIENCE PROFILE</span>
                <span className="text-zinc-200 font-bold">Software Engineers & AI Architects</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#1a1a22] text-[11px] font-mono text-zinc-500 flex items-center justify-between">
            <span>MEMORIES STORED: 14</span>
            <span className="text-[#00ff87]">100% DECAY ACCURACY</span>
          </div>
        </motion.div>
      </motion.div>

      {/* INTELLIGENCE FIELD (Bottom Section with Kinetic AI Core) */}
      <motion.div variants={itemVariants} className="space-y-4 pt-4">
        <h2 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#00ff87]" />
          INTELLIGENCE FIELD & REASONING CORE
        </h2>

        <KineticNoirCore onCoreClick={onRunFullDemo} />
      </motion.div>
    </motion.div>
  );
}
