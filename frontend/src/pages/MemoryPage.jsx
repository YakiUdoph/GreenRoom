import React, { useState } from 'react';

export function MemoryPage({ memoryState, onSubmitFeedback, isExecuting }) {
  const [feedbackInput, setFeedbackInput] = useState(
    'Too formal. Make it punchier and emphasize beginner-friendly tips.'
  );
  const [learningStep, setLearningStep] = useState(0);

  const state = memoryState || {};
  const voiceAttrs = state.brand_voice_attributes || [];
  const learnedRules = state.learned_voice_rules || [];
  const rejected = state.rejected_topics || [];
  const benchmarks = state.monetization_benchmarks || {};
  const memoryNodes = state.memory_nodes || [];

  const handleLearningSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackInput.trim() || isExecuting) return;

    setLearningStep(1);
    await new Promise((r) => setTimeout(r, 400));
    setLearningStep(2);
    await new Promise((r) => setTimeout(r, 500));
    setLearningStep(3);

    if (onSubmitFeedback) {
      await onSubmitFeedback(feedbackInput.trim());
    }

    setLearningStep(4);
    setTimeout(() => {
      setLearningStep(0);
    }, 3000);
  };

  return (
    <div className="flex-1 p-6 md:p-10 space-y-8 max-w-container-max mx-auto text-white">
      {/* Header */}
      <div className="border-b border-[#72ff70]/30 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary-fixed text-2xl">database</span>
            <span className="font-mono text-xs text-primary-fixed uppercase tracking-widest font-bold bg-[#142616] px-3 py-0.5 rounded border border-[#234d28]">
              PERSISTENT CREATOR MEMORY ENGINE
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white uppercase tracking-tight">
            Everything Greenroom Has Learned About You
          </h1>
          <p className="text-xs md:text-sm font-sans text-zinc-200 mt-1 font-medium">
            Accumulated long-term identity rules, voice parameters, and audience preferences.
          </p>
        </div>

        <div className="px-3.5 py-1.5 bg-[#142616] border border-[#234d28] rounded font-mono text-xs text-primary-fixed font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary-fixed animate-pulse" />
          <span>720H RECENCY DECAY ENGINE ACTIVE</span>
        </div>
      </div>

      {/* Signature "Teach Greenroom / I Remember" Form */}
      <div className="noir-card p-6 space-y-5 border border-primary-fixed/40 bg-[#121418]/90 backdrop-blur-md shadow-xl">
        <div className="flex justify-between items-center border-b border-outline-variant/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-fixed text-xl">record_voice_over</span>
            <h2 className="font-display text-xl font-bold text-white">
              Teach Greenroom (The "I Remember" Signature Experience)
            </h2>
          </div>
          <span className="font-mono text-xs text-primary-fixed font-bold bg-[#142616] px-2.5 py-0.5 rounded border border-[#234d28]">
            Instant Memory Persistence Loop
          </span>
        </div>

        <p className="text-xs md:text-sm font-sans text-zinc-200 leading-relaxed font-medium">
          Give explicit feedback or voice instructions. Greenroom will extract the learned rule, persist it to <code className="text-primary-fixed font-mono bg-[#0a0c0e] px-1.5 py-0.5 rounded border border-outline-variant">creator_profile.json</code>, and alter all future recommendations.
        </p>

        <form onSubmit={handleLearningSubmit} className="space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={feedbackInput}
              onChange={(e) => setFeedbackInput(e.target.value)}
              disabled={isExecuting || learningStep > 0}
              className="flex-1 bg-[#0a0c0e] border border-outline-variant rounded p-3 font-mono text-xs text-white focus:border-primary-fixed focus:outline-none"
              placeholder="e.g., Too formal. Make it punchier and emphasize beginner-friendly setup tips..."
            />
            <button
              type="submit"
              disabled={isExecuting || learningStep > 0}
              className="px-5 py-3 bg-primary-container text-on-primary-container font-mono text-xs font-bold uppercase rounded hover:bg-primary-fixed-dim transition-colors flex justify-center items-center gap-2 disabled:opacity-50 whitespace-nowrap shadow-lg shadow-primary-container/20"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              <span>Teach Greenroom & Remember</span>
            </button>
          </div>
        </form>

        {learningStep > 0 && (
          <div className="p-3 bg-[#142616] border border-[#234d28] rounded font-mono text-xs text-primary-fixed font-bold flex items-center gap-2.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-primary-fixed animate-ping" />
            <span>
              {learningStep === 1 && '1. Analyzing feedback string...'}
              {learningStep === 2 && '2. Extracting preference rule...'}
              {learningStep === 3 && '3. Updating creator_profile.json memory matrix...'}
              {learningStep === 4 && '4. REMEMBERED! Persisted rule to agent context.'}
            </span>
          </div>
        )}
      </div>

      {/* BEFORE VS AFTER PERSONALIZATION DEMONSTRATION */}
      <div className="space-y-4">
        <h2 className="text-xs font-mono text-primary-fixed uppercase tracking-widest flex items-center gap-2 font-bold">
          <span className="w-3 h-[2px] bg-primary-fixed block" />
          BEFORE VS. AFTER GREENROOM PERSONALIZATION
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Generic AI (Before) */}
          <div className="noir-card p-5 space-y-3 opacity-75">
            <div className="flex justify-between items-center border-b border-outline-variant/60 pb-2">
              <span className="font-mono text-xs font-bold text-zinc-400 uppercase tracking-wider">GENERIC AI (BEFORE GREENROOM)</span>
              <span className="font-mono text-[10px] text-zinc-500 bg-[#111115] px-2 py-0.5 rounded border border-outline-variant">Zero Context</span>
            </div>
            <h3 className="text-sm font-bold text-zinc-300 font-sans">"Here are 10 broad content ideas..."</h3>
            <p className="font-mono text-xs text-zinc-400 leading-relaxed bg-[#0a0c0e] p-3 rounded border border-outline-variant">
              "1. What is Artificial Intelligence?\n2. Top 5 AI Tools in 2026...\n3. How AI will change coding..."
            </p>
            <p className="text-[11px] text-zinc-500 italic">Generic output ignoring creator voice, retention history, or audience requests.</p>
          </div>

          {/* Card 2: Greenroom Personalized (After) */}
          <div className="noir-card p-5 space-y-3 border-primary-fixed bg-[#142616]/40">
            <div className="flex justify-between items-center border-b border-[#234d28] pb-2">
              <span className="font-mono text-xs font-bold text-primary-fixed uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">sparkles</span> GREENROOM PERSONALIZED (AFTER MEMORY)
              </span>
              <span className="font-mono text-[10px] text-primary-fixed font-bold bg-[#142616] px-2 py-0.5 rounded border border-[#234d28]">
                Context Active
              </span>
            </div>
            <h3 className="text-sm font-bold text-white font-sans">"Tailored 3-Step Setup Script Concept"</h3>
            <p className="font-mono text-xs text-primary-fixed leading-relaxed bg-[#0a0c0e] p-3 rounded border border-[#234d28]">
              {learnedRules.length > 0
                ? `⚡ PUNCHY VOICE RULE ACTIVE: "${learnedRules[learnedRules.length - 1]}"\n\n[HOOK]: Stop wasting hours configuring local pipelines. 3 setup steps to launch your agent today.`
                : `⚡ BRAND VOICE MATRIX: Educational, Technical, Direct.\n\n[HOOK]: Stop wasting hours configuring complex local pipelines. Here are the 3 setup steps to launch today.`}
            </p>
            <p className="text-[11px] text-zinc-300 font-medium">Derived directly from accumulated creator rules and viewer retention analytics.</p>
          </div>
        </div>
      </div>

      {/* CREATOR DNA MATRIX */}
      <div className="space-y-4">
        <h2 className="text-xs font-mono text-primary-fixed uppercase tracking-widest flex items-center gap-2 font-bold">
          <span className="w-3 h-[2px] bg-primary-fixed block" />
          CREATOR DNA MATRIX
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* Card 1: Brand Voice */}
          <div className="noir-card p-5 space-y-3">
            <h3 className="font-mono text-xs font-bold text-primary-fixed uppercase tracking-wider">
              Brand Voice Attributes
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {voiceAttrs.map((attr, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-[#111115] border border-outline-variant text-zinc-200 rounded text-xs font-mono font-medium">
                  {attr}
                </span>
              ))}
            </div>
          </div>

          {/* Card 2: Learned Voice Rules */}
          <div className="noir-card p-5 space-y-3 border-primary-fixed">
            <div className="flex justify-between items-center">
              <h3 className="font-mono text-xs font-bold text-primary-fixed uppercase tracking-wider">
                Learned Voice Rules
              </h3>
              <span className="font-mono text-[10px] text-primary-fixed font-bold bg-[#142616] px-2 py-0.5 rounded border border-[#234d28]">
                {learnedRules.length} Active
              </span>
            </div>
            <div className="space-y-1.5 font-mono text-xs">
              {learnedRules.length === 0 ? (
                <p className="text-zinc-500 italic text-[11px]">No feedback rules learned yet. Use form above to test.</p>
              ) : (
                learnedRules.map((rule, idx) => (
                  <div key={idx} className="p-2 bg-[#142616] border border-[#234d28] text-primary-fixed rounded flex items-center gap-1.5 font-bold text-[11px]">
                    <span className="material-symbols-outlined text-xs">check</span>
                    <span>{rule}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card 3: Rejected Topics */}
          <div className="noir-card p-5 space-y-3">
            <h3 className="font-mono text-xs font-bold text-rose-400 uppercase tracking-wider">
              Scout Rejected Topics
            </h3>
            <div className="space-y-1 font-mono text-xs text-zinc-300">
              {rejected.map((r, i) => (
                <p key={i} className="text-rose-300 text-[11px]">• {r}</p>
              ))}
            </div>
          </div>

          {/* Card 4: Business Benchmarks */}
          <div className="noir-card p-5 space-y-3">
            <h3 className="font-mono text-xs font-bold text-primary-fixed uppercase tracking-wider">
              Business Benchmarks
            </h3>
            <div className="space-y-1.5 font-mono text-xs">
              <div className="p-2 bg-[#0a0c0e] rounded border border-outline-variant flex justify-between">
                <span className="text-zinc-400">Target CPM</span>
                <span className="font-bold text-primary-fixed">${benchmarks.cpm_target || 45}</span>
              </div>
              <div className="p-2 bg-[#0a0c0e] rounded border border-outline-variant flex justify-between">
                <span className="text-zinc-400">Min Deal</span>
                <span className="font-bold text-white">${benchmarks.minimum_deal_size ? benchmarks.minimum_deal_size.toLocaleString() : '5,000'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CHRONOLOGICAL MEMORY TIMELINE */}
      <div className="space-y-4">
        <h2 className="text-xs font-mono text-primary-fixed uppercase tracking-widest flex items-center gap-2 font-bold">
          <span className="w-3 h-[2px] bg-primary-fixed block" />
          CHRONOLOGICAL MEMORY TIMELINE
        </h2>

        <div className="space-y-3">
          {memoryNodes.slice().reverse().map((node, idx) => (
            <div key={node.node_id || idx} className="noir-card p-5 space-y-2">
              <div className="flex justify-between items-center border-b border-outline-variant/60 pb-2 font-mono text-xs">
                <span className="font-bold text-primary-fixed uppercase bg-[#142616] px-2.5 py-0.5 rounded border border-[#234d28] text-[11px]">
                  {node.type || 'MEMORY NODE'}
                </span>
                <span className="text-zinc-400 font-bold text-[11px]">Node ID: {node.node_id || `mem_${idx}`}</span>
              </div>

              <p className="text-xs md:text-sm font-sans text-white leading-relaxed font-medium">
                {node.content}
              </p>

              {node.key_takeaways && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {node.key_takeaways.map((takeaway, tIdx) => (
                    <span key={tIdx} className="px-2.5 py-0.5 bg-[#0a0c0e] border border-outline-variant rounded text-[11px] font-mono text-zinc-300">
                      ✓ {takeaway}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MemoryPage;
