import React from 'react';
import { Sparkles, ArrowRight, TrendingUp, Users, DollarSign, CheckCircle2, Bookmark } from 'lucide-react';

export function HomePage({ memoryState, activeCards, onNavigate, onRunFullDemo, isExecuting }) {
  const creatorName = memoryState?.creator_name || 'Alex Rivera';
  const learnedRules = memoryState?.learned_voice_rules || [];
  const scriptData = activeCards?.script;

  return (
    <div className="flex-1 p-8 md:p-10 space-y-10 max-w-[1400px]">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-[#18181b] pb-8">
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest bg-[#0d1512] border border-[#1b3d2f] px-3 py-1 rounded-full inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            CHIEF OF STAFF STATUS: ONLINE
          </span>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white tracking-tight uppercase">
            GOOD MORNING, {creatorName}.
          </h1>
          <p className="text-sm font-sans text-zinc-400">
            "I've been analyzing signals and preparing strategic directions while you were away."
          </p>
        </div>

        <button
          onClick={onRunFullDemo}
          disabled={isExecuting}
          className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 fill-current" />
          Run Studio Briefing
        </button>
      </div>

      {/* 2-Column Section: Greenroom's Take + Core Briefing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 motion-card p-8 rounded-xl border border-[#1f1f23] space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest bg-[#0d1512] border border-[#1b3d2f] px-3 py-1 rounded-full">
                GREENROOM'S TAKE
              </span>
              <span className="text-xs font-mono text-zinc-500">Updated just now</span>
            </div>

            <h2 className="text-xl md:text-2xl font-serif font-bold text-zinc-100 leading-snug">
              Audience engagement is shifting toward practical developer setup tutorials and direct open-source repositories.
            </h2>

            <p className="text-sm font-sans text-zinc-300 leading-relaxed">
              Based on retention metrics and comment stream analysis, your audience responds strongest to technical setup execution rather than news recaps.
            </p>
          </div>

          <div className="pt-6 border-t border-[#18181b] flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">
              {learnedRules.length} learned voice rules active
            </span>
            <button
              onClick={() => onNavigate('memory')}
              className="text-xs font-mono font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 group"
            >
              INSPECT MEMORY <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Signals Briefing Card */}
        <div className="lg:col-span-5 motion-card p-8 rounded-xl border border-[#1f1f23] space-y-6">
          <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest block border-b border-[#18181b] pb-3">
            WHILE YOU WERE AWAY
          </span>

          <div className="space-y-4 text-xs font-mono">
            <div className="p-4 bg-[#09090b] rounded-lg border border-[#1f1f23] space-y-1">
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>AUDIENCE DEMAND</span>
                <span>88% SENTIMENT</span>
              </div>
              <p className="text-zinc-300 font-sans">Viewers requesting local agent setup scripts & repository links.</p>
            </div>

            <div className="p-4 bg-[#09090b] rounded-lg border border-[#1f1f23] space-y-1">
              <div className="flex justify-between text-cyan-400 font-bold">
                <span>TREND DETECTED</span>
                <span>FIT: 0.92</span>
              </div>
              <p className="text-zinc-300 font-sans">"Beginner AI Workflows" flagged as high-fit topic.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
