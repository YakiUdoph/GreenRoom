import React, { useState } from 'react';

export function ActionsPage({ activeCards, onApproveSponsorship, isExecuting }) {
  const pitchData = activeCards?.pitch;
  const scriptData = activeCards?.script;
  const [approved, setApproved] = useState(false);

  const handleApprove = async () => {
    await onApproveSponsorship(pitchData?.sponsor_name || 'TechBrand Inc.');
    setApproved(true);
  };

  return (
    <div className="flex-1 p-8 md:p-12 space-y-12 max-w-container-max mx-auto text-on-background">
      <div className="border-b border-outline-variant pb-8 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary-fixed">bolt</span>
            <span className="font-mono text-xs text-primary-fixed uppercase tracking-widest font-bold">
              EXECUTIVE ACTION WORKSPACE
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-on-surface uppercase">
            Pending Recommendations & Proposals
          </h1>
          <p className="text-sm font-sans text-on-surface-variant mt-2">
            Greenroom operates autonomously, surfacing high-confidence actions for executive signoff.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Action Card 1 */}
        <div className="bg-surface-container-low border border-outline-variant p-8 rounded space-y-6">
          <div className="flex justify-between items-center border-b border-outline-variant pb-4">
            <span className="font-mono text-xs font-bold text-primary-fixed uppercase tracking-wider">
              SPONSORSHIP OUTREACH PITCH
            </span>
            <span className="font-mono text-xs font-bold text-primary-fixed bg-background px-3 py-1 rounded border border-outline-variant">
              MATCH: 89%
            </span>
          </div>

          <h3 className="text-xl font-sans font-bold text-on-surface">
            Pitch Brief for {pitchData?.sponsor_name || 'TechBrand Inc.'}
          </h3>

          <div className="p-4 bg-background border border-outline-variant rounded font-mono text-xs text-on-surface-variant max-h-36 overflow-y-auto leading-relaxed">
            {pitchData?.pitch_draft || 'Drafted via Business Mind skill score_deal for TechBrand Inc.'}
          </div>

          {approved ? (
            <div className="p-4 bg-background border border-primary-fixed text-primary-fixed text-xs font-mono font-bold rounded text-center flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">check_circle</span> APPROVED & EXECUTED
            </div>
          ) : (
            <button
              onClick={handleApprove}
              disabled={isExecuting}
              className="w-full py-4 bg-primary-container text-on-primary-container font-mono text-xs font-bold uppercase rounded hover:bg-primary-fixed-dim transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
            >
              <span>Approve & Execute Pitch</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          )}
        </div>

        {/* Action Card 2 */}
        <div className="bg-surface-container-low border border-outline-variant p-8 rounded space-y-6">
          <div className="flex justify-between items-center border-b border-outline-variant pb-4">
            <span className="font-mono text-xs font-bold text-primary-fixed uppercase tracking-wider">
              CREATIVE STRATEGY CONCEPT
            </span>
            <span className="font-mono text-xs font-bold text-primary-fixed bg-background px-3 py-1 rounded border border-outline-variant">
              CONF: 95%
            </span>
          </div>

          <h3 className="text-xl font-sans font-bold text-on-surface">
            {scriptData?.trend_name || 'Beginner AI Workflows & Automation'}
          </h3>

          <div className="p-4 bg-background border border-outline-variant rounded font-mono text-xs text-on-surface-variant max-h-36 overflow-y-auto leading-relaxed whitespace-pre-wrap">
            {scriptData?.script_concept || 'Synthesized Script Concept active in system memory.'}
          </div>
        </div>
      </div>
    </div>
  );
}
