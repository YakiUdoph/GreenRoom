import React from 'react';
import { Search } from 'lucide-react';

function getPayloadSnippet(payload, action) {
  if (!payload) return 'No payload data';
  if (payload.trend_name) {
    if (payload.status === 'REJECTED') {
      return `REJECTED trend: "${payload.trend_name}". ${payload.rejection_reason || ''}`;
    }
    return `Flagged trend: "${payload.trend_name}". Fit Score: ${payload.fit_score || 0.92}. ${payload.relevance_reason || ''}`;
  }
  if (payload.extracted_hook) return `Extracted hook: ${payload.extracted_hook}`;
  if (payload.sponsor_name) return `Generated pitch for ${payload.sponsor_name}. Calculated match score: ${payload.match_score ? (payload.match_score * 100).toFixed(0) : 89}%.`;
  if (payload.script_concept) return `Synthesized Creative Script Concept. (Punchy: ${payload.is_punchy_voice ? 'YES' : 'NO'})`;
  if (payload.extracted_learned_rule) return `PROOF OF LEARNING: Updated persistent voice rule -> "${payload.extracted_learned_rule}"`;
  if (payload.action_name) return `Action approved: "${payload.action_name}"`;

  return JSON.stringify(payload).slice(0, 120) + '...';
}

export function ImpMessageStream({ messages, onInspectPayload }) {
  const impList = Array.isArray(messages) ? messages : [];

  return (
    <section className="col-span-12 lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col shadow-xl">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400"></div>
          <h2 className="text-base font-bold text-slate-200">Inter-Mind Message Log (IMP)</h2>
        </div>
        <span className="text-xs text-slate-500 font-mono">
          {impList.length} messages
        </span>
      </div>

      <div className="space-y-3 text-xs font-mono flex-1 max-h-[620px] overflow-y-auto pr-1">
        {impList.length === 0 ? (
          <div className="p-4 bg-slate-950/60 border border-slate-800/60 rounded-xl text-slate-400 text-center italic">
            Waiting for agent network initialization... Run demo or trigger steps above.
          </div>
        ) : (
          impList.slice().reverse().map((msg) => {
            const sender = msg.sender_mind || 'Core';
            const target = msg.target_mind ? ` → ${msg.target_mind}` : '';
            const action = msg.action_type || 'INFO';
            const conf = msg.confidence_score !== undefined
              ? `${(msg.confidence_score * 100).toFixed(0)}%`
              : '';

            let borderClass = 'border-purple-500/80';
            let textClass = 'text-purple-400';

            if (sender === 'ScoutMind') {
              borderClass = 'border-cyan-500/80';
              textClass = 'text-cyan-400';
            } else if (sender === 'CommunityMind') {
              borderClass = 'border-amber-500/80';
              textClass = 'text-amber-400';
            } else if (sender === 'BusinessMind') {
              borderClass = 'border-emerald-500/80';
              textClass = 'text-emerald-400';
            } else if (sender === 'User') {
              borderClass = 'border-pink-500/80';
              textClass = 'text-pink-400';
            }

            const payloadSnippet = getPayloadSnippet(msg.payload, action);

            return (
              <div
                key={msg.message_id || Math.random()}
                className={`p-3 bg-slate-950 border-l-2 ${borderClass} rounded-xl shadow transition hover:border-l-4`}
              >
                <div className="flex justify-between items-center">
                  <span className={`font-bold ${textClass}`}>
                    [{sender}{target}]
                  </span>
                  <div className="flex items-center gap-1.5">
                    {conf && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 text-slate-400 border border-slate-800">
                        {conf}
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 text-slate-300 font-sans uppercase">
                      {action}
                    </span>
                    <button
                      onClick={() => onInspectPayload(msg)}
                      className="text-slate-500 hover:text-slate-300 ml-1 p-0.5"
                      title="View raw JSON"
                    >
                      <Search className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <p className="mt-1.5 text-slate-300 leading-relaxed font-sans text-xs">
                  {payloadSnippet}
                </p>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
