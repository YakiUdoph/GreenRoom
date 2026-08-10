import React, { useState } from 'react';
import { Brain, Zap, Check, Clock, ShieldAlert, Sparkles, PlusCircle } from 'lucide-react';

export function Memory({
  memoryState,
  onSubmitFeedback,
  isExecuting,
}) {
  const [feedbackInput, setFeedbackInput] = useState(
    'Too formal. Make it punchier and emphasize beginner-friendly tips.'
  );
  const [learningStep, setLearningStep] = useState(0); // 0: idle, 1: analyzing, 2: extracting, 3: updating, 4: complete

  const state = memoryState || {};
  const creatorName = state.creator_name || 'Alex Rivera';
  const voiceAttrs = state.brand_voice_attributes || [];
  const learnedRules = state.learned_voice_rules || [];
  const rejected = state.rejected_topics || [];
  const benchmarks = state.monetization_benchmarks || {};
  const memoryNodes = state.memory_nodes || [];

  const handleLearningSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackInput.trim() || isExecuting) return;

    setLearningStep(1); // Analyzing
    await new Promise((r) => setTimeout(r, 400));
    setLearningStep(2); // Extracting preference
    await new Promise((r) => setTimeout(r, 500));
    setLearningStep(3); // Updating memory

    await onSubmitFeedback(feedbackInput.trim());

    setLearningStep(4); // Remembered!
    setTimeout(() => {
      setLearningStep(0);
    }, 2500);
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-12">
      {/* Editorial Header */}
      <div className="border-b border-slate-800 pb-6 space-y-2">
        <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest bg-amber-950/60 border border-amber-800/80 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
          <Brain className="w-3.5 h-3.5" />
          PERSISTENT MEMORY ENGINE
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
          Everything Greenroom Has Learned About You.
        </h1>
        <p className="text-sm text-slate-400">
          Greenroom accumulates long-term identity rules, voice parameters, and audience preferences over time.
        </p>
      </div>

      {/* Signature "I REMEMBER" Learning Form */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-amber-900/50 rounded-3xl p-6 md:p-8 space-y-4 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">
              Teach Greenroom (The "I Remember" Signature Experience)
            </h2>
          </div>
          <span className="text-xs font-mono text-amber-300 bg-amber-950 border border-amber-800 px-3 py-1 rounded-full">
            Instant Memory Persistence
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
          Provide explicit feedback or voice instructions. Greenroom will extract the learned rule, update your persistent profile state, and alter all future recommendations.
        </p>

        <form onSubmit={handleLearningSubmit} className="space-y-3 pt-2">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={feedbackInput}
              onChange={(e) => setFeedbackInput(e.target.value)}
              disabled={isExecuting || learningStep > 0}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-amber-500 font-sans shadow-inner"
              placeholder="e.g., Emphasize open-source local models and concise terminal setup steps..."
            />
            <button
              type="submit"
              disabled={isExecuting || learningStep > 0}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-amber-500/20 whitespace-nowrap flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4" />
              Teach Greenroom & Remember
            </button>
          </div>
        </form>

        {/* Animated Learning Step Sequence */}
        {learningStep > 0 && (
          <div className="p-4 bg-slate-950 border border-amber-800/80 rounded-2xl flex items-center justify-between animate-memory-pop">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs font-mono font-bold text-amber-300">
                {learningStep === 1 && '1. Analyzing feedback string...'}
                {learningStep === 2 && '2. Extracting preference rule...'}
                {learningStep === 3 && '3. Updating creator_profile.json memory matrix...'}
                {learningStep === 4 && '4. REMEMBERED! Persisted rule to agent context.'}
              </span>
            </div>
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
          </div>
        )}
      </section>

      {/* CREATOR DNA MATRIX */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-slate-200 tracking-tight flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          CREATOR DNA MATRIX
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Card 1: Brand Voice */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
              Brand Voice Attributes
            </span>
            <p className="text-sm font-bold text-slate-100">{creatorName}</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {voiceAttrs.map((attr, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-slate-950 text-slate-300 rounded-lg text-xs border border-slate-800 font-sans">
                  {attr}
                </span>
              ))}
            </div>
          </div>

          {/* Card 2: Learned Voice Rules */}
          <div className="p-5 bg-slate-900/90 border border-amber-900/60 rounded-2xl space-y-3 shadow-inner">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                Learned Voice Rules
              </span>
              <span className="text-[10px] font-mono text-amber-300 font-bold">
                {learnedRules.length} Active
              </span>
            </div>
            <div className="space-y-2 text-xs font-sans">
              {learnedRules.length === 0 ? (
                <p className="text-slate-500 italic text-[11px]">No feedback rules learned yet. Use form above to test.</p>
              ) : (
                learnedRules.map((rule, idx) => (
                  <div key={idx} className="p-2 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-200 text-xs flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card 3: Rejected Topics */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
            <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              Scout Rejected Topics
            </span>
            <div className="space-y-1 text-xs text-slate-300 pt-1">
              {rejected.map((r, i) => (
                <p key={i} className="text-rose-300/90">• {r}</p>
              ))}
            </div>
          </div>

          {/* Card 4: Business CPM Benchmarks */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
            <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
              Business Benchmarks
            </span>
            <div className="space-y-2 pt-1">
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Target CPM</span>
                <span className="font-bold text-slate-100">${benchmarks.cpm_target || 45}</span>
              </div>
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Min Deal</span>
                <span className="font-bold text-slate-100">${benchmarks.minimum_deal_size ? benchmarks.minimum_deal_size.toLocaleString() : '5,000'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MEMORY TIMELINE */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-200 tracking-tight flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            CHRONOLOGICAL MEMORY TIMELINE
          </h2>
          <span className="text-xs font-mono text-slate-500">720h Recency Decay Active</span>
        </div>

        <div className="space-y-3">
          {memoryNodes.length === 0 ? (
            <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl text-center text-slate-500 text-xs italic">
              No persistent memory nodes recorded yet. Run Minute 1 step to ingest profile analytics.
            </div>
          ) : (
            memoryNodes.slice().reverse().map((node, idx) => (
              <div
                key={node.node_id || idx}
                className="p-5 bg-slate-950 border border-slate-800/90 rounded-2xl space-y-2 transition hover:border-slate-700 animate-memory-pop"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase text-cyan-400 bg-cyan-950 border border-cyan-800 px-2 py-0.5 rounded">
                      {node.type || 'MEMORY NODE'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      ID: {node.node_id || `mem_${idx}`}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-900">
                    Recency Decay Weight: 1.00
                  </span>
                </div>

                <p className="text-xs text-slate-200 font-sans leading-relaxed">
                  {node.content}
                </p>

                {node.key_takeaways && node.key_takeaways.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {node.key_takeaways.map((takeaway, tIdx) => (
                      <span key={tIdx} className="text-[11px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                        ✓ {takeaway}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
