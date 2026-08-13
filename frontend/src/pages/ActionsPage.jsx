import React, { useState } from 'react';
import { api } from '../lib/api';
import { soundFx } from '../lib/sound';

export function ActionsPage({ activeCards, onApproveSponsorship, isExecuting }) {
  const pitchData = activeCards?.pitch;
  const scriptData = activeCards?.script;

  const [approvedActions, setApprovedActions] = useState(new Set());
  const [rejectedActions, setRejectedActions] = useState(new Set());
  const [rejectionModalItem, setRejectionModalItem] = useState(null);
  const [selectedReason, setSelectedReason] = useState('Too clickbait');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [isSubmittingRejection, setIsSubmittingRejection] = useState(false);

  const handleApprovePitch = async (actionId, sponsorName) => {
    soundFx.playSuccessChime();
    if (onApproveSponsorship) {
      await onApproveSponsorship(sponsorName);
    }
    setApprovedActions((prev) => new Set(prev).add(actionId));
  };

  const handleConfirmRejection = async () => {
    if (!rejectionModalItem) return;
    setIsSubmittingRejection(true);
    try {
      soundFx.playSynapsePulse();
      await api.rejectAction(rejectionModalItem, selectedReason, rejectionNotes);
      setRejectedActions((prev) => new Set(prev).add(rejectionModalItem));
      setRejectionModalItem(null);
      setRejectionNotes('');
    } catch (err) {
      console.error('[ActionsPage] Rejection submit error:', err);
    } finally {
      setIsSubmittingRejection(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-10 space-y-8 max-w-container-max mx-auto text-white font-sans">
      {/* Header */}
      <div className="border-b border-[#72ff70]/30 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary-fixed text-2xl">bolt</span>
            <span className="font-mono text-xs text-primary-fixed uppercase tracking-widest font-bold bg-[#142616] px-3 py-0.5 rounded border border-[#234d28]">
              EXECUTIVE ACTION WORKSPACE
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white uppercase tracking-tight">
            Pending Recommendations & Proposals
          </h1>
          <p className="text-xs md:text-sm font-sans text-zinc-200 mt-1 font-medium">
            Greenroom operates autonomously, surfacing high-confidence actions for executive signoff and learning from your feedback.
          </p>
        </div>

        <div className="px-3.5 py-1.5 bg-[#142616] border border-[#234d28] rounded font-mono text-xs text-primary-fixed font-bold">
          2 PENDING EXECUTIVE ACTIONS
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Action Card 1: Sponsorship Outreach Pitch */}
        <div className="noir-card p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-outline-variant/60 pb-3">
              <span className="font-mono text-xs font-bold text-primary-fixed uppercase tracking-wider bg-[#142616] px-2.5 py-0.5 rounded border border-[#234d28]">
                Sponsorship Outreach Pitch
              </span>
              <span className="font-mono text-xs font-bold text-primary-fixed bg-[#142616] px-2.5 py-0.5 rounded border border-[#234d28]">
                Match Confidence: {(pitchData?.match_score ? pitchData.match_score * 100 : 89).toFixed(0)}%
              </span>
            </div>

            <div>
              <h3 className="text-xl font-display font-bold text-white">
                Pitch Brief for {pitchData?.sponsor_name || 'TechBrand Inc.'}
              </h3>
              <p className="font-mono text-xs text-zinc-300 mt-1">
                Calculated target deal size: <strong className="text-primary-fixed">${pitchData?.target_deal_size || '5,400'}</strong> ($45 CPM Benchmark).
              </p>
            </div>

            <div className="space-y-2.5 font-sans text-xs">
              <div className="p-3 bg-[#0a0c0e] rounded border border-outline-variant space-y-1">
                <span className="font-mono text-[10px] font-bold text-primary-fixed block uppercase">WHAT</span>
                <p className="text-zinc-200 font-medium">Integrate {pitchData?.sponsor_name || 'TechBrand Inc.'} as native developer infrastructure in upcoming workflow tutorial.</p>
              </div>

              <div className="p-3 bg-[#0a0c0e] rounded border border-outline-variant space-y-1">
                <span className="font-mono text-[10px] font-bold text-amber-400 block uppercase">EVIDENCE & CITATIONS</span>
                <p className="text-zinc-200 font-medium">Evaluated against 30-day viewer retention metrics & developer audience demographic profile.</p>
              </div>
            </div>

            <div className="p-3 bg-[#0a0c0e] border border-outline-variant rounded font-mono text-xs text-zinc-300 max-h-32 overflow-y-auto leading-relaxed shadow-inner">
              {pitchData?.pitch_draft || 'Hey TechBrand Inc. team,\n\nOur technical viewers are software engineers actively seeking developer tools. Let\'s showcase TechBrand Inc. in our upcoming tutorial.'}
            </div>
          </div>

          {approvedActions.has('pitch') ? (
            <div className="p-3 bg-[#142616] border border-[#234d28] text-primary-fixed font-mono text-xs font-bold rounded text-center shadow-lg">
              ✓ APPROVED & EXECUTED
            </div>
          ) : rejectedActions.has('pitch') ? (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 font-mono text-xs font-bold rounded text-center shadow-lg">
              ✕ REJECTED — CONSTRAINT RULE PERSISTED
            </div>
          ) : (
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleApprovePitch('pitch', pitchData?.sponsor_name || 'TechBrand Inc.')}
                disabled={isExecuting}
                className="flex-1 py-3 bg-primary-container text-on-primary-container font-mono text-xs font-bold uppercase rounded hover:bg-primary-fixed-dim transition-colors disabled:opacity-50 shadow-lg shadow-primary-container/20"
              >
                Approve & Execute Pitch
              </button>
              <button
                onClick={() => setRejectionModalItem('pitch')}
                disabled={isExecuting}
                className="px-4 py-3 bg-[#111115] border border-outline-variant text-zinc-400 font-mono text-xs font-bold uppercase rounded hover:text-white transition disabled:opacity-50"
              >
                Reject & Teach
              </button>
            </div>
          )}
        </div>

        {/* Action Card 2: Creative Strategy Recommendation */}
        <div className="noir-card p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-outline-variant/60 pb-3">
              <span className="font-mono text-xs font-bold text-primary-fixed uppercase tracking-wider bg-[#142616] px-2.5 py-0.5 rounded border border-[#234d28]">
                Creative Strategy Directive
              </span>
              <span className="font-mono text-xs font-bold text-primary-fixed bg-[#142616] px-2.5 py-0.5 rounded border border-[#234d28]">
                Confidence: 95%
              </span>
            </div>

            <div>
              <h3 className="text-xl font-display font-bold text-white">
                {scriptData?.trend_name || 'Beginner AI Workflows & Automation'}
              </h3>
              <p className="font-mono text-xs text-zinc-300 mt-1">
                Target Hook: Practical 3-step setup guide for open-source AI agents.
              </p>
            </div>

            <div className="space-y-2.5 font-sans text-xs">
              <div className="p-3 bg-[#0a0c0e] rounded border border-outline-variant space-y-1">
                <span className="font-mono text-[10px] font-bold text-primary-fixed block uppercase">WHY GREENROOM RECOMMENDS THIS</span>
                <p className="text-zinc-200 font-medium">Scout Mind flagged trend volume at 145k discussions/day while Community Mind confirmed 88% demand for local code setups.</p>
              </div>
            </div>

            <div className="p-3 bg-[#0a0c0e] border border-outline-variant rounded font-mono text-xs text-zinc-300 max-h-32 overflow-y-auto leading-relaxed shadow-inner whitespace-pre-wrap">
              {scriptData?.script_concept || 'SCRIPT CONCEPT: Beginner AI Workflows\n\n[HOOK - 0:00-0:10]\nStop wasting hours configuring local pipelines. 3 steps to launch today.'}
            </div>
          </div>

          {approvedActions.has('script') ? (
            <div className="p-3 bg-[#142616] border border-[#234d28] text-primary-fixed font-mono text-xs font-bold rounded text-center shadow-lg">
              ✓ APPROVED FOR PRODUCTION
            </div>
          ) : rejectedActions.has('script') ? (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 font-mono text-xs font-bold rounded text-center shadow-lg">
              ✕ REJECTED — CONSTRAINT RULE PERSISTED
            </div>
          ) : (
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setApprovedActions((prev) => new Set(prev).add('script'))}
                disabled={isExecuting}
                className="flex-1 py-3 bg-primary-container text-on-primary-container font-mono text-xs font-bold uppercase rounded hover:bg-primary-fixed-dim transition-colors disabled:opacity-50 shadow-lg shadow-primary-container/20"
              >
                Approve Script Concept
              </button>
              <button
                onClick={() => setRejectionModalItem('script')}
                disabled={isExecuting}
                className="px-4 py-3 bg-[#111115] border border-outline-variant text-zinc-400 font-mono text-xs font-bold uppercase rounded hover:text-white transition disabled:opacity-50"
              >
                Reject & Teach
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Rejection Feedback Dialog Modal */}
      {rejectionModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="noir-card p-6 w-full max-w-lg bg-[#0e1014] border border-rose-500/40 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-outline-variant/60 pb-3">
              <div className="flex items-center gap-2 text-rose-400">
                <span className="material-symbols-outlined text-xl">block</span>
                <h3 className="font-display text-lg font-bold text-white uppercase">
                  Why are you rejecting this recommendation?
                </h3>
              </div>
              <button onClick={() => setRejectionModalItem(null)} className="text-zinc-400 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-xs text-zinc-300 font-medium">
              Greenroom will extract a persistent constraint rule from your rejection reason so future recommendations automatically adapt.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <label className="text-zinc-300 font-bold uppercase block">Rejection Reason</label>
              <div className="space-y-1.5">
                {[
                  'Too clickbait',
                  'Wrong tone',
                  'Too commercial',
                  'Already covered',
                  'Not my audience',
                ].map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center gap-2 p-2.5 rounded border cursor-pointer transition ${
                      selectedReason === reason
                        ? 'bg-rose-950/60 border-rose-500 text-rose-200 font-bold'
                        : 'bg-[#0a0c0e] border-outline-variant text-zinc-300 hover:border-zinc-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name="rejection_reason"
                      checked={selectedReason === reason}
                      onChange={() => setSelectedReason(reason)}
                      className="accent-rose-500"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-zinc-400 uppercase text-[10px] block font-bold">Additional Specific Feedback (Optional)</label>
                <input
                  type="text"
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  placeholder="e.g. Focus purely on technical setup steps..."
                  className="w-full bg-[#0a0c0e] border border-outline-variant rounded p-2.5 text-white focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-outline-variant/60 flex justify-end gap-3">
              <button
                onClick={() => setRejectionModalItem(null)}
                className="px-4 py-2 bg-[#111115] border border-outline-variant text-zinc-400 font-mono text-xs font-bold uppercase rounded hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRejection}
                disabled={isSubmittingRejection}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold uppercase rounded transition shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
              >
                <span>{isSubmittingRejection ? 'Extracting Rule...' : 'Confirm Rejection & Teach'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActionsPage;
