import React from 'react';
import { motion } from 'framer-motion';
import { User, Users, FileText, Flag, Sliders, RotateCw, Check, Sparkles, X } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

export function MemoryPage({ memoryState }) {
  const state = memoryState || {};
  const learnedRules = state.learned_voice_rules || [];
  const memoryNodes = state.memory_nodes || [];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="flex-1 p-8 md:p-10 space-y-10 max-w-[1400px]"
    >
      {/* Top Header Row */}
      <motion.div variants={itemVariants} className="flex items-start justify-between border-b border-[#18181b] pb-8">
        <div className="space-y-2">
          {/* Serif High-Contrast Title */}
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-6xl font-serif tracking-tight text-white uppercase font-bold"
          >
            MEMORY
          </motion.h1>
          <p className="text-sm font-sans text-zinc-400">
            Everything Greenroom has learned about you.
          </p>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="px-3.5 py-1.5 rounded-full bg-[#0d1512] border border-[#1b3d2f] text-emerald-400 text-xs font-mono font-medium flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>SYNTHESIZING CONTEXT</span>
          </motion.div>

          <button
            onClick={() => window.history.back()}
            className="p-1.5 text-zinc-500 hover:text-zinc-200 transition-colors rounded-lg"
            title="Close View"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Main Grid: CREATOR DNA vs MEMORY TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Section: CREATOR DNA (7 cols) */}
        <motion.div variants={itemVariants} className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-2 border-b border-[#18181b] pb-3">
            <span className="text-xs font-mono font-bold text-emerald-500 uppercase tracking-widest">
              CREATOR DNA
            </span>
          </div>

          {/* 2-Column Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1: VOICE */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -3, borderColor: '#27272a' }}
              className="motion-card p-6 rounded-xl border border-[#1f1f23] space-y-3"
            >
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
            </motion.div>

            {/* Card 2: AUDIENCE */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -3, borderColor: '#27272a' }}
              className="motion-card p-6 rounded-xl border border-[#1f1f23] space-y-3"
            >
              <Users className="w-5 h-5 text-zinc-400" />
              <div className="space-y-1">
                <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  AUDIENCE
                </h3>
                <p className="text-sm font-sans text-zinc-200 leading-relaxed font-medium">
                  Deep-tech enthusiasts, architects, digital minimalists.
                </p>
              </div>
            </motion.div>

            {/* Card 3: CONTENT */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -3, borderColor: '#27272a' }}
              className="motion-card p-6 rounded-xl border border-[#1f1f23] space-y-3"
            >
              <FileText className="w-5 h-5 text-zinc-400" />
              <div className="space-y-1">
                <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  CONTENT
                </h3>
                <p className="text-sm font-sans text-zinc-200 leading-relaxed font-medium">
                  Long-form breakdowns, technical deep-dives.
                </p>
              </div>
            </motion.div>

            {/* Card 4: GOALS */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -3, borderColor: '#27272a' }}
              className="motion-card p-6 rounded-xl border border-[#1f1f23] space-y-3"
            >
              <Flag className="w-5 h-5 text-zinc-400" />
              <div className="space-y-1">
                <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  GOALS
                </h3>
                <p className="text-sm font-sans text-zinc-200 leading-relaxed font-medium">
                  Establish authority in AI ethics, drive technical newsletter signups.
                </p>
              </div>
            </motion.div>

            {/* Card 5: PREFERENCES (Full Width) */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -3, borderColor: '#27272a' }}
              className="sm:col-span-2 motion-card p-6 rounded-xl border border-[#1f1f23] space-y-4"
            >
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
                    <motion.span
                      key={idx}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="px-3 py-1 bg-[#152a20] border border-[#1b4332] text-emerald-300 rounded text-xs font-mono uppercase tracking-wider font-medium"
                    >
                      {rule}
                    </motion.span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Section: MEMORY TIMELINE (5 cols) */}
        <motion.div variants={itemVariants} className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between border-b border-[#18181b] pb-3">
            <span className="text-xs font-mono font-bold text-emerald-500 uppercase tracking-widest">
              MEMORY TIMELINE
            </span>
            <RotateCw className="w-4 h-4 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer" />
          </div>

          {/* Timeline Panel with Animated Green Line */}
          <div className="relative pl-6 space-y-6">
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              style={{ originY: 0 }}
              className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-500/80 rounded-full"
            />

            {/* Timeline Item 1 */}
            <motion.div variants={itemVariants} className="relative group">
              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-[#09090b] border-2 border-emerald-500 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-timeline-dot" />
              </div>

              <motion.div
                whileHover={{ x: 3 }}
                className="motion-card p-5 rounded-xl border border-[#1f1f23] space-y-2"
              >
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
              </motion.div>
            </motion.div>

            {/* Timeline Item 2 */}
            <motion.div variants={itemVariants} className="relative group">
              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-[#09090b] border-2 border-zinc-700 flex items-center justify-center">
                <FileText className="w-2.5 h-2.5 text-zinc-400" />
              </div>

              <motion.div
                whileHover={{ x: 3 }}
                className="motion-card p-5 rounded-xl border border-[#1f1f23] space-y-2"
              >
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
              </motion.div>
            </motion.div>

            {/* Timeline Item 3 */}
            <motion.div variants={itemVariants} className="relative group">
              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-[#09090b] border-2 border-zinc-700 flex items-center justify-center">
                <Sliders className="w-2.5 h-2.5 text-zinc-400" />
              </div>

              <motion.div
                whileHover={{ x: 3 }}
                className="motion-card p-5 rounded-xl border border-[#1f1f23] space-y-2"
              >
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
              </motion.div>
            </motion.div>

            {/* Dynamic Nodes */}
            {memoryNodes.map((node, i) => (
              <motion.div key={node.node_id || i} variants={itemVariants} className="relative group">
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
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
