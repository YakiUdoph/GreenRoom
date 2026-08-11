import React from 'react';
import { motion } from 'framer-motion';

export function MemoryPage({ memoryState }) {
  const state = memoryState || {};
  const learnedRules = state.learned_voice_rules || [];
  const memoryNodes = state.memory_nodes || [];

  return (
    <div className="flex-1 p-8 md:p-12 space-y-12 max-w-container-max mx-auto text-on-background">
      {/* Header */}
      <div className="border-b border-outline-variant pb-8 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary-fixed">database</span>
            <span className="font-mono text-xs text-primary-fixed uppercase tracking-widest font-bold">
              MEMORY ENGINE & DNA MATRIX
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-on-surface uppercase">
            Everything Greenroom Has Learned About You
          </h1>
          <p className="text-sm font-sans text-on-surface-variant mt-2">
            Persistent memory engine with recency decay weighting & voice adaptation rules.
          </p>
        </div>

        <div className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded font-mono text-xs text-primary-fixed flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary-fixed animate-pulse" />
          <span>720H DECAY ENGINE ACTIVE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Section: CREATOR DNA MATRIX (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <h3 className="text-xs font-mono text-on-surface-variant flex items-center gap-2 tracking-wider">
            <span className="w-4 h-[1px] bg-outline-variant block" />
            CREATOR DNA MATRIX
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1: VOICE */}
            <div className="motion-card p-6 rounded border border-outline-variant space-y-3">
              <span className="material-symbols-outlined text-primary-fixed text-xl">record_voice_over</span>
              <div className="space-y-1">
                <h4 className="text-xs font-mono font-bold text-on-surface-variant uppercase tracking-wider">
                  VOICE ATTRIBUTES
                </h4>
                <p className="text-sm font-sans text-on-surface leading-relaxed font-medium">
                  {state.brand_voice_attributes
                    ? state.brand_voice_attributes.join(', ') + '.'
                    : 'Direct, intellectual, authoritative.'}
                </p>
              </div>
            </div>

            {/* Card 2: AUDIENCE */}
            <div className="motion-card p-6 rounded border border-outline-variant space-y-3">
              <span className="material-symbols-outlined text-primary-fixed text-xl">groups</span>
              <div className="space-y-1">
                <h4 className="text-xs font-mono font-bold text-on-surface-variant uppercase tracking-wider">
                  TARGET AUDIENCE
                </h4>
                <p className="text-sm font-sans text-on-surface leading-relaxed font-medium">
                  Deep-tech enthusiasts, AI architects, digital minimalists.
                </p>
              </div>
            </div>

            {/* Card 3: CONTENT */}
            <div className="motion-card p-6 rounded border border-outline-variant space-y-3">
              <span className="material-symbols-outlined text-primary-fixed text-xl">article</span>
              <div className="space-y-1">
                <h4 className="text-xs font-mono font-bold text-on-surface-variant uppercase tracking-wider">
                  PREFERRED FORMAT
                </h4>
                <p className="text-sm font-sans text-on-surface leading-relaxed font-medium">
                  Long-form breakdowns, technical deep-dives.
                </p>
              </div>
            </div>

            {/* Card 4: GOALS */}
            <div className="motion-card p-6 rounded border border-outline-variant space-y-3">
              <span className="material-symbols-outlined text-primary-fixed text-xl">flag</span>
              <div className="space-y-1">
                <h4 className="text-xs font-mono font-bold text-on-surface-variant uppercase tracking-wider">
                  STRATEGIC GOALS
                </h4>
                <p className="text-sm font-sans text-on-surface leading-relaxed font-medium">
                  Establish authority in AI ethics, drive technical newsletter signups.
                </p>
              </div>
            </div>

            {/* Card 5: PREFERENCES (Full Width) */}
            <div className="sm:col-span-2 motion-card p-6 rounded border border-outline-variant space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-fixed text-xl">tune</span>
                <h4 className="text-xs font-mono font-bold text-on-surface-variant uppercase tracking-wider">
                  LEARNED VOICE RULES
                </h4>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-surface-container-high border border-outline-variant text-on-surface rounded text-xs font-mono">
                  NO EXCESSIVE EMOJIS
                </span>
                <span className="px-3 py-1 bg-surface-container-high border border-outline-variant text-on-surface rounded text-xs font-mono">
                  HIGH-CONTRAST VISUALS
                </span>
                <span className="px-3 py-1 bg-surface-container-high border border-outline-variant text-on-surface rounded text-xs font-mono">
                  MOBILE-FIRST READING
                </span>
                {learnedRules.map((rule, idx) => (
                  <span key={idx} className="px-3 py-1 bg-primary-container/20 border border-primary-fixed text-primary-fixed rounded text-xs font-mono font-bold">
                    {rule}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: MEMORY TIMELINE (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <h3 className="text-xs font-mono text-on-surface-variant flex items-center gap-2 tracking-wider">
            <span className="w-4 h-[1px] bg-outline-variant block" />
            MEMORY TIMELINE
          </h3>

          <div className="relative pl-6 space-y-6 border-l-2 border-primary-fixed">
            <div className="relative">
              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-background border-2 border-primary-fixed flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed animate-pulse" />
              </div>
              <div className="motion-card p-5 rounded border border-outline-variant space-y-2">
                <span className="font-mono text-xs text-primary-fixed font-bold">TODAY 18:32</span>
                <p className="text-sm font-sans text-on-surface font-medium leading-relaxed">
                  Learned: Creator prefers punchier hooks.
                </p>
                <span className="text-xs font-mono text-on-surface-variant block pt-1">
                  Source: Feedback loop
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-background border-2 border-outline-variant flex items-center justify-center">
                <span className="material-symbols-outlined text-[10px] text-on-surface-variant">psychology</span>
              </div>
              <div className="motion-card p-5 rounded border border-outline-variant space-y-2">
                <span className="font-mono text-xs text-on-surface-variant font-bold">TODAY 15:04</span>
                <p className="text-sm font-sans text-on-surface font-medium leading-relaxed">
                  Audience signal: Followers are asking about AI agents.
                </p>
                <span className="text-xs font-mono text-on-surface-variant block pt-1">
                  Source: Community Mind
                </span>
              </div>
            </div>

            {memoryNodes.map((node, i) => (
              <div key={node.node_id || i} className="relative">
                <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-background border-2 border-primary-fixed flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed" />
                </div>
                <div className="motion-card p-5 rounded border border-outline-variant space-y-2">
                  <span className="font-mono text-xs text-primary-fixed font-bold">PERSISTED NODE #{i + 1}</span>
                  <p className="text-sm font-sans text-on-surface font-medium leading-relaxed">
                    {node.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
