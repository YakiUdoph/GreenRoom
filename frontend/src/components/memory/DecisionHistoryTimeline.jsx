import React from 'react';
import { motion } from 'framer-motion';

export function DecisionHistoryTimeline({ memoryState }) {
  const history = memoryState?.decision_history || [
    {
      id: "dec_3",
      date: "Aug 10",
      action_type: "REJECTED_CLICKBAIT",
      item_name: "Sensationalist AI Hype Trend",
      decision: "Rejected recommendation: 'Too clickbait. That's not how I want to grow.'",
      constraint_extracted: "Avoid clickbait-driven trends; enforce punchy technical clarity."
    },
    {
      id: "dec_2",
      date: "Aug 8",
      action_type: "APPROVED_STRATEGY",
      item_name: "Beginner AI Workflows & Automation Tutorial",
      decision: "Approved strategy based on 78% viewer retention benchmark at 30 seconds.",
      constraint_extracted: "Prioritize step-by-step setup guides over broad news recaps."
    },
    {
      id: "dec_1",
      date: "Aug 5",
      action_type: "REJECTED_SPONSORSHIP",
      item_name: "Web3 Trading Protocol Sponsor Pitch",
      decision: "Rejected pitch because it didn't fit developer audience profile.",
      constraint_extracted: "Avoid crypto trading sponsorships; focus on native developer SDKs."
    }
  ];

  return (
    <div className="noir-card p-6 bg-[#0e1014]/90 border border-primary-fixed/30 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-outline-variant/60 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary-fixed text-xl">history_edu</span>
            <span className="font-mono text-xs text-primary-fixed uppercase tracking-widest font-bold bg-[#142616] px-3 py-0.5 rounded border border-[#234d28]">
              DECISION INTELLIGENCE • PAST DECISION HISTORY
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-display font-bold text-white uppercase tracking-tight">
            Greenroom Remembers What You Decided, Not Just What You Like
          </h2>
          <p className="text-xs font-sans text-zinc-300 mt-1 font-medium">
            Chronological audit log of past creator approvals and rejections used by Greenroom Core to reason against new opportunities.
          </p>
        </div>

        <span className="font-mono text-[10px] text-emerald-400 font-bold bg-[#142616] px-2.5 py-1 rounded border border-[#234d28] whitespace-nowrap">
          {history.length} DECISIONS LOGGED
        </span>
      </div>

      {/* Decision Intelligence Cross-Reasoning Highlight */}
      <div className="p-4 bg-[#142616] border border-[#234d28] rounded-xl flex items-center gap-3 font-mono text-xs shadow-md">
        <span className="material-symbols-outlined text-primary-fixed text-xl">psychology</span>
        <div className="space-y-0.5">
          <span className="text-primary-fixed font-bold block uppercase text-[10px] tracking-wider">
            ACTIVE CHIEF OF STAFF DECISION REASONING:
          </span>
          <p className="text-zinc-200 font-medium">
            "Greenroom reasons: <strong className="text-white">'This new opportunity is similar to the sponsorship you rejected on Aug 5 due to audience mismatch, so it was filtered automatically.'</strong>"
          </p>
        </div>
      </div>

      {/* Timeline Entries */}
      <div className="space-y-4 relative border-l-2 border-outline-variant pl-4 ml-2">
        {history.map((item, idx) => {
          const isRejection = item.action_type?.includes('REJECTED');
          const badgeClass = isRejection
            ? 'bg-rose-950/80 text-rose-300 border-rose-800'
            : 'bg-[#142616] text-emerald-300 border-[#234d28]';

          return (
            <motion.div
              key={item.id || idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.05 }}
              className="relative noir-card p-4 bg-[#0a0c0e] border border-outline-variant rounded-xl space-y-2.5"
            >
              {/* Timeline Bullet */}
              <div className="absolute -left-[23px] top-4 w-3.5 h-3.5 rounded-full bg-[#111115] border-2 border-primary-fixed flex items-center justify-center shadow-[0_0_8px_#72ff70]" />

              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white bg-[#111115] px-2.5 py-0.5 rounded border border-outline-variant">
                    {item.date}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${badgeClass}`}>
                    {item.action_type.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-zinc-400 text-[11px] font-bold">ID: #{item.id}</span>
              </div>

              <h4 className="text-sm font-sans font-bold text-white">{item.item_name}</h4>

              <div className="p-3 bg-[#111115] rounded border border-outline-variant/60 font-mono text-xs space-y-1.5">
                <div className="text-zinc-300">
                  <strong className="text-zinc-400 uppercase text-[10px] block">CREATOR DECISION:</strong>
                  {item.decision}
                </div>
                <div className="text-primary-fixed pt-1 border-t border-outline-variant/40">
                  <strong className="text-emerald-400 uppercase text-[10px] block">EXTRACTED PERSISTENT RULE:</strong>
                  "{item.constraint_extracted}"
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default DecisionHistoryTimeline;
