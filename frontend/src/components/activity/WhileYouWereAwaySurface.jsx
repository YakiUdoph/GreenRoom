import React from 'react';
import { motion } from 'framer-motion';

export function WhileYouWereAwaySurface({
  briefingData,
  memoryState,
  onNavigate,
}) {
  const briefing = briefingData || memoryState?.latest_briefing;
  const hasCompletedRun = briefing && (briefing.recommended_topic || briefing.script_concept || briefing.overview);

  return (
    <div className="noir-card p-6 md:p-8 bg-[#0e1014]/90 border border-primary-fixed/30 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-outline-variant/60 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary-fixed text-xl">cloud_sync</span>
            <span className="font-mono text-xs text-primary-fixed uppercase tracking-widest font-bold bg-[#142616] px-3 py-0.5 rounded border border-[#234d28]">
              AUTONOMOUS CONTINUITY • WHILE YOU WERE AWAY
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-display font-bold text-white uppercase tracking-tight">
            Background Execution & Overnight Discoveries
          </h2>
          <p className="text-xs font-sans text-zinc-300 mt-1 font-medium">
            Greenroom operates asynchronously on QStash workers while you are offline, evaluating incoming market signals against your creator constraints.
          </p>
        </div>

        <span className="font-mono text-[10px] text-emerald-400 font-bold bg-[#142616] px-2.5 py-1 rounded border border-[#234d28] whitespace-nowrap">
          {hasCompletedRun ? '1 COMPLETED RUN DELIVERED' : 'STANDBY MONITORING'}
        </span>
      </div>

      {hasCompletedRun ? (
        <div className="space-y-4">
          <div className="p-4 bg-[#0a0c0e] rounded-xl border border-[#234d28] space-y-3">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 font-mono text-xs border-b border-outline-variant/40 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-primary-fixed font-bold uppercase text-[10px]">
                  COMPLETED TASK:
                </span>
                <span className="text-white font-bold">
                  {briefing.title || 'Autonomous Objective Synthesis Run'}
                </span>
              </div>
              <span className="text-zinc-400 text-[10px]">
                Originating Mind: Greenroom Core (Scout + Community + Business)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs pt-1">
              <div className="p-3 bg-[#111115] rounded border border-outline-variant/60 space-y-1">
                <strong className="text-cyan-400 block uppercase text-[10px]">SCOUT DISCOVERY:</strong>
                <p className="text-zinc-200">
                  {briefing.scout_finding || 'Discovered high-fit signal "Beginner AI Workflows & Automation" (0.92 raw fit score). Filtered sensationalist hype.'}
                </p>
              </div>

              <div className="p-3 bg-[#111115] rounded border border-outline-variant/60 space-y-1">
                <strong className="text-purple-400 block uppercase text-[10px]">COMMUNITY VALIDATION:</strong>
                <p className="text-zinc-200">
                  {briefing.community_evidence || 'Audience sentiment analysis confirmed subscriber requests for hands-on step-by-step setup guides.'}
                </p>
              </div>

              <div className="p-3 bg-[#111115] rounded border border-outline-variant/60 space-y-1">
                <strong className="text-amber-400 block uppercase text-[10px]">BUSINESS EVALUATION:</strong>
                <p className="text-zinc-200">
                  {briefing.business_valuation || 'Calculated $5,000 target deal size derived from creator profile $45 CPM benchmark.'}
                </p>
              </div>
            </div>

            {/* Directive Result Callout */}
            <div className="p-3 bg-[#142616] rounded border border-[#234d28] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 font-mono text-xs">
              <div>
                <strong className="text-primary-fixed block uppercase text-[10px]">EXECUTIVE ACTION DIRECTIVE:</strong>
                <span className="text-white font-medium">
                  {briefing.recommended_topic || 'Produce a 3-step setup guide for beginner AI workflows with native dev key integration.'}
                </span>
              </div>
              {onNavigate && (
                <button
                  onClick={() => onNavigate('actions')}
                  className="px-3 py-1.5 bg-primary-container text-on-primary-container font-bold uppercase rounded text-xs hover:bg-primary-fixed-dim shrink-0 transition"
                >
                  Review Action →
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 bg-[#0a0c0e] border border-outline-variant/60 rounded-xl text-center space-y-2 font-mono text-xs">
          <span className="material-symbols-outlined text-3xl text-zinc-500">cloud_done</span>
          <h4 className="font-bold text-white uppercase">Nothing New Needed Your Attention</h4>
          <p className="text-zinc-400 max-w-md mx-auto font-sans text-xs">
            Greenroom monitored background signal streams and found no urgent items requiring your immediate executive review.
          </p>
        </div>
      )}
    </div>
  );
}

export default WhileYouWereAwaySurface;
