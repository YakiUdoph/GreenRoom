import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

export function PendingApprovals({
  activeCards,
  onApproveSponsorship,
  onSubmitFeedback,
  isExecuting,
}) {
  const pitchData = activeCards.pitch;
  const scriptData = activeCards.script;

  const [feedbackInput, setFeedbackInput] = useState(
    'Too formal. Make it punchier and emphasize beginner-friendly tips.'
  );
  const [pitchDraftText, setPitchDraftText] = useState('');

  useEffect(() => {
    if (pitchData && pitchData.pitch_draft) {
      setPitchDraftText(pitchData.pitch_draft);
    }
  }, [pitchData]);

  const handleModifyPitch = () => {
    const newPitch = window.prompt('Enter modifications for Business Mind pitch:', pitchDraftText);
    if (newPitch) {
      setPitchDraftText(newPitch);
    }
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (feedbackInput.trim()) {
      onSubmitFeedback(feedbackInput.trim());
    }
  };

  const matchScorePercent = pitchData && pitchData.match_score !== undefined
    ? (pitchData.match_score * 100).toFixed(0)
    : '89';

  return (
    <section className="col-span-12 lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
          <h2 className="text-base font-bold text-slate-200">Pending Agent Approvals</h2>
        </div>
        <span className="text-xs text-amber-400 font-medium px-2 py-0.5 bg-amber-950/50 border border-amber-800/60 rounded">
          Executive Queue
        </span>
      </div>

      {/* Card 1: Sponsorship Outreach */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl shadow-lg relative overflow-hidden transition-all duration-300">
        <div className="flex justify-between items-start">
          <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded">
            Sponsorship Outreach
          </span>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900">
            Match: {matchScorePercent}%
          </span>
        </div>

        <h3 className="font-bold text-slate-100 mt-2.5 text-sm">
          Pitch Draft for {pitchData?.sponsor_name || 'TechBrand Inc.'}
        </h3>
        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
          Calculated Match Score: <strong className="text-slate-200">{matchScorePercent}%</strong>. Uses 30-day retention metrics ($45 CPM benchmark) from memory store.
        </p>

        <div className="mt-3 p-3 bg-slate-900/80 rounded-lg text-xs font-mono text-slate-300 border border-slate-800/80 max-h-32 overflow-y-auto">
          {pitchDraftText || 'Run Minute 4 demo step to generate autonomous pitch proposal.'}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onApproveSponsorship(pitchData?.sponsor_name)}
            disabled={isExecuting}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition shadow-md shadow-emerald-900/20 disabled:opacity-50"
          >
            Approve & Send
          </button>
          <button
            onClick={handleModifyPitch}
            disabled={isExecuting}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition disabled:opacity-50"
          >
            Modify Pitch
          </button>
        </div>
      </div>

      {/* Card 2: Strategy & Script Concept */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl shadow-lg flex-1 flex flex-col">
        <div className="flex justify-between items-start">
          <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider bg-cyan-950/60 border border-cyan-800/80 px-2 py-0.5 rounded">
            Strategy & Script Concept
          </span>
          {scriptData?.is_punchy_voice && (
            <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-700 px-2 py-0.5 rounded animate-bounce">
              ⚡ Learned Punchy Voice
            </span>
          )}
        </div>

        <h3 className="font-bold text-slate-100 mt-2 text-sm">
          Synthesized Creative Direction
        </h3>
        <div className="mt-2.5 p-3 bg-slate-900/80 rounded-lg text-xs font-mono text-slate-300 border border-slate-800/80 flex-1 max-h-48 overflow-y-auto whitespace-pre-wrap">
          {scriptData?.script_concept || 'Run Minute 3 demo step to trigger multi-mind strategy synthesis.'}
        </div>
      </div>

      {/* Minute 5: Feedback / Proof of Learning Box */}
      <form onSubmit={handleFeedbackSubmit} className="p-3.5 bg-slate-950 border border-amber-900/40 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 fill-current" />
            Minute 5: Proof of Learning ("The Magic Moment")
          </span>
        </div>
        <p className="text-[11px] text-slate-400">
          Instruct the agent staff. Feedback updates persistent memory rules instantly for all future runs.
        </p>

        <div className="flex gap-2 pt-1">
          <input
            type="text"
            value={feedbackInput}
            onChange={(e) => setFeedbackInput(e.target.value)}
            disabled={isExecuting}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-sans"
            placeholder="Type custom voice instruction..."
          />
          <button
            type="submit"
            disabled={isExecuting}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs transition shadow-md shadow-amber-900/30 whitespace-nowrap disabled:opacity-50"
          >
            Execute & Learn
          </button>
        </div>
      </form>
    </section>
  );
}
