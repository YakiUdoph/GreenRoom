import React from 'react';
import { Sparkles, ArrowRight, TrendingUp, Users, DollarSign, CheckCircle2, Bookmark } from 'lucide-react';
import { GreenroomCore } from '../components/mind/GreenroomCore';

export function Home({
  memoryState,
  activeCards,
  mindsStatus,
  onNavigate,
  onRunFullDemo,
  isExecuting,
}) {
  const creatorName = memoryState?.creator_name || 'Alex Rivera';
  const learnedRules = memoryState?.learned_voice_rules || [];
  const memoryNodes = memoryState?.memory_nodes || [];
  const benchmarks = memoryState?.monetization_benchmarks || {};

  const scriptData = activeCards?.script;
  const pitchData = activeCards?.pitch;

  const isPunchy = scriptData?.is_punchy_voice || learnedRules.some(r => r.toLowerCase().includes('punchy'));

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-12">
      {/* Editorial Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800/80 pb-8">
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/60 border border-emerald-800/80 px-3 py-1 rounded-full">
            ● Chief of Staff Status: Online & Monitoring
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight font-sans">
            GOOD MORNING, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">{creatorName.toUpperCase()}</span>.
          </h1>
          <p className="text-sm md:text-base text-slate-400 font-medium">
            "I've been analyzing signals and preparing strategic directions while you were away."
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onRunFullDemo}
            disabled={isExecuting}
            className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-900/30 flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            Run Full Studio Briefing
          </button>
        </div>
      </section>

      {/* Grid: Greenroom Take + Living Core */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Greenroom's Strategic Take (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-xl">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider bg-amber-950/60 border border-amber-800/80 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                GREENROOM'S TAKE
              </span>
              <span className="text-xs font-mono text-slate-500">Updated just now</span>
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-slate-100 leading-snug">
              Audience engagement is shifting toward practical developer setup tutorials and direct open-source repositories.
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed">
              Based on retention metrics ({memoryNodes.length > 0 ? '78% retention at 30s' : '88% positive sentiment'}) and recent comment stream analysis, your audience responds strongest to no-fluff technical execution rather than broad news recaps.
            </p>
          </div>

          <div className="pt-6 border-t border-slate-800/80 mt-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs text-slate-400 font-medium">
                {learnedRules.length} learned rules active in persistent memory
              </span>
            </div>
            <button
              onClick={() => onNavigate('memory')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 group"
            >
              Inspect Creator Memory <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Right Column: Living Core Visualizer (5 cols) */}
        <div className="lg:col-span-5">
          <GreenroomCore
            stateName={isExecuting ? 'COLLABORATING' : 'IDLE'}
            subtitle="Autonomous Chief of Staff Engine managing persistent creator intelligence."
          />
        </div>
      </div>

      {/* WHILE YOU WERE AWAY Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-200 tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            WHILE YOU WERE AWAY
          </h3>
          <span className="text-xs text-slate-500 font-mono">3 Signals Captured</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Signal 1: Audience Signal */}
          <div className="p-5 bg-slate-950/80 border border-slate-800/80 rounded-2xl space-y-3 hover:border-slate-700 transition">
            <div className="flex justify-between items-start">
              <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-400">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded font-bold">
                88% Sentiment
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-100">Audience Demand Spike</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Viewers are requesting beginner local agent setup guides and direct GitHub repository links.
            </p>
          </div>

          {/* Signal 2: Trend Detected */}
          <div className="p-5 bg-slate-950/80 border border-slate-800/80 rounded-2xl space-y-3 hover:border-slate-700 transition">
            <div className="flex justify-between items-start">
              <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-800/80 text-cyan-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 border border-cyan-800 px-2 py-0.5 rounded font-bold">
                Fit Score: 0.92
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-100">Niche Trend Flagged</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              "Beginner AI Workflows & Automation" flagged as high-fit topic while trading bot spam was filtered out.
            </p>
          </div>

          {/* Signal 3: Monetization Opportunity */}
          <div className="p-5 bg-slate-950/80 border border-slate-800/80 rounded-2xl space-y-3 hover:border-slate-700 transition">
            <div className="flex justify-between items-start">
              <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-950 border border-amber-800 px-2 py-0.5 rounded font-bold">
                ${benchmarks.cpm_target || 45} CPM Target
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-100">Sponsorship Deal Draft</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Business Mind scored TechBrand Inc. at 89% match size and drafted a ${benchmarks.minimum_deal_size || 5000} pitch brief.
            </p>
          </div>
        </div>
      </section>

      {/* CORE RECOMMENDATION CARD */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/90 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-extrabold text-cyan-400 uppercase tracking-wider bg-cyan-950/80 border border-cyan-800 px-3 py-1 rounded-full">
                RECOMMENDED CREATIVE DIRECTION
              </span>
              {isPunchy && (
                <span className="text-xs font-bold text-amber-300 bg-amber-950 border border-amber-700 px-3 py-1 rounded-full flex items-center gap-1 animate-pulse">
                  ⚡ Punchy Voice Rule Applied
                </span>
              )}
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-white mt-2">
              Script Concept: Beginner AI Workflows & Automation
            </h3>
          </div>

          <button
            onClick={() => onNavigate('actions')}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition shadow-md shadow-emerald-500/20 flex items-center gap-2 whitespace-nowrap"
          >
            <CheckCircle2 className="w-4 h-4" />
            Build This Recommendation
          </button>
        </div>

        {/* Script Content Preview */}
        <div className="p-4 md:p-6 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
          {scriptData?.script_concept || (
            `PREMIUM SCRIPT CONCEPT: Beginner AI Workflows & Automation\n\n` +
            `[HOOK - 0:00-0:15]\n` +
            `Stop wasting hours configuring complex local pipelines. Here are the 3 setup steps to launch your custom agent today.\n\n` +
            `[CORE DEMO - 0:15-2:30]\n` +
            `Step 1: Clone repository. Step 2: Set .env API key. Step 3: Execute python workflow script.\n\n` +
            `[CTA & SPONSOR]\n` +
            `Check out the repo link below and TechBrand Inc. for native dev keys.`
          )}
        </div>

        {/* WHY Citation Panel */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
            WHY GREENROOM RECOMMENDS THIS (EVIDENCE & MEMORY CITATIONS):
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-sans">
            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
              <span className="text-[10px] font-bold text-cyan-400 block uppercase">Audience Evidence</span>
              <p className="text-slate-300 mt-1">Comment analysis shows 88% demand for GitHub repository links and code execution tutorials.</p>
            </div>
            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
              <span className="text-[10px] font-bold text-amber-400 block uppercase">Content History</span>
              <p className="text-slate-300 mt-1">Past script analytics confirm 78% viewer retention on step-by-step setup guides.</p>
            </div>
            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
              <span className="text-[10px] font-bold text-emerald-400 block uppercase">Memory & Learned Voice</span>
              <p className="text-slate-300 mt-1">
                {learnedRules.length > 0 ? `Active Rule: "${learnedRules[learnedRules.length - 1]}"` : 'Brand Voice Matrix: Educational, Technical, Direct.'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
