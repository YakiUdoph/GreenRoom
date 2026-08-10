import React from 'react';
import { Check } from 'lucide-react';

export function StateStoreInspector({ memoryState }) {
  const state = memoryState || {};

  const creatorName = state.creator_name || 'Alex Rivera';
  const voiceAttrs = state.brand_voice_attributes || [];
  const learnedRules = state.learned_voice_rules || [];
  const rejected = state.rejected_topics || [];
  const benchmarks = state.monetization_benchmarks || {};
  const memoryNodes = state.memory_nodes || [];

  return (
    <section className="col-span-12 lg:col-span-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
          <h2 className="text-base font-bold text-slate-200">Persistent State Store</h2>
        </div>
        <span className="text-xs text-slate-400 font-mono">creator_profile.json</span>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto max-h-[620px] pr-1">
        {/* Creator Profile Card */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Creator Profile:
          </span>
          <p className="text-sm text-slate-100 font-bold mt-0.5">{creatorName}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {voiceAttrs.map((v, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-slate-900 text-slate-300 rounded text-[10px] border border-slate-800 font-sans"
              >
                {v}
              </span>
            ))}
          </div>
        </div>

        {/* Learned Voice Rules (Minute 5 Magic) */}
        <div className="p-3 bg-slate-950 rounded-xl border border-amber-900/50 shadow-inner">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
              Learned Rules
            </span>
            <span className="text-[10px] text-slate-500">
              {learnedRules.length} rules
            </span>
          </div>
          <div className="space-y-1.5 text-xs text-amber-200/90 font-medium">
            {learnedRules.length === 0 ? (
              <p className="text-slate-500 italic text-[11px]">
                No feedback rules learned yet. Run Minute 5 step to test proof of learning.
              </p>
            ) : (
              learnedRules.map((rule, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-amber-950/40 border border-amber-800/60 rounded-lg text-amber-200 text-[11px] font-sans flex items-start gap-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>{rule}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Rejected Topics */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">
            Scout Filter (Rejected Topics):
          </span>
          <div className="space-y-1 mt-1 text-xs text-slate-400">
            {rejected.map((r, i) => (
              <p key={i} className="text-rose-300/80">• {r}</p>
            ))}
          </div>
        </div>

        {/* Monetization Benchmarks */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
            Business Benchmarks:
          </span>
          <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
            <div className="p-2 bg-slate-900 rounded border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Target CPM</span>
              <span className="font-bold text-slate-200">
                ${benchmarks.cpm_target || 45}
              </span>
            </div>
            <div className="p-2 bg-slate-900 rounded border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Min Deal</span>
              <span className="font-bold text-slate-200">
                ${benchmarks.minimum_deal_size ? benchmarks.minimum_deal_size.toLocaleString() : '5,000'}
              </span>
            </div>
          </div>
        </div>

        {/* Memory Store Nodes */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
            Memory Store Nodes:
          </span>
          <div className="space-y-2 mt-2 text-xs">
            {memoryNodes.length === 0 ? (
              <p className="text-slate-500 italic text-[11px]">No persistent memory nodes stored.</p>
            ) : (
              memoryNodes.slice(-3).map((node, i) => (
                <div key={node.node_id || i} className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-[11px]">
                  <span className="text-[9px] font-bold uppercase text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-900">
                    {node.type || 'node'}
                  </span>
                  <p className="mt-1 text-slate-300 leading-snug">{node.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
