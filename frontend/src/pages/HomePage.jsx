import React from 'react';
import { motion } from 'framer-motion';
import { GreenroomCore } from '../components/mind/GreenroomCore';

export function HomePage({
  memoryState,
  activeCards,
  mindsStatus,
  onNavigate,
  onRunFullDemo,
  isExecuting,
}) {
  const creatorName = memoryState?.creator_name || 'CREATOR';
  const learnedRules = memoryState?.learned_voice_rules || [];
  const memoryNodes = memoryState?.memory_nodes || [];
  const benchmarks = memoryState?.monetization_benchmarks || {};

  const scriptData = activeCards?.script;

  const isPunchy = scriptData?.is_punchy_voice || learnedRules.some((r) => r.toLowerCase().includes('punchy'));

  return (
    <div className="flex-1 flex flex-col min-w-0 pb-16 text-white font-sans space-y-8 max-w-container-max mx-auto px-6 md:px-10 pt-4">
      {/* Hero Header Area */}
      <section className="relative w-full border-b border-outline-variant/60 pb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-fixed animate-pulse shadow-[0_0_10px_#72ff70]" />
              <span className="font-mono text-primary-fixed uppercase tracking-widest text-xs font-bold bg-[#142616] px-3 py-0.5 rounded border border-[#234d28]">
                System Active • AI Chief of Staff
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white tracking-tight">
              GOOD MORNING, {creatorName.toUpperCase()}.{' '}
              <span className="text-primary-fixed drop-shadow-[0_0_15px_rgba(114,255,112,0.3)]">
                Greenroom is online.
              </span>
            </h1>
            <p className="text-xs md:text-sm font-sans text-zinc-200 border-l-2 border-primary-fixed pl-3 py-0.5 leading-relaxed font-medium">
              I've been monitoring signals and preparing strategic creator directions while you were away.
            </p>
          </div>

          <button
            onClick={onRunFullDemo}
            disabled={isExecuting}
            className="px-5 py-3 bg-primary-container text-on-primary-container text-xs font-sans font-bold hover:bg-primary-fixed-dim transition-colors flex items-center gap-2 rounded disabled:opacity-50 shadow-lg shadow-primary-container/20 whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-base font-bold">play_arrow</span>
            <span>Run Agent Pipeline Briefing</span>
          </button>
        </div>
      </section>

      {/* WHILE YOU WERE AWAY Section */}
      <div className="space-y-4">
        <h2 className="text-xs font-mono text-primary-fixed uppercase tracking-widest flex items-center gap-2 font-bold">
          <span className="w-3 h-[2px] bg-primary-fixed block" />
          WHILE YOU WERE AWAY — SIGNALS & CONTEXT
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Signal 1: Audience Signal */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="noir-card p-5 flex flex-col justify-between space-y-4 cursor-pointer group"
          >
            <div className="flex justify-between items-start">
              <span className="material-symbols-outlined text-primary-fixed group-hover:scale-110 transition-transform text-2xl">
                radar
              </span>
              <span className="font-mono text-xs text-primary-fixed font-bold bg-[#142616] px-2.5 py-0.5 rounded border border-[#234d28]">
                88% Sentiment
              </span>
            </div>
            <div className="space-y-1">
              <span className="font-mono text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">AUDIENCE SIGNAL</span>
              <h3 className="text-base font-sans font-bold text-white group-hover:text-primary-fixed transition-colors">
                Audience Demand Spike
              </h3>
              <p className="text-xs font-sans text-zinc-300 leading-relaxed font-medium">
                Viewers requesting beginner local agent setup guides and direct GitHub repository links.
              </p>
            </div>
          </motion.div>

          {/* Signal 2: Trend Detected */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="noir-card p-5 flex flex-col justify-between space-y-4 cursor-pointer group"
          >
            <div className="flex justify-between items-start">
              <span className="material-symbols-outlined text-primary-fixed group-hover:scale-110 transition-transform text-2xl">
                trending_up
              </span>
              <span className="font-mono text-xs text-primary-fixed font-bold bg-[#142616] px-2.5 py-0.5 rounded border border-[#234d28]">
                Fit Score: 0.92
              </span>
            </div>
            <div className="space-y-1">
              <span className="font-mono text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">SCOUT TREND</span>
              <h3 className="text-base font-sans font-bold text-white group-hover:text-primary-fixed transition-colors">
                Niche Trend Flagged
              </h3>
              <p className="text-xs font-sans text-zinc-300 leading-relaxed font-medium">
                "Beginner AI Workflows & Automation" flagged as high-fit topic while clickbait was filtered out.
              </p>
            </div>
          </motion.div>

          {/* Signal 3: Business Opportunity */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="noir-card p-5 flex flex-col justify-between space-y-4 cursor-pointer group"
          >
            <div className="flex justify-between items-start">
              <span className="material-symbols-outlined text-primary-fixed group-hover:scale-110 transition-transform text-2xl">
                monetization_on
              </span>
              <span className="font-mono text-xs text-primary-fixed font-bold bg-[#142616] px-2.5 py-0.5 rounded border border-[#234d28]">
                ${benchmarks.cpm_target || 45} CPM
              </span>
            </div>
            <div className="space-y-1">
              <span className="font-mono text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">BUSINESS MATCH</span>
              <h3 className="text-base font-sans font-bold text-white group-hover:text-primary-fixed transition-colors">
                Sponsorship Deal Draft
              </h3>
              <p className="text-xs font-sans text-zinc-300 leading-relaxed font-medium">
                Business Mind scored TechBrand Inc. at 89% match size and drafted a ${benchmarks.minimum_deal_size || 5000} pitch brief.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* GREENROOM'S TAKE & Living Core Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Editorial Analysis (7 cols) */}
        <div className="lg:col-span-7 noir-card p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <h2 className="text-xs font-mono text-primary-fixed uppercase tracking-widest flex items-center gap-2 font-bold">
              <span className="w-3 h-[2px] bg-primary-fixed block" />
              GREENROOM'S TAKE
            </h2>

            <div className="text-xl md:text-2xl font-display font-bold text-white leading-snug">
              Audience engagement is shifting toward practical setup tutorials and direct open-source repositories.
            </div>

            <p className="text-xs md:text-sm font-sans text-zinc-200 leading-relaxed font-medium">
              Based on retention metrics ({memoryNodes.length > 0 ? '78% retention at 30s' : '88% positive sentiment'}) and recent comment stream analysis, your audience responds strongest to no-fluff technical execution tutorials rather than broad news recaps.
            </p>
          </div>

          <div className="pt-4 border-t border-outline-variant/60 flex items-center justify-between font-mono text-xs">
            <span className="text-zinc-300 font-bold">
              {learnedRules.length} learned rules active in memory
            </span>
            <button
              onClick={() => onNavigate('memory')}
              className="text-primary-fixed hover:underline font-bold text-xs flex items-center gap-1"
            >
              Inspect Memory DNA →
            </button>
          </div>
        </div>

        {/* Living Core Visualizer (5 cols) */}
        <div className="lg:col-span-5">
          <GreenroomCore
            stateName={isExecuting ? 'COLLABORATING' : 'IDLE'}
            subtitle="Autonomous Chief of Staff Engine managing persistent creator intelligence."
          />
        </div>
      </div>

      {/* Primary Recommendation Card */}
      <div className="noir-card p-6 flex flex-col space-y-5 border-l-4 border-l-primary-fixed">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-outline-variant/60 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-fixed text-base">priority_high</span>
              <span className="font-mono text-primary-fixed text-xs uppercase tracking-wider font-bold">
                RECOMMENDED CREATIVE DIRECTION
              </span>
              {isPunchy && (
                <span className="font-mono text-[10px] font-bold text-amber-300 bg-amber-950 border border-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  ⚡ Punchy Voice Active
                </span>
              )}
            </div>

            <h3 className="text-xl md:text-2xl font-display font-bold text-white">
              Script Concept: Beginner AI Workflows & Automation
            </h3>
          </div>

          <button
            onClick={() => onNavigate('actions')}
            className="bg-primary-container text-on-primary-container text-xs font-sans font-bold py-3 px-5 hover:bg-primary-fixed-dim transition-colors flex justify-center items-center gap-2 rounded disabled:opacity-50 shadow-lg shadow-primary-container/20 whitespace-nowrap"
          >
            <span>Build This Recommendation</span>
            <span className="material-symbols-outlined text-base font-bold">arrow_forward</span>
          </button>
        </div>

        {/* Script Content Preview */}
        <div className="p-4 bg-[#0e0e11] rounded border border-outline-variant font-mono text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto shadow-inner">
          {scriptData?.script_concept || (
            `RECOMMENDED SCRIPT CONCEPT: Beginner AI Workflows & Automation\n\n` +
            `[HOOK - 0:00-0:15]\n` +
            `Stop wasting hours configuring complex local pipelines. Here are the 3 setup steps to launch your custom agent today.\n\n` +
            `[EXECUTION WALKTHROUGH - 0:15-2:30]\n` +
            `Step 1: Clone repository. Step 2: Set .env API key. Step 3: Execute python workflow script.\n\n` +
            `[CTA & SPONSOR INTEGRATION]\n` +
            `Check out the repo link below and TechBrand Inc. for native dev keys.`
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
