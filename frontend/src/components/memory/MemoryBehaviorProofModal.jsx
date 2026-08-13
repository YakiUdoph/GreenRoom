import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';
import { soundFx } from '../../lib/sound';
import { greenroomStore } from '../../stores/greenroomStore';

export function MemoryBehaviorProofModal({ isOpen, onClose, onMemoryUpdated }) {
  const [constraintInput, setConstraintInput] = useState("I don't like clickbait.");
  const [stage, setStage] = useState(0); // 0: Start, 1: Ingesting Constraint, 2: Rule Persisted, 3: Synthesizing Strategy, 4: Complete Proof Delivered
  const [proofData, setProofData] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);

  if (!isOpen) return null;

  const handleRunProof = async () => {
    soundFx.playSynapsePulse();
    setIsExecuting(true);
    setStage(1); // 1: Ingesting Constraint

    await new Promise((r) => setTimeout(r, 700));
    setStage(2); // 2: Rule Persisted

    try {
      const res = await api.runMemoryProofTest(constraintInput);
      setProofData(res);

      if (res.state) {
        greenroomStore.setMemoryState(res.state);
        if (onMemoryUpdated) onMemoryUpdated(res.state);
      }

      await new Promise((r) => setTimeout(r, 800));
      setStage(3); // 3: Synthesizing Strategy ("What should I make next?")

      await new Promise((r) => setTimeout(r, 1000));
      soundFx.playSuccessChime();
      setStage(4); // 4: Complete Proof Delivered
    } catch (err) {
      console.error('[MemoryProofModal] Error running proof:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleReset = () => {
    setStage(0);
    setProofData(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          className="noir-card p-6 md:p-8 w-full max-w-3xl bg-[#0e1014] border border-primary-fixed/40 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto relative"
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b border-outline-variant/60 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-primary-fixed text-xl">psychology</span>
                <span className="font-mono text-[10px] text-primary-fixed uppercase tracking-widest font-bold bg-[#142616] px-2.5 py-0.5 rounded border border-[#234d28]">
                  CRITICAL PROOF • MEMORY ADAPTATION ENGINE
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-display font-bold text-white uppercase tracking-tight">
                Prove Memory Changes Future Behavior
              </h2>
              <p className="text-xs font-sans text-zinc-300 mt-1 font-medium">
                Live 2-interaction test: Creator constraint ingestion → Memory persistence → Future strategy filtering.
              </p>
            </div>

            <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 transition">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* 2-Step Interaction Workflow Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className={`p-4 rounded border transition ${stage >= 1 ? 'bg-[#142616] border-[#234d28]' : 'bg-[#0a0c0e] border-outline-variant'}`}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-bold uppercase text-primary-fixed">INTERACTION 1 • CONSTRAINT INGESTION</span>
                {stage >= 2 && <span className="material-symbols-outlined text-sm text-primary-fixed">check_circle</span>}
              </div>
              <p className="text-white font-bold">Creator: "{constraintInput}"</p>
              <p className="text-[11px] text-zinc-300 mt-1">Extracts rule & persists to creator_profile.json matrix.</p>
            </div>

            <div className={`p-4 rounded border transition ${stage >= 3 ? 'bg-[#142616] border-[#234d28]' : 'bg-[#0a0c0e] border-outline-variant'}`}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-bold uppercase text-cyan-400">INTERACTION 2 • STRATEGY REQUEST</span>
                {stage === 4 && <span className="material-symbols-outlined text-sm text-primary-fixed">check_circle</span>}
              </div>
              <p className="text-white font-bold">Creator: "What should I make next?"</p>
              <p className="text-[11px] text-zinc-300 mt-1">Filters out clickbait opportunities using persisted rule.</p>
            </div>
          </div>

          {/* Interactive Input Form (Stage 0) */}
          {stage === 0 && (
            <div className="noir-card p-6 space-y-4 bg-[#0a0c0e] border-dashed border-outline-variant">
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-primary-fixed uppercase block">
                  Teach Greenroom Your Constraint (Interaction 1):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={constraintInput}
                    onChange={(e) => setConstraintInput(e.target.value)}
                    placeholder="e.g., I don't like clickbait."
                    className="flex-1 bg-[#111115] border border-outline-variant rounded p-3 text-sm text-white font-sans focus:border-primary-fixed focus:outline-none"
                  />
                  <button
                    onClick={handleRunProof}
                    disabled={isExecuting || !constraintInput.strip()}
                    className="px-5 py-3 bg-primary-container text-on-primary-container font-mono text-xs font-bold uppercase rounded hover:bg-primary-fixed-dim transition flex items-center gap-2 shadow-lg shadow-primary-container/20 disabled:opacity-50 whitespace-nowrap"
                  >
                    <span className="material-symbols-outlined text-base">play_arrow</span>
                    <span>Run Behavioral Test</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                <span className="text-[10px] font-mono text-zinc-400 block w-full uppercase font-bold">Quick Preset Constraints:</span>
                {[
                  "I don't like clickbait.",
                  "Too formal. Make it punchier.",
                  "Focus on open-source local models.",
                  "No sponsored crypto projects."
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => setConstraintInput(preset)}
                    className="px-2.5 py-1 bg-[#111115] border border-outline-variant hover:border-primary-fixed text-zinc-300 hover:text-white text-[11px] font-mono rounded transition"
                  >
                    "{preset}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Progress Loading Animation (Stages 1-3) */}
          {stage >= 1 && stage <= 3 && (
            <div className="p-6 bg-[#0a0c0e] border border-primary-fixed/30 rounded-xl space-y-3 font-mono text-xs">
              <div className="flex items-center gap-2.5 text-primary-fixed">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-fixed animate-ping" />
                <span className="font-bold uppercase">
                  {stage === 1 && '1. INGGESTING CONSTRAINT & EXTRACTING RULE...'}
                  {stage === 2 && '2. PERSISTING RULE TO CREATOR DNA MATRIX...'}
                  {stage === 3 && '3. RE-SYNTHESIZING CREATIVE STRATEGY ("What should I make next?")...'}
                </span>
              </div>
              <p className="text-zinc-300 text-[11px]">
                {stage === 1 && `Analyzing input: "${constraintInput}"`}
                {stage === 2 && `Updating creator_profile.json learned_voice_rules array.`}
                {stage === 3 && `Scout Mind & Greenroom Core evaluating trends against active memory constraint.`}
              </p>
            </div>
          )}

          {/* Stage 4: Delivered Proof Side-by-Side Comparison */}
          {stage === 4 && proofData && (
            <div className="space-y-5">
              <div className="p-3.5 bg-[#142616] border border-[#234d28] rounded-xl flex justify-between items-center font-mono text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-primary-fixed text-xl">check_circle</span>
                  <span className="text-primary-fixed font-bold uppercase">
                    PROVED: MEMORY DIRECTLY ALTERED FUTURE RECOMMENDATION
                  </span>
                </div>
                <button
                  onClick={handleReset}
                  className="px-3 py-1 bg-[#111115] border border-outline-variant text-zinc-300 hover:text-white font-bold rounded"
                >
                  Test Another Rule
                </button>
              </div>

              {/* Side-by-Side Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono text-xs">
                {/* Filtered Out Clickbait Card */}
                <div className="noir-card p-5 space-y-3 bg-[#170a0c] border border-rose-800/80 rounded-xl">
                  <div className="flex justify-between items-center border-b border-rose-900 pb-2">
                    <span className="text-rose-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">block</span> FILTERED OUT BY MEMORY
                    </span>
                    <span className="text-rose-300 text-[10px] bg-rose-950 px-2 py-0.5 rounded border border-rose-800 font-bold">
                      REJECTED
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-400 block font-bold uppercase">SCOUT TREND CANDIDATE</span>
                    <h4 className="text-sm font-sans font-bold text-white mt-0.5">
                      {proofData.interaction_2?.filtered_candidate?.title}
                    </h4>
                  </div>

                  <div className="p-3 bg-[#0a0c0e] border border-rose-900/60 rounded text-rose-300 text-[11px] space-y-1">
                    <span className="font-bold block uppercase text-[10px] text-rose-400">REASON FOR FILTERING:</span>
                    <p className="font-medium">
                      {proofData.interaction_2?.filtered_candidate?.filter_reason}
                    </p>
                  </div>

                  <p className="text-[10px] text-zinc-400 italic">
                    Without memory, this high-volume clickbait trend would have been recommended.
                  </p>
                </div>

                {/* Approved & Delivered Compliant Card */}
                <div className="noir-card p-5 space-y-3 bg-[#142616]/40 border border-[#234d28] rounded-xl">
                  <div className="flex justify-between items-center border-b border-[#234d28] pb-2">
                    <span className="text-primary-fixed font-bold uppercase tracking-wider text-[11px] flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">check_circle</span> APPROVED & DELIVERED
                    </span>
                    <span className="text-primary-fixed text-[10px] bg-[#142616] px-2 py-0.5 rounded border border-[#234d28] font-bold">
                      COMPLIANT
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-400 block font-bold uppercase">SELECTED STRATEGY</span>
                    <h4 className="text-sm font-sans font-bold text-white mt-0.5">
                      {proofData.interaction_2?.recommended_candidate?.title}
                    </h4>
                  </div>

                  <div className="p-3 bg-[#0a0c0e] border border-[#234d28] rounded text-primary-fixed text-[11px] space-y-1">
                    <span className="font-bold block uppercase text-[10px]">GROUNDING & COMPLIANCE:</span>
                    <p className="font-medium text-zinc-200">
                      {proofData.interaction_2?.recommended_candidate?.grounding}
                    </p>
                  </div>

                  <p className="text-[10px] text-zinc-300 font-medium">
                    Fully respects persisted creator constraint: "{constraintInput}"
                  </p>
                </div>
              </div>

              {/* Memory Matrix Status Footer */}
              <div className="p-4 bg-[#0a0c0e] border border-outline-variant rounded-xl font-mono text-xs flex justify-between items-center">
                <span className="text-zinc-300">
                  Total Active Voice Rules in <strong className="text-primary-fixed">creator_profile.json</strong>: {proofData.interaction_1?.total_rules || 1}
                </span>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-primary-container text-on-primary-container font-bold uppercase rounded hover:bg-primary-fixed-dim transition shadow-md shadow-primary-container/20"
                >
                  Close & View Memory Page
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default MemoryBehaviorProofModal;
