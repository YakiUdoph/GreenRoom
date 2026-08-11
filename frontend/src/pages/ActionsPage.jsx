import React, { useState } from 'react';
import { CheckCircle2, Zap } from 'lucide-react';

export function ActionsPage({ activeCards, onApproveSponsorship, isExecuting }) {
  const pitchData = activeCards?.pitch;
  const scriptData = activeCards?.script;
  const [approved, setApproved] = useState(false);

  const handleApprove = async () => {
    await onApproveSponsorship(pitchData?.sponsor_name || 'TechBrand Inc.');
    setApproved(true);
  };

  return (
    <div className="flex-1 p-8 md:p-10 space-y-10 max-w-[1400px]">
      <div className="flex items-start justify-between border-b border-[#18181b] pb-8">
        <div className="space-y-2">
          <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tight text-white uppercase">
            ACTIONS
          </h1>
          <p className="text-sm font-sans text-zinc-400">
            Executive Action Workspace for Recommendations & Deals.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="motion-card p-6 rounded-xl border border-[#1f1f23] space-y-4">
          <div className="flex justify-between items-center border-b border-[#18181b] pb-3">
            <span className="text-xs font-mono font-bold text-emerald-400">SPONSORSHIP OUTREACH</span>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-900">
              MATCH: 89%
            </span>
          </div>

          <h3 className="text-base font-bold text-white">
            Pitch Draft for {pitchData?.sponsor_name || 'TechBrand Inc.'}
          </h3>

          <div className="p-4 bg-[#09090b] rounded border border-[#1f1f23] text-xs font-mono text-zinc-300 max-h-36 overflow-y-auto">
            {pitchData?.pitch_draft || 'Draft created via Business Mind skill score_deal.'}
          </div>

          {approved ? (
            <div className="p-3 bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-mono font-bold rounded text-center flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> APPROVED & EXECUTED
            </div>
          ) : (
            <button
              onClick={handleApprove}
              disabled={isExecuting}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono text-xs font-bold uppercase rounded transition disabled:opacity-50"
            >
              Approve & Execute Pitch
            </button>
          )}
        </div>

        <div className="motion-card p-6 rounded-xl border border-[#1f1f23] space-y-4">
          <div className="flex justify-between items-center border-b border-[#18181b] pb-3">
            <span className="text-xs font-mono font-bold text-cyan-400">CREATIVE DIRECTIVE</span>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-900">
              CONF: 95%
            </span>
          </div>

          <h3 className="text-base font-bold text-white">
            {scriptData?.trend_name || 'Beginner AI Workflows & Automation'}
          </h3>

          <div className="p-4 bg-[#09090b] rounded border border-[#1f1f23] text-xs font-mono text-zinc-300 max-h-36 overflow-y-auto whitespace-pre-wrap">
            {scriptData?.script_concept || 'Synthesized Script Concept active.'}
          </div>
        </div>
      </div>
    </div>
  );
}
