import React from 'react';
import { motion } from 'framer-motion';

export function EvidenceGroundingMatrix({ memoryState, scriptData, pitchData }) {
  const learnedRules = memoryState?.learned_voice_rules || [];
  const memoryNodes = memoryState?.memory_nodes || [];
  const benchmarks = memoryState?.monetization_benchmarks || {};

  const activeRule = learnedRules.length > 0 ? learnedRules[learnedRules.length - 1] : null;
  const retentionTarget = benchmarks.retention_target_30s || benchmarks.retention_target || null;

  return (
    <div className="noir-card p-6 border-l-4 border-l-primary-fixed space-y-6 bg-[#0e1014]/90 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-outline-variant/60 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-fixed text-xl">fact_check</span>
            <span className="font-mono text-primary-fixed text-xs uppercase tracking-widest font-bold">
              FIRST-CLASS EVIDENCE MATRIX • REASONED FROM YOUR ACTUAL CONTEXT
            </span>
          </div>
          <p className="text-xs font-sans text-zinc-300 mt-1 font-medium">
            Transforms "AI generated an idea" into "The AI reasoned from your actual audience, performance, & memory context."
          </p>
        </div>

        <span className="font-mono text-[10px] text-primary-fixed font-bold bg-[#142616] px-2.5 py-1 rounded border border-[#234d28] whitespace-nowrap">
          NOT GENERIC AI HYPE
        </span>
      </div>

      {/* 5 Evidence Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono text-xs">
        
        {/* 1. AUDIENCE */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-3.5 bg-[#0a0c0e] rounded-xl border border-outline-variant space-y-2 flex flex-col justify-between"
        >
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase text-primary-fixed flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">radar</span> AUDIENCE
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 block font-bold uppercase">RECENT QUESTIONS</span>
            <p className="text-zinc-200 text-[11px] leading-relaxed font-medium">
              "{memoryState?.audience_description || 'No audience evidence loaded yet.'}"
            </p>
          </div>
          <span className="text-[9px] text-zinc-500 block uppercase font-bold pt-1 border-t border-outline-variant/40">
            Source: Creator Profile Context
          </span>
        </motion.div>

        {/* 2. CONTENT */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-3.5 bg-[#0a0c0e] rounded-xl border border-outline-variant space-y-2 flex flex-col justify-between"
        >
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase text-cyan-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">analytics</span> CONTENT
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 block font-bold uppercase">PERFORMANCE BENCHMARK</span>
            <p className="text-zinc-200 text-[11px] leading-relaxed font-medium">
              {retentionTarget ? `Targeting ${retentionTarget}% viewer retention at the recorded benchmark.` : 'No performance benchmark loaded yet.'}
            </p>
          </div>
          <span className="text-[9px] text-zinc-500 block uppercase font-bold pt-1 border-t border-outline-variant/40">
            Source: Retention Benchmark Target
          </span>
        </motion.div>

        {/* 3. SCOUT */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-3.5 bg-[#0a0c0e] rounded-xl border border-outline-variant space-y-2 flex flex-col justify-between"
        >
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase text-emerald-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">trending_up</span> SCOUT
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 block font-bold uppercase">DISCOVERED SIGNAL</span>
            <p className="text-zinc-200 text-[11px] leading-relaxed font-medium">
              {scriptData?.trend_name ? `Scout Mind surfaced "${scriptData.trend_name}".` : 'No completed Scout result loaded yet.'}
            </p>
          </div>
          <span className="text-[9px] text-zinc-500 block uppercase font-bold pt-1 border-t border-outline-variant/40">
            Source: Scout Mind Signal Provider
          </span>
        </motion.div>

        {/* 4. MEMORY */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-3.5 bg-[#0a0c0e] rounded-xl border border-outline-variant space-y-2 flex flex-col justify-between"
        >
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase text-amber-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">psychology</span> MEMORY
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 block font-bold uppercase">CREATOR PREFERENCE</span>
            <p className="text-zinc-200 text-[11px] leading-relaxed font-medium">
              "{activeRule || 'No explicit creator preference learned yet.'}"
            </p>
          </div>
          <span className="text-[9px] text-zinc-500 block uppercase font-bold pt-1 border-t border-outline-variant/40">
            Source: creator_profile.json
          </span>
        </motion.div>

        {/* 5. COMMUNITY */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-3.5 bg-[#0a0c0e] rounded-xl border border-outline-variant space-y-2 flex flex-col justify-between"
        >
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase text-purple-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">groups</span> COMMUNITY
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 block font-bold uppercase">AUDIENCE EVIDENCE</span>
            <p className="text-zinc-200 text-[11px] leading-relaxed font-medium">
              {memoryState?.community_evidence || 'No completed Community result loaded yet.'}
            </p>
          </div>
          <span className="text-[9px] text-zinc-500 block uppercase font-bold pt-1 border-t border-outline-variant/40">
            Source: Community Mind Stream
          </span>
        </motion.div>
      </div>

      {/* GREENROOM'S CONCLUSION & EXECUTABLE DIRECTIVE */}
      <div className="p-4 bg-[#142616] border border-[#234d28] rounded-xl space-y-2 shadow-inner">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-fixed text-lg">gavel</span>
            <span className="font-mono text-xs font-bold text-primary-fixed uppercase tracking-wider">
              GREENROOM'S SYNTHESIZED CONCLUSION & DIRECTIVE
            </span>
          </div>
          <span className="font-mono text-[10px] text-emerald-400 font-bold bg-[#111115] px-2 py-0.5 rounded border border-[#234d28]">
            {scriptData || pitchData ? 'DERIVED FROM AVAILABLE CONTEXT' : 'WAITING FOR COMPLETED RUN'}
          </span>
        </div>
        <p className="text-white font-sans text-sm font-bold leading-relaxed">
          {scriptData?.script_concept || (pitchData
            ? `Review the completed opportunity for ${pitchData.sponsor_name || 'the matched sponsor'} against the recorded creator constraints.`
            : 'A grounded directive will appear only after Greenroom completes a real background run.')}
        </p>
      </div>
    </div>
  );
}

export default EvidenceGroundingMatrix;
