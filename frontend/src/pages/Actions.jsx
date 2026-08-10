import React, { useState } from 'react';
import { CheckSquare, CheckCircle2, XCircle, Edit3, ShieldCheck, Sparkles, ArrowUpRight } from 'lucide-react';

export function Actions({
  activeCards,
  onApproveSponsorship,
  isExecuting,
}) {
  const pitchData = activeCards?.pitch;
  const scriptData = activeCards?.script;

  const [approvedActions, setApprovedActions] = useState(new Set());
  const [rejectedActions, setRejectedActions] = useState(new Set());

  const handleApprove = async (actionId, sponsorName) => {
    await onApproveSponsorship(sponsorName);
    setApprovedActions((prev) => new Set(prev).add(actionId));
  };

  const handleReject = (actionId) => {
    setRejectedActions((prev) => new Set(prev).add(actionId));
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/60 border border-emerald-800 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5" />
            EXECUTIVE ACTION WORKSPACE
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight mt-2">
            Pending Recommendations & Deals
          </h1>
          <p className="text-sm text-slate-400">
            Greenroom operates autonomously, surfacing high-confidence actions for executive signoff.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl font-bold">
            2 Pending Actions Queue
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Action 1: Sponsorship Outreach Pitch */}
        <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl space-y-5 shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950 border border-emerald-800 px-3 py-1 rounded-full">
              Sponsorship Outreach Pitch
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-900">
              Confidence: {(pitchData?.match_score ? pitchData.match_score * 100 : 89).toFixed(0)}%
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">
              Pitch Brief for {pitchData?.sponsor_name || 'TechBrand Inc.'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Calculated target deal size: <strong className="text-emerald-400">${pitchData?.target_deal_size || '5,400'}</strong> ($45 CPM Benchmark).
            </p>
          </div>

          {/* WHAT / WHY / EVIDENCE / CONFIDENCE */}
          <div className="space-y-2 text-xs font-sans">
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-500 block uppercase font-mono">WHAT</span>
              <p className="text-slate-200 mt-0.5">Integrate {pitchData?.sponsor_name || 'TechBrand Inc.'} as native developer infrastructure in upcoming workflow tutorial.</p>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-500 block uppercase font-mono">EVIDENCE & CITATIONS</span>
              <p className="text-slate-300 mt-0.5">Evaluated against 30-day viewer retention metrics & developer audience demographic profile.</p>
            </div>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-mono text-slate-300 max-h-36 overflow-y-auto">
            {pitchData?.pitch_draft || 'Hey TechBrand Inc. team,\n\nOur technical viewers are software engineers actively seeking developer tools. Let\'s showcase TechBrand Inc. in our upcoming tutorial.'}
          </div>

          {/* Status State Badge */}
          {approvedActions.has('pitch') ? (
            <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs font-bold rounded-xl flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> APPROVED & EXECUTED
            </div>
          ) : rejectedActions.has('pitch') ? (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-400 text-xs font-bold rounded-xl flex items-center justify-center gap-2">
              <XCircle className="w-4 h-4" /> ACTION REJECTED
            </div>
          ) : (
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleApprove('pitch', pitchData?.sponsor_name || 'TechBrand Inc.')}
                disabled={isExecuting}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve & Execute
              </button>
              <button
                onClick={() => handleReject('pitch')}
                disabled={isExecuting}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-xl text-xs font-bold transition border border-slate-800 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          )}
        </div>

        {/* Action 2: Creative Strategy Recommendation */}
        <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl space-y-5 shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950 border border-cyan-800 px-3 py-1 rounded-full">
              Creative Strategy Directive
            </span>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-900">
              Confidence: 95%
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">
              {scriptData?.trend_name || 'Beginner AI Workflows & Automation'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Target Hook: Practical 3-step setup guide for open-source AI agents.
            </p>
          </div>

          <div className="space-y-2 text-xs font-sans">
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-500 block uppercase font-mono">WHY GREENROOM RECOMMENDS THIS</span>
              <p className="text-slate-300 mt-0.5">Scout Mind flagged trend volume at 145k discussions/day while Community Mind confirmed 88% demand for local code setups.</p>
            </div>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-mono text-slate-300 max-h-36 overflow-y-auto whitespace-pre-wrap">
            {scriptData?.script_concept || '⚡ SCRIPT CONCEPT: Beginner AI Workflows\n\n[HOOK - 0:00-0:10]\nStop wasting hours configuring local pipelines. 3 steps to launch today.'}
          </div>

          {approvedActions.has('script') ? (
            <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs font-bold rounded-xl flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> APPROVED FOR PRODUCTION
            </div>
          ) : (
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setApprovedActions((prev) => new Set(prev).add('script'))}
                disabled={isExecuting}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve Script Concept
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
