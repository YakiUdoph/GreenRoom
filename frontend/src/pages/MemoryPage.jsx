import React from 'react';

export function MemoryPage({ memoryState }) {
  const state = memoryState || {};
  const learnedRules = state.learned_voice_rules || [];
  const memoryNodes = state.memory_nodes || [];

  return (
    <div className="flex-1 p-8 md:p-12 space-y-12 max-w-container-max mx-auto text-white">
      {/* Header */}
      <div className="border-b border-outline-variant pb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary-fixed text-2xl">database</span>
            <span className="font-mono text-xs text-primary-fixed uppercase tracking-widest font-bold bg-[#142616] px-3 py-1 rounded border border-[#234d28]">
              MEMORY ENGINE & DNA MATRIX
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-white uppercase">
            Everything Greenroom Has Learned About You
          </h1>
          <p className="text-sm md:text-base font-sans text-zinc-200 mt-2 font-medium">
            Persistent memory engine with recency decay weighting & voice adaptation rules.
          </p>
        </div>

        <div className="px-4 py-2 bg-[#142616] border border-[#234d28] rounded font-mono text-xs text-primary-fixed font-bold flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary-fixed animate-pulse" />
          <span>720H DECAY ENGINE ACTIVE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Section: CREATOR DNA MATRIX (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <h2 className="text-xs font-mono text-primary-fixed uppercase tracking-widest flex items-center gap-2 font-bold">
            <span className="w-4 h-[2px] bg-primary-fixed block" />
            CREATOR DNA MATRIX
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Card 1: VOICE */}
            <div className="noir-card p-6 space-y-3">
              <span className="material-symbols-outlined text-primary-fixed text-2xl">record_voice_over</span>
              <div className="space-y-1">
                <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                  VOICE ATTRIBUTES
                </h3>
                <p className="text-sm font-sans text-white leading-relaxed font-bold">
                  {state.brand_voice_attributes
                    ? state.brand_voice_attributes.join(', ') + '.'
                    : 'Direct, intellectual, authoritative.'}
                </p>
              </div>
            </div>

            {/* Card 2: AUDIENCE */}
            <div className="noir-card p-6 space-y-3">
              <span className="material-symbols-outlined text-primary-fixed text-2xl">groups</span>
              <div className="space-y-1">
                <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                  TARGET AUDIENCE
                </h3>
                <p className="text-sm font-sans text-white leading-relaxed font-bold">
                  Deep-tech enthusiasts, AI architects, digital minimalists.
                </p>
              </div>
            </div>

            {/* Card 3: CONTENT */}
            <div className="noir-card p-6 space-y-3">
              <span className="material-symbols-outlined text-primary-fixed text-2xl">article</span>
              <div className="space-y-1">
                <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                  PREFERRED FORMAT
                </h3>
                <p className="text-sm font-sans text-white leading-relaxed font-bold">
                  Long-form breakdowns, technical deep-dives.
                </p>
              </div>
            </div>

            {/* Card 4: GOALS */}
            <div className="noir-card p-6 space-y-3">
              <span className="material-symbols-outlined text-primary-fixed text-2xl">flag</span>
              <div className="space-y-1">
                <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                  STRATEGIC GOALS
                </h3>
                <p className="text-sm font-sans text-white leading-relaxed font-bold">
                  Establish authority in AI ethics, drive technical newsletter signups.
                </p>
              </div>
            </div>

            {/* Card 5: PREFERENCES (Full Width) */}
            <div className="sm:col-span-2 noir-card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-fixed text-2xl">tune</span>
                <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                  LEARNED VOICE RULES
                </h3>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="px-3.5 py-1.5 bg-[#111115] border border-outline-variant text-white rounded text-xs font-mono font-bold">
                  NO EXCESSIVE EMOJIS
                </span>
                <span className="px-3.5 py-1.5 bg-[#111115] border border-outline-variant text-white rounded text-xs font-mono font-bold">
                  HIGH-CONTRAST VISUALS
                </span>
                <span className="px-3.5 py-1.5 bg-[#111115] border border-outline-variant text-white rounded text-xs font-mono font-bold">
                  MOBILE-FIRST READING
                </span>
                {learnedRules.map((rule, idx) => (
                  <span key={idx} className="px-3.5 py-1.5 bg-[#142616] border border-[#234d28] text-primary-fixed rounded text-xs font-mono font-bold">
                    {rule}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: MEMORY TIMELINE (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <h2 className="text-xs font-mono text-primary-fixed uppercase tracking-widest flex items-center gap-2 font-bold">
            <span className="w-4 h-[2px] bg-primary-fixed block" />
            MEMORY TIMELINE
          </h2>

          <div className="relative pl-6 space-y-6 border-l-2 border-primary-fixed">
            <div className="relative">
              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-[#0e0e11] border-2 border-primary-fixed flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed animate-pulse" />
              </div>
              <div className="noir-card p-5 space-y-2">
                <span className="font-mono text-xs text-primary-fixed font-bold">TODAY 18:32</span>
                <p className="text-sm font-sans text-white font-bold leading-relaxed">
                  Learned: Creator prefers punchier hooks.
                </p>
                <span className="text-xs font-mono text-zinc-300 block pt-1 font-medium">
                  Source: Feedback loop
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-[#0e0e11] border-2 border-outline-variant flex items-center justify-center">
                <span className="material-symbols-outlined text-xs text-zinc-300">psychology</span>
              </div>
              <div className="noir-card p-5 space-y-2">
                <span className="font-mono text-xs text-zinc-300 font-bold">TODAY 15:04</span>
                <p className="text-sm font-sans text-white font-bold leading-relaxed">
                  Audience signal: Followers are asking about AI agents.
                </p>
                <span className="text-xs font-mono text-zinc-300 block pt-1 font-medium">
                  Source: Community Mind
                </span>
              </div>
            </div>

            {memoryNodes.map((node, i) => (
              <div key={node.node_id || i} className="relative">
                <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-[#0e0e11] border-2 border-primary-fixed flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed" />
                </div>
                <div className="noir-card p-5 space-y-2">
                  <span className="font-mono text-xs text-primary-fixed font-bold">PERSISTED NODE #{i + 1}</span>
                  <p className="text-sm font-sans text-white font-bold leading-relaxed">
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
