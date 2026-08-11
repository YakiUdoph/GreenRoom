import React from 'react';
import { motion } from 'framer-motion';
import { KineticNoirCore } from '../components/mind/KineticNoirCore';

export function HomePage({ memoryState, activeCards, onNavigate, onRunFullDemo, isExecuting }) {
  const creatorName = memoryState?.creator_name || 'CREATOR';

  const intelligenceCells = [
    {
      id: 1,
      tag: '08:14 UTC',
      type: 'AUDIENCE SIGNAL',
      icon: 'radar',
      title: 'New Audience Signal',
      body: 'Spike in engagement from deep-tech demographic regarding your recent architectural post.',
    },
    {
      id: 2,
      tag: '04:22 UTC',
      type: 'CONTENT PATTERN',
      icon: 'pattern',
      title: 'Content Pattern',
      body: 'Long-form editorial pieces are outperforming short snippets by 314% this quarter.',
    },
    {
      id: 3,
      tag: 'SCOUT MIND',
      type: 'TREND DETECTED',
      icon: 'troubleshoot',
      title: 'Trend Detected',
      body: 'Emerging narrative around "Kinetic Noir" design principles aligning with your core aesthetic.',
    },
    {
      id: 4,
      tag: '01:05 UTC',
      type: 'OPPORTUNITY',
      icon: 'key_visualizer',
      title: 'Opportunity Found',
      body: 'High probability of success for a deep-dive tutorial on procedural shader integration.',
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 pb-20 text-on-background font-sans">
      {/* Hero Header Area */}
      <section className="relative w-full border-b border-outline-variant/60 px-6 md:px-12 py-12 md:py-16 bg-gradient-to-b from-surface-container-low/40 to-transparent">
        <div className="max-w-container-max mx-auto w-full space-y-6">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-primary-fixed animate-pulse shadow-[0_0_12px_#72ff70]" />
            <span className="font-mono text-primary-fixed uppercase tracking-widest text-xs font-bold">
              System Active • AI Chief of Staff
            </span>
          </div>

          <div className="space-y-2 max-w-4xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-on-surface leading-tight tracking-tight">
              GOOD MORNING, {creatorName}.<br />
              <span className="text-primary-fixed drop-shadow-[0_0_15px_rgba(114,255,112,0.35)]">
                Greenroom is online.
              </span>
            </h1>
            <p className="text-sm md:text-base font-sans text-on-surface-variant max-w-2xl border-l-2 border-primary-fixed/60 pl-4 py-1 leading-relaxed">
              I've been working while you were away. Analyzing 14,203 data points across your networked ecosystems.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="px-6 md:px-12 pt-12 max-w-container-max mx-auto w-full space-y-12">
        {/* WHILE YOU WERE AWAY Section */}
        <div className="space-y-6">
          <h2 className="text-xs font-mono text-on-surface-variant uppercase tracking-widest flex items-center gap-2 font-semibold">
            <span className="w-4 h-[1px] bg-outline-variant block" />
            WHILE YOU WERE AWAY
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {intelligenceCells.map((cell, index) => (
              <motion.div
                key={cell.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="noir-card p-6 flex flex-col justify-between space-y-6 cursor-pointer group"
              >
                <div className="flex justify-between items-start">
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary-fixed transition-colors text-2xl">
                    {cell.icon}
                  </span>
                  <span className="font-mono text-[11px] text-primary-fixed font-bold bg-background/80 px-2.5 py-1 rounded border border-outline-variant">
                    {cell.tag}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-sans font-bold text-on-surface group-hover:text-primary-fixed transition-colors">
                    {cell.title}
                  </h3>
                  <p className="text-xs font-sans text-on-surface-variant leading-relaxed">
                    {cell.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* GREENROOM'S TAKE & Recommendation Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Narrative Analysis */}
          <div className="lg:col-span-7 noir-card p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-mono text-on-surface-variant uppercase tracking-widest flex items-center gap-2 font-semibold">
                <span className="w-4 h-[1px] bg-outline-variant block" />
                GREENROOM'S TAKE
              </h3>

              <div className="text-xl md:text-2xl font-display font-bold text-on-surface leading-snug">
                Your audience is demanding depth. The superficial metrics are plateauing, but{' '}
                <span className="text-primary-fixed">high-intent engagement</span> on technical, architectural breakdowns is surging.
              </div>

              <p className="text-xs md:text-sm font-sans text-on-surface-variant leading-relaxed">
                Based on Scout Mind analysis over the last 72 hours, the intersection of 'kinetic motion' and 'noir aesthetics' is an under-served niche. The system recommends pivoting your upcoming content cycle to focus on this synthesis.
              </p>
            </div>

            <div className="pt-6 border-t border-outline-variant/60 flex items-center justify-between font-mono text-xs">
              <span className="text-on-surface-variant">Macro Trend Match: 94%</span>
              <button
                onClick={() => onNavigate('memory')}
                className="text-primary-fixed hover:underline font-bold flex items-center gap-1"
              >
                Inspect Memory DNA →
              </button>
            </div>
          </div>

          {/* Primary Recommendation Card */}
          <div className="lg:col-span-5 noir-card p-8 flex flex-col justify-between space-y-6 border-l-2 border-l-primary-fixed">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-fixed text-base">priority_high</span>
                <span className="font-mono text-primary-fixed text-xs uppercase tracking-wider font-bold">
                  Primary Recommendation
                </span>
              </div>

              <h3 className="text-2xl font-display font-bold text-on-surface">
                The Kinetic Noir Manifesto
              </h3>

              <div className="flex items-start gap-3 p-4 bg-background/80 rounded border border-outline-variant">
                <span className="material-symbols-outlined text-primary-fixed text-lg mt-0.5">check_circle</span>
                <div className="space-y-1">
                  <span className="text-xs font-mono text-on-surface font-bold block">THE WHY</span>
                  <span className="text-xs font-sans text-on-surface-variant leading-relaxed">
                    314% higher retention on deep-dive content. Matches macro-trend detected by Scout Mind.
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onRunFullDemo}
              disabled={isExecuting}
              className="w-full bg-primary-container text-on-primary-container text-sm font-sans font-bold py-4 px-6 hover:bg-primary-fixed-dim transition-colors flex justify-center items-center gap-2 rounded disabled:opacity-50 shadow-lg shadow-primary-container/20"
            >
              <span>Build This</span>
              <span className="material-symbols-outlined text-base font-bold">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* INTELLIGENCE FIELD AI CORE */}
        <div className="space-y-4">
          <h2 className="text-xs font-mono text-on-surface-variant uppercase tracking-widest flex items-center gap-2 font-semibold">
            <span className="w-4 h-[1px] bg-outline-variant block" />
            INTELLIGENCE FIELD
          </h2>

          <KineticNoirCore onCoreClick={onRunFullDemo} />
        </div>
      </div>
    </div>
  );
}
