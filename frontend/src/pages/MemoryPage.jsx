import React from 'react';
import { User, Users, FileText, Flag, Sliders, RotateCw, Check, Sparkles, X } from 'lucide-react';

export function MemoryPage({ memoryState }) {
  const state = memoryState || {};
  const learnedRules = state.learned_voice_rules || [];
  const memoryNodes = state.memory_nodes || [];

  return (
    <div className="flex-1 p-8 md:p-10 space-y-10 max-w-[1400px]">
      {/* Top Header Row */}
      <div className="flex items-start justify-between border-b border-[#18181b] pb-8">
        <div className="space-y-2">
          {/* Serif High-Contrast Title */}
          <h1 className="text-5xl md:text-6xl font-serif tracking-tight text-white uppercase font-bold">
            MEMORY
          </h1>
          <p className="text-sm font-sans text-zinc-400">
            Everything Greenroom has learned about you.
          </p>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center gap-4">
          <div className="px-3.5 py-1.5 rounded-full bg-[#0d1512] border border-[#1b3d2f] text-emerald-400 text-xs font-mono font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>SYNTHESIZING CONTEXT</span>
          </div>

          <button
            onClick={() => window.history.back()}
            className="p-1.5 text-zinc-500 hover:text-zinc-200 transition-colors rounded-lg"
            title="Close View"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Grid: CREATOR DNA (Left 2 cols) vs MEMORY TIMELINE (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Section: CREATOR DNA (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-2 border-b border-[#18181b] pb-3">
            <span className="text-xs font-mono font-bold text-emerald-500 uppercase tracking-widest">
              CREATOR DNA
            </span>
          </div>

          {/* 2-Column Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1: VOICE */}
            <div className="motion-card p-6 rounded-xl border border-[#1f1f23] space-y-3">
              <User className="w-5 h-5 text-zinc-400" />
              <div className="space-y-1">
                <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  VOICE
                </h3>
                <p className="text-sm font-sans text-zinc-200 leading-relaxed font-medium">
                  {state.brand_voice_attributes
                    ? state.brand_voice_attributes.join(', ') + '.'
                    : 'Direct, intellectual, authoritative.'}
                </p>
              </div>
            </div>

            {/* Card 2: AUDIENCE */}
            <div className="motion-card p-6 rounded-xl border border-[#1f1f23] space-y-3">
              <Users className="w-5 h-5 text-zinc-400" />
              <div className="space-y-1">
                <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  AUDIENCE
                </h3>
                <p className="text-sm font-sans text-zinc-200 leading-relaxed font-medium">
                  Deep-tech enthusiasts, architects, digital minimalists.
                </p>
              </div>
            </div>

            {/* Card 3: CONTENT */}
            <div className="motion-card p-6 rounded-xl border border-[#1f1f23] space-y-3">
              <FileText className="w-5 h-5 text-zinc-400" />
              <div className="space-y-1">
                <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  CONTENT
                </h3>
                <p className="text-sm font-sans text-zinc-200 leading-relaxed font-medium">
                  Long-form breakdowns, technical deep-dives.
                </p>
              </div>
            </div>

            {/* Card 4: GOALS */}
            <div className="motion-card p-6 rounded-xl border border-[#1f1f23] space-y-3">
              <Flag className="w-5 h-5 text-zinc-400" />
              <div className="space-y-1">
                <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  GOALS
                </h3>
                <p className="text-sm font-sans text-zinc-200 leading-relaxed font-medium">
                  Establish authority in AI ethics, drive technical newsletter signups.
                </p>
              </div>
            </div>

            {/* Card 5: PREFERENCES (Full Width) */}
            <div className="sm:col-span-2 motion-card p-6 rounded-xl border border-[#1f1f23] space-y-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-zinc-400" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  PREFERENCES
                </h3>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="px-3 py-1 bg-[#1a1a1e] border border-[#27272a] text-zinc-300 rounded text-xs font-mono uppercase tracking-wider font-medium">
                    NO EXCESSIVE EMOJIS
                  </span>
                  <span className="px-3 py-1 bg-[#1a1a1e] border border-[#27272a] text-zinc-300 rounded text-xs font-mono uppercase tracking-wider font-medium">
                    HIGH-CONTRAST VISUALS
                  </span>
                  <span className="px-3 py-1 bg-[#1a1a1e] border border-[#27272a] text-zinc-300 rounded text-xs font-mono uppercase tracking-wider font-medium">
                    MOBILE-FIRST READING
                  </span>
                  {learnedRules.map((rule, idx) => (
                    <span key={idx} className="px-3 py-1 bg-[#152a20] border border-[#1b4332] text-emerald-300 rounded text-xs font-mono uppercase tracking-wider font-medium">
                      {rule}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: MEMORY TIMELINE (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between border-b border-[#18181b] pb-3">
            <span className="text-xs font-mono font-bold text-emerald-500 uppercase tracking-widest">
              MEMORY TIMELINE
            </span>
            <RotateCw className="w-4 h-4 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer" />
          </div>

          {/* Timeline Panel with Green Line */}
          <div className="relative pl-6 space-y-6 border-l-2 border-emerald-500/80">
            {/* Timeline Item 1 */}
            <div className="relative group">
              {/* Timeline Node Icon */}
              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-[#09090b] border-2 border-emerald-500 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-timeline-dot" />
              </div>

              <div className="motion-card p-5 rounded-xl border border-[#1f1f23] space-y-2">
                <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase">
                  TODAY 18:32
                </span>
                <p className="text-sm font-sans text-zinc-200 font-medium leading-relaxed">
                  Learned: Creator prefers punchier hooks.
                </p>
                <div className="pt-2 text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                  <RotateCw className="w-3 h-3 text-zinc-400" />
                  <span>Action: Feed update</span>
                </div>
              </div>
            </div>

            {/* Timeline Item 2 */}
            <div className="relative group">
              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-[#09090b] border-2 border-zinc-700 flex items-center justify-center">
                <FileText className="w-2.5 h-2.5 text-zinc-400" />
              </div>

              <div className="motion-card p-5 rounded-xl border border-[#1f1f23] space-y-2">
                <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase">
                  TODAY 15:04
                </span>
                <p className="text-sm font-sans text-zinc-200 font-medium leading-relaxed">
                  Audience signal: Followers are asking about AI agents.
                </p>
                <div className="pt-2 text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-zinc-400" />
                  <span>Source: Community Mind</span>
                </div>
              </div>
            </div>

            {/* Timeline Item 3 */}
            <div className="relative group">
              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-[#09090b] border-2 border-zinc-700 flex items-center justify-center">
                <Sliders className="w-2.5 h-2.5 text-zinc-400" />
              </div>

              <div className="motion-card p-5 rounded-xl border border-[#1f1f23] space-y-2">
                <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase">
                  YESTERDAY 11:22
                </span>
                <p className="text-sm font-sans text-zinc-200 font-medium leading-relaxed">
                  Preference: Creator dislikes excessive emojis.
                </p>
                <div className="pt-2 text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-zinc-400" />
                  <span>Source: Feedback loop</span>
                </div>
              </div>
            </div>

            {/* Dynamic Memory Nodes Ingested from Backend */}
            {memoryNodes.map((node, i) => (
              <div key={node.node_id || i} className="relative group">
                <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-[#09090b] border-2 border-emerald-500/80 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <div className="motion-card p-5 rounded-xl border border-[#1f1f23] space-y-2">
                  <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase">
                    PERSISTED NODE #{i + 1}
                  </span>
                  <p className="text-sm font-sans text-zinc-200 font-medium leading-relaxed">
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
