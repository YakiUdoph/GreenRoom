import React, { useState } from 'react';
import { motion } from 'framer-motion';

export function StateStoreInspector({ memoryState }) {
  const [copied, setCopied] = useState(false);
  const state = memoryState || {};

  const creatorName = state.creator_name || 'Alex Rivera';
  const niche = state.niche || 'Developer Tools & AI Automation';
  const voiceAttrs = state.brand_voice_attributes || [];
  const learnedRules = state.learned_voice_rules || [];
  const rejected = state.rejected_topics || [];
  const benchmarks = state.monetization_benchmarks || {};
  const memoryNodes = state.memory_nodes || [];

  const handleCopyJSON = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(state, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[StateStoreInspector] Copy error:', err);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="noir-card p-6 flex flex-col space-y-4 shadow-2xl border border-primary-fixed/40 bg-[#0e1014]/95 backdrop-blur-md relative z-10"
    >
      <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary-fixed animate-pulse shadow-[0_0_8px_#72ff70]" />
          <h2 className="text-base font-display font-bold text-white uppercase tracking-tight">Persistent State Store</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyJSON}
            className="px-2.5 py-0.5 bg-[#111115] hover:bg-primary-container hover:text-on-primary-container text-zinc-300 rounded border border-outline-variant text-[10px] font-mono font-bold transition flex items-center gap-1"
            title="Copy Raw State JSON to Clipboard"
          >
            <span className="material-symbols-outlined text-xs">content_copy</span>
            <span>{copied ? 'COPIED!' : 'COPY JSON'}</span>
          </button>
          <span className="text-[10px] text-primary-fixed font-mono font-bold bg-[#142616] px-2.5 py-0.5 rounded border border-[#234d28]">
            creator_profile.json
          </span>
        </div>
      </div>

      <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[580px] pr-1 font-mono text-xs">
        {/* Creator Profile Card */}
        <div className="p-3.5 bg-[#0a0c0e] rounded border border-outline-variant/80 space-y-1.5 shadow-sm">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
            Creator Identity
          </span>
          <p className="text-sm text-white font-bold">{creatorName}</p>
          <p className="text-[11px] text-cyan-400 font-semibold">{niche}</p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {voiceAttrs.map((v, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-[#111115] text-primary-fixed rounded text-[10px] border border-[#234d28] font-bold"
              >
                ✓ {v}
              </span>
            ))}
          </div>
        </div>

        {/* Learned Voice Rules */}
        <div className="p-3.5 bg-[#142616]/30 border border-[#234d28] rounded space-y-2 shadow-inner">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              Learned Voice Rules
            </span>
            <span className="text-[10px] text-primary-fixed font-bold bg-[#142616] px-2 py-0.5 rounded border border-[#234d28]">
              {learnedRules.length} Active
            </span>
          </div>
          <div className="space-y-1.5 text-xs text-amber-200/90 font-medium">
            {learnedRules.length === 0 ? (
              <p className="text-zinc-500 italic text-[11px]">
                No feedback rules learned yet. Submit feedback in Memory page to test context adaptation.
              </p>
            ) : (
              learnedRules.map((rule, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-amber-950/40 border border-amber-800/60 rounded text-amber-200 text-[11px] font-sans flex items-start gap-1.5 shadow-sm font-medium"
                >
                  <span className="material-symbols-outlined text-xs text-amber-400 flex-shrink-0 mt-0.5">check_circle</span>
                  <span>{rule}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Scout Filter (Rejected Topics / Constraints) */}
        <div className="p-3.5 bg-[#0a0c0e] rounded border border-outline-variant/80 space-y-1.5">
          <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block">
            Constraints & Rejected Topics
          </span>
          <div className="space-y-1 text-zinc-300 text-[11px]">
            {rejected.map((r, i) => (
              <div key={i} className="p-1.5 bg-rose-950/40 border border-rose-900/60 text-rose-200 rounded font-bold text-[11px] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs text-rose-400">block</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Business Benchmarks */}
        <div className="p-3.5 bg-[#0a0c0e] rounded border border-outline-variant/80 space-y-1.5">
          <span className="text-[10px] text-primary-fixed font-bold uppercase tracking-wider block">
            Business Benchmarks
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-[#111115] rounded border border-outline-variant">
              <span className="text-[10px] text-zinc-400 block font-bold">Target CPM</span>
              <span className="font-bold text-primary-fixed">
                ${benchmarks.cpm_target || 45}
              </span>
            </div>
            <div className="p-2 bg-[#111115] rounded border border-outline-variant">
              <span className="text-[10px] text-zinc-400 block font-bold">Min Deal</span>
              <span className="font-bold text-white">
                ${benchmarks.minimum_deal_size ? benchmarks.minimum_deal_size.toLocaleString() : '5,000'}
              </span>
            </div>
          </div>
        </div>

        {/* Memory Store Nodes */}
        <div className="p-3.5 bg-[#0a0c0e] rounded border border-outline-variant/80 space-y-2">
          <span className="text-[10px] text-primary-fixed font-bold uppercase tracking-wider block">
            Memory Store Nodes
          </span>
          <div className="space-y-2 text-xs">
            {memoryNodes.length === 0 ? (
              <p className="text-zinc-500 italic text-[11px]">No persistent memory nodes stored.</p>
            ) : (
              memoryNodes.slice(-3).map((node, i) => (
                <div key={node.node_id || i} className="p-2 bg-[#111115] border border-outline-variant rounded text-[11px]">
                  <span className="text-[9px] font-bold uppercase text-primary-fixed bg-[#142616] px-1.5 py-0.5 rounded border border-[#234d28]">
                    {node.type || 'node'}
                  </span>
                  <p className="mt-1 text-zinc-300 leading-snug">{node.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export default StateStoreInspector;
