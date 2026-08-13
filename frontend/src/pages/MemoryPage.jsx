import React, { useState } from 'react';
import { api } from '../lib/api';

export function MemoryPage({ memoryState, onSubmitFeedback, onOpenOnboarding, isExecuting }) {
  const [feedbackInput, setFeedbackInput] = useState(
    'Too formal. Make it punchier and emphasize beginner-friendly tips.'
  );
  const [learningStep, setLearningStep] = useState(0);
  const [comparisonData, setComparisonData] = useState(null);
  const [isComparing, setIsComparing] = useState(false);

  const state = memoryState || {};
  const creatorName = state.creator_name || 'Alex Rivera';
  const niche = state.niche || 'Developer Tools & AI Automation';
  const audienceDesc = state.audience_description || 'Software engineers and builders entering local AI setup for the first time.';
  const voiceAttrs = state.brand_voice_attributes || [];
  const learnedRules = state.learned_voice_rules || [];
  const rejected = state.rejected_topics || [];
  const benchmarks = state.monetization_benchmarks || {};
  const memoryNodes = state.memory_nodes || [];
  const mainGoal = state.main_goal || 'Grow a high-trust technical developer audience';
  const preferredTone = state.preferred_tone || 'Conversational, direct and practical';

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

  const handleFetchComparison = async () => {
    setIsComparing(true);
    try {
      const data = await api.compareRecommendations();
      setComparisonData(data);
    } catch (err) {
      console.error('[MemoryPage] Comparison fetch error:', err);
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-10 space-y-8 max-w-container-max mx-auto text-white font-sans">
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
            Structured long-term identity rules, preferences, constraints, and learned behaviors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenOnboarding}
            className="px-4 py-2 bg-primary-container text-on-primary-container font-mono text-xs font-bold uppercase rounded hover:bg-primary-fixed-dim transition-colors shadow-md shadow-primary-container/20 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base font-bold">edit_note</span>
            <span>Edit Profile Context</span>
          </button>

          <div className="px-3 py-1.5 bg-[#142616] border border-[#234d28] rounded font-mono text-xs text-primary-fixed font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-fixed animate-pulse" />
            <span>720H DECAY ENGINE ACTIVE</span>
          </div>
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
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-mono text-primary-fixed uppercase tracking-widest flex items-center gap-2 font-bold">
            <span className="w-3 h-[2px] bg-primary-fixed block" />
            BEFORE VS. AFTER GREENROOM PERSONALIZATION PROOF
          </h2>

          <button
            onClick={handleFetchComparison}
            disabled={isComparing}
            className="px-3.5 py-1 bg-[#111115] border border-outline-variant hover:border-primary-fixed text-zinc-300 hover:text-white font-mono text-xs font-bold rounded flex items-center gap-1.5 transition"
          >
            <span className="material-symbols-outlined text-sm text-primary-fixed">compare_arrows</span>
            <span>{isComparing ? 'Comparing...' : 'Run Live Comparison'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Generic AI (Before) */}
          <div className="noir-card p-5 space-y-3 opacity-80 bg-[#0e1014]">
            <div className="flex justify-between items-center border-b border-outline-variant/60 pb-2">
              <span className="font-mono text-xs font-bold text-zinc-400 uppercase tracking-wider">GENERIC AI (BEFORE GREENROOM)</span>
              <span className="font-mono text-[10px] text-zinc-500 bg-[#111115] px-2 py-0.5 rounded border border-outline-variant">Zero Context</span>
            </div>
            <h3 className="text-sm font-bold text-zinc-300 font-sans">"Here are 10 generic tech news topics..."</h3>
            <div className="font-mono text-xs text-zinc-400 leading-relaxed bg-[#0a0c0e] p-3.5 rounded border border-outline-variant whitespace-pre-wrap max-h-48 overflow-y-auto">
              {comparisonData?.before_memory ||
                `GENERIC BASELINE (BEFORE GREENROOM MEMORY):\n\n[HOOK]\nWhat is Artificial Intelligence? Here are the top 5 broad tech news announcements this week.\n\n[CONTENT]\n1. Big tech company launches new model.\n2. Industry commentary & speculative discussion.`}
            </div>
            <p className="text-[11px] text-zinc-500 italic font-mono">Ignores creator voice rules, retention metrics, and specific audience requests.</p>
          </div>

          {/* Card 2: Greenroom Personalized (After) */}
          <div className="noir-card p-5 space-y-3 border-primary-fixed bg-[#142616]/40">
            <div className="flex justify-between items-center border-b border-[#234d28] pb-2">
              <span className="font-mono text-xs font-bold text-primary-fixed uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">sparkles</span> GREENROOM PERSONALIZED (AFTER MEMORY)
              </span>
              <span className="font-mono text-[10px] text-primary-fixed font-bold bg-[#142616] px-2 py-0.5 rounded border border-[#234d28]">
                {learnedRules.length} Rules Active
              </span>
            </div>
            <h3 className="text-sm font-bold text-white font-sans">"Tailored 3-Step Setup Script Concept"</h3>
            <div className="font-mono text-xs text-primary-fixed leading-relaxed bg-[#0a0c0e] p-3.5 rounded border border-[#234d28] whitespace-pre-wrap max-h-48 overflow-y-auto">
              {comparisonData?.after_memory ||
                `GREENROOM PERSONALIZED (AFTER MEMORY):\n\nACTIVE RULE PERSISTED: "${learnedRules[learnedRules.length - 1] || 'Direct technical setup walkthrough focus'}"\n\n[HOOK]\nStop wasting hours configuring complex AI workflows. Here are the 3 exact setup steps to launch your local agent today—no fluff, just code.`}
            </div>
            <p className="text-[11px] text-zinc-300 font-mono font-medium">Derived directly from accumulated retention analytics (78% at 30s) and explicitly learned creator rules.</p>
          </div>
        </div>
      </div>

      {/* STRUCTURED CREATOR DNA MATRIX */}
      <div className="space-y-4">
        <h2 className="text-xs font-mono text-primary-fixed uppercase tracking-widest flex items-center gap-2 font-bold">
          <span className="w-3 h-[2px] bg-primary-fixed block" />
          STRUCTURED CREATOR DNA MATRIX (CATEGORIZED MEMORY)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Category 1: IDENTITY & GOALS */}
          <div className="noir-card p-5 space-y-3 border-l-4 border-l-cyan-500">
            <div className="flex justify-between items-center border-b border-outline-variant/60 pb-2">
              <span className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-wider">
                IDENTITY & GOALS
              </span>
              <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                Category
              </span>
            </div>
            <div className="space-y-2 font-mono text-xs">
              <div className="p-2 bg-[#0a0c0e] rounded border border-outline-variant">
                <span className="text-zinc-400 block font-bold text-[10px]">CREATOR & NICHE</span>
                <span className="text-white font-bold">{creatorName}</span> • <span className="text-cyan-300">{niche}</span>
              </div>
              <div className="p-2 bg-[#0a0c0e] rounded border border-outline-variant">
                <span className="text-zinc-400 block font-bold text-[10px]">MAIN GOAL</span>
                <span className="text-zinc-200 font-medium">{mainGoal}</span>
              </div>
              <div className="p-2 bg-[#0a0c0e] rounded border border-outline-variant">
                <span className="text-zinc-400 block font-bold text-[10px]">AUDIENCE PROFILE</span>
                <span className="text-zinc-300">{audienceDesc}</span>
              </div>
            </div>
          </div>

          {/* Category 2: PREFERENCES & TONE */}
          <div className="noir-card p-5 space-y-3 border-l-4 border-l-primary-fixed">
            <div className="flex justify-between items-center border-b border-outline-variant/60 pb-2">
              <span className="font-mono text-xs font-bold text-primary-fixed uppercase tracking-wider">
                PREFERENCES & TONE
              </span>
              <span className="font-mono text-[10px] text-primary-fixed bg-[#142616] px-2 py-0.5 rounded border border-[#234d28]">
                {voiceAttrs.length} Attributes
              </span>
            </div>
            <div className="space-y-2 font-mono text-xs">
              <div className="p-2 bg-[#0a0c0e] rounded border border-outline-variant">
                <span className="text-zinc-400 block font-bold text-[10px]">PREFERRED TONE</span>
                <span className="text-primary-fixed font-bold">{preferredTone}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {voiceAttrs.map((attr, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-[#111115] border border-outline-variant text-zinc-200 rounded text-[11px] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[10px] text-primary-fixed">check</span>
                    <span>{attr}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Category 3: CONSTRAINTS & REJECTED TOPICS */}
          <div className="noir-card p-5 space-y-3 border-l-4 border-l-rose-500">
            <div className="flex justify-between items-center border-b border-outline-variant/60 pb-2">
              <span className="font-mono text-xs font-bold text-rose-400 uppercase tracking-wider">
                CONSTRAINTS & REJECTED TOPICS
              </span>
              <span className="font-mono text-[10px] text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
                High Priority
              </span>
            </div>
            <div className="space-y-1.5 font-mono text-xs">
              <p className="text-[11px] text-zinc-400">Explicit creator constraints take absolute authority over AI inference:</p>
              {rejected.map((r, i) => (
                <div key={i} className="p-2 bg-rose-950/40 border border-rose-900/60 text-rose-200 rounded font-bold text-[11px] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-xs text-rose-400">block</span>
                  <span>{r}</span>
                </div>
              ))}
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
                      {takeaway}
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
