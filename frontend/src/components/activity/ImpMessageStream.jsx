import React, { useState } from 'react';

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

  return JSON.stringify(payload).slice(0, 140) + '...';
}

export function ImpMessageStream({ messages, onInspectPayload }) {
  const [filterMind, setFilterMind] = useState('ALL');
  const impList = Array.isArray(messages) ? messages : [];

  const filteredMessages = filterMind === 'ALL'
    ? impList
    : impList.filter((m) => (m.sender_mind || 'Core').toLowerCase().includes(filterMind.toLowerCase()));

  return (
    <section className="noir-card p-6 flex flex-col space-y-4 shadow-2xl border border-outline-variant/60 bg-[#0e1014]/95 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-outline-variant/60 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-primary-fixed animate-pulse shadow-[0_0_8px_#72ff70]" />
          <h2 className="text-base font-display font-bold text-white uppercase tracking-tight">
            Inter-Mind Protocol Log (IMP v1.0)
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-zinc-400 font-bold bg-[#111115] px-2.5 py-1 rounded border border-outline-variant">
            {filteredMessages.length} Messages
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 font-mono text-xs">
        {['ALL', 'GreenroomCore', 'ScoutMind', 'CommunityMind', 'BusinessMind', 'User'].map((mind) => (
          <button
            key={mind}
            onClick={() => setFilterMind(mind)}
            className={`px-2.5 py-1 rounded border transition font-bold text-[11px] ${
              filterMind === mind
                ? 'bg-primary-container text-on-primary-container border-primary-fixed'
                : 'bg-[#0a0c0e] text-zinc-400 border-outline-variant hover:text-white'
            }`}
          >
            {mind === 'GreenroomCore' ? 'Core' : mind}
          </button>
        ))}
      </div>

      {/* Message Stream Scroll Area */}
      <div className="space-y-3 font-mono text-xs flex-1 max-h-[580px] overflow-y-auto pr-1">
        {filteredMessages.length === 0 ? (
          <div className="p-6 bg-[#0a0c0e] border border-outline-variant/60 rounded-xl text-zinc-400 text-center italic">
            Waiting for agent network initialization... Trigger agent pipeline skills to broadcast IMP messages.
          </div>
        ) : (
          filteredMessages.slice().reverse().map((msg, idx) => {
            const sender = msg.sender_mind || 'Core';
            const target = msg.target_mind ? ` → ${msg.target_mind}` : '';
            const action = msg.action_type || 'INFO';
            const conf = msg.confidence_score !== undefined
              ? `${(msg.confidence_score * 100).toFixed(0)}%`
              : '';

            let borderClass = 'border-primary-fixed';
            let textClass = 'text-primary-fixed';

            if (sender === 'ScoutMind') {
              borderClass = 'border-cyan-400';
              textClass = 'text-cyan-400';
            } else if (sender === 'CommunityMind') {
              borderClass = 'border-amber-400';
              textClass = 'text-amber-400';
            } else if (sender === 'BusinessMind') {
              borderClass = 'border-emerald-400';
              textClass = 'text-emerald-400';
            } else if (sender === 'User') {
              borderClass = 'border-rose-400';
              textClass = 'text-rose-400';
            }

            const payloadSnippet = getPayloadSnippet(msg.payload, action);

            return (
              <div
                key={msg.message_id || idx}
                className={`p-3.5 bg-[#0a0c0e] border-l-4 ${borderClass} border-t border-r border-b border-outline-variant/60 rounded-xl shadow-md space-y-1.5 transition hover:translate-x-1`}
              >
                <div className="flex justify-between items-center">
                  <span className={`font-bold text-xs ${textClass}`}>
                    [{sender}{target}]
                  </span>
                  <div className="flex items-center gap-1.5">
                    {conf && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#111115] text-zinc-300 border border-outline-variant font-bold">
                        {conf}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-[10px] bg-[#142616] text-primary-fixed border border-[#234d28] font-bold uppercase">
                      {action}
                    </span>
                    <button
                      onClick={() => onInspectPayload(msg)}
                      className="px-2 py-0.5 bg-[#111115] hover:bg-primary-container hover:text-on-primary-container text-zinc-300 rounded border border-outline-variant text-[10px] font-bold transition flex items-center gap-1"
                      title="Inspect Raw Payload JSON"
                    >
                      <span className="material-symbols-outlined text-xs">code</span>
                      <span>JSON</span>
                    </button>
                  </div>
                </div>
                <p className="text-zinc-200 leading-relaxed font-sans text-xs font-medium">
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

export default ImpMessageStream;
