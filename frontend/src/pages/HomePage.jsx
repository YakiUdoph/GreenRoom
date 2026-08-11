import React from 'react';
import { motion } from 'framer-motion';
import { KineticNoirCore } from '../components/mind/KineticNoirCore';

export function HomePage({ memoryState, activeCards, onNavigate, onRunFullDemo, isExecuting }) {
  const creatorName = memoryState?.creator_name || 'CREATOR';

  return (
    <div className="flex-1 flex flex-col min-w-0 pb-24 text-on-background font-sans">
      {/* Hero Area */}
      <section className="relative w-full min-h-[50vh] flex flex-col justify-end px-margin-mobile md:px-margin-desktop py-16 md:py-20 border-b border-outline-variant overflow-hidden">
        <div className="relative z-10 max-w-container-max mx-auto w-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2.5 h-2.5 rounded-full bg-primary-fixed animate-pulse shadow-[0_0_10px_#72ff70]"></div>
            <span className="font-mono text-primary-fixed uppercase tracking-widest text-xs font-bold">
              System Active
            </span>
          </div>

          <h2 className="text-3xl md:text-6xl font-display text-on-surface mb-4 max-w-4xl leading-tight font-bold">
            GOOD MORNING, {creatorName}.<br />
            <span className="text-primary-fixed">Greenroom is online.</span>
          </h2>

          <p className="text-base font-sans text-on-surface-variant max-w-2xl border-l border-outline-variant pl-4 py-1 leading-relaxed">
            I've been working while you were away. Analyzing 14,203 data points across your networked ecosystems.
          </p>
        </div>
      </section>

      {/* Fluid Grid Content Area */}
      <div className="px-margin-mobile md:px-margin-desktop pt-16 max-w-container-max mx-auto w-full space-y-16">
        {/* Section: WHILE YOU WERE AWAY */}
        <div>
          <h3 className="text-xs font-mono text-on-surface-variant mb-6 flex items-center gap-2 tracking-wider">
            <span className="w-4 h-[1px] bg-outline-variant block"></span>
            WHILE YOU WERE AWAY
          </h3>

          {/* Cell-based Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 cell-border rounded overflow-hidden">
            {/* Card 1 */}
            <motion.div
              whileHover={{ backgroundColor: '#1c1b1b' }}
              className="p-6 md:cell-border-r cell-border-b md:cell-border-b-0 transition-colors duration-300 group cursor-pointer"
            >
              <div className="flex justify-between items-start mb-12">
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary-fixed transition-colors">
                  radar
                </span>
                <span className="font-mono text-xs text-on-surface-variant">08:14 UTC</span>
              </div>
              <h4 className="text-base font-sans font-semibold text-on-surface mb-2">New Audience Signal</h4>
              <p className="text-xs font-sans text-on-surface-variant leading-relaxed">
                Spike in engagement from deep-tech demographic regarding your recent architectural post.
              </p>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              whileHover={{ backgroundColor: '#1c1b1b' }}
              className="p-6 md:cell-border-r cell-border-b md:cell-border-b-0 transition-colors duration-300 group cursor-pointer"
            >
              <div className="flex justify-between items-start mb-12">
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary-fixed transition-colors">
                  pattern
                </span>
                <span className="font-mono text-xs text-on-surface-variant">04:22 UTC</span>
              </div>
              <h4 className="text-base font-sans font-semibold text-on-surface mb-2">Content Pattern</h4>
              <p className="text-xs font-sans text-on-surface-variant leading-relaxed">
                Long-form editorial pieces are outperforming short snippets by 314% this quarter.
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              whileHover={{ backgroundColor: '#1c1b1b' }}
              className="p-6 md:cell-border-r cell-border-b md:cell-border-b-0 transition-colors duration-300 group cursor-pointer"
            >
              <div className="flex justify-between items-start mb-12">
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary-fixed transition-colors">
                  troubleshoot
                </span>
                <span className="font-mono text-xs text-primary-fixed font-bold">SCOUT MIND</span>
              </div>
              <h4 className="text-base font-sans font-semibold text-on-surface mb-2">Trend Detected</h4>
              <p className="text-xs font-sans text-on-surface-variant leading-relaxed">
                Emerging narrative around "Kinetic Noir" design principles aligning with your core aesthetic.
              </p>
            </motion.div>

            {/* Card 4 */}
            <motion.div
              whileHover={{ backgroundColor: '#1c1b1b' }}
              className="p-6 transition-colors duration-300 group cursor-pointer"
            >
              <div className="flex justify-between items-start mb-12">
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary-fixed transition-colors">
                  key_visualizer
                </span>
                <span className="font-mono text-xs text-on-surface-variant">01:05 UTC</span>
              </div>
              <h4 className="text-base font-sans font-semibold text-primary-fixed mb-2">Opportunity Found</h4>
              <p className="text-xs font-sans text-on-surface-variant leading-relaxed">
                High probability of success for a deep-dive tutorial on procedural shader integration.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Asymmetric Layout: Editorial & Recommendation */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
          {/* Greenroom's Take Editorial */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-mono text-on-surface-variant flex items-center gap-2 tracking-wider">
                <span className="w-4 h-[1px] bg-outline-variant block"></span>
                GREENROOM'S TAKE
              </h3>

              <div className="text-2xl md:text-3xl font-sans font-semibold text-on-surface leading-snug">
                Your audience is demanding depth. The superficial metrics are plateauing, but{' '}
                <span className="text-primary-fixed">high-intent engagement</span> on technical, architectural breakdowns is surging.
              </div>

              <p className="text-sm font-sans text-on-surface-variant leading-relaxed">
                Based on the Scout Mind's analysis over the last 72 hours, the intersection of 'kinetic motion' and 'noir aesthetics' is an under-served niche in your vertical. The system recommends pivoting your upcoming content cycle to focus exclusively on this synthesis.
              </p>
            </div>
          </div>

          {/* Primary Recommendation Card */}
          <div className="md:col-span-5">
            <div className="bg-surface-container-low border border-outline-variant p-8 relative overflow-hidden group rounded space-y-6">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-primary-fixed opacity-70"></div>

              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-fixed text-sm">priority_high</span>
                <span className="font-mono text-primary-fixed text-xs uppercase tracking-wider font-bold">
                  Primary Recommendation
                </span>
              </div>

              <h4 className="text-2xl font-sans font-bold text-on-surface">The Kinetic Noir Manifesto</h4>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary-fixed text-lg mt-0.5">check_circle</span>
                  <div>
                    <span className="text-xs font-mono text-on-surface block mb-1 font-bold">THE WHY</span>
                    <span className="text-xs font-sans text-on-surface-variant leading-relaxed">
                      314% higher retention on deep-dive content. Matches current macro-trend detected by Scout Mind.
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={onRunFullDemo}
                disabled={isExecuting}
                className="w-full bg-primary-container text-on-primary-container text-sm font-sans font-bold py-4 px-6 hover:bg-primary-fixed-dim transition-colors flex justify-center items-center gap-2 rounded disabled:opacity-50"
              >
                <span>Build This</span>
                <span className="material-symbols-outlined text-base font-bold">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        {/* Greenroom Core Visualization */}
        <div className="space-y-6">
          <h3 className="text-xs font-mono text-on-surface-variant flex items-center gap-2 tracking-wider">
            <span className="w-4 h-[1px] bg-outline-variant block"></span>
            INTELLIGENCE FIELD
          </h3>

          <KineticNoirCore onCoreClick={onRunFullDemo} />
        </div>
      </div>
    </div>
  );
}
