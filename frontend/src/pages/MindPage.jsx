import React from 'react';
import { motion } from 'framer-motion';
import { MindMotionBackground } from '../components/motion/MindMotionBackground';

export function MindPage({ mindsStatus, onRunStep, isExecuting }) {
  const realMind = mindsStatus?.real_platform_mind || {};

  return (
    <MindMotionBackground>
      <div className="flex-1 p-8 md:p-12 space-y-12 max-w-container-max mx-auto text-white">
        {/* Header */}
        <div className="border-b border-[#72ff70]/30 pb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary-fixed text-3xl">psychology</span>
              <span className="font-mono text-xs text-primary-fixed uppercase tracking-widest font-bold bg-[#142616] px-3 py-1 rounded border border-[#234d28]">
                MIND ARCHITECTURE & SYNAPSE CORE
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-white uppercase tracking-tight">
              Chief of Staff & Specialist Minds
            </h1>
            <p className="text-sm md:text-base font-sans text-zinc-100 mt-2 font-medium">
              Animoca Brands Minds Builder Platform Integration (`8208493e-f36b-1410-8466-00039ce7df11`).
            </p>
          </div>

          <div className="px-4 py-2.5 bg-[#142616]/90 border border-[#234d28] rounded font-mono text-xs text-primary-fixed font-bold flex items-center gap-2.5 backdrop-blur-md shadow-lg shadow-[#72ff70]/10">
            <span className="w-2.5 h-2.5 rounded-full bg-primary-fixed animate-pulse shadow-[0_0_10px_#72ff70]" />
            <span>SYNAPSE GATEWAY ONLINE</span>
          </div>
        </div>

        {/* 2-Column Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Platform Identity Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="noir-card p-8 space-y-6 bg-[#121418]/90 backdrop-blur-md border border-[#72ff70]/30 shadow-2xl"
          >
            <div className="flex justify-between items-center border-b border-outline-variant/60 pb-4">
              <h2 className="font-mono text-xs font-bold text-primary-fixed uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">verified</span>
                PLATFORM MIND IDENTITY
              </h2>
              <span className="font-mono text-xs text-zinc-300 font-bold bg-[#111115] px-2.5 py-1 rounded border border-outline-variant">
                IMP v1.0
              </span>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 bg-[#0a0c0e] border border-outline-variant/80 rounded flex justify-between items-center">
                <span className="text-zinc-300 font-bold">Platform UUID</span>
                <span className="text-primary-fixed font-bold text-sm">{realMind.mindId || '8208493e-f36b-1410-8466-00039ce7df11'}</span>
              </div>

              <div className="p-4 bg-[#0a0c0e] border border-outline-variant/80 rounded flex justify-between items-center">
                <span className="text-zinc-300 font-bold">Mind Email</span>
                <span className="text-white font-semibold text-sm">{realMind.email || 'udophia@hellominds.ai'}</span>
              </div>

              <div className="p-4 bg-[#0a0c0e] border border-outline-variant/80 rounded flex justify-between items-center">
                <span className="text-zinc-300 font-bold">Wallet Address</span>
                <span className="text-zinc-200 font-mono truncate max-w-[220px] font-medium">{realMind.walletAddress || '0xB675Ec9857776678aE540cF3248d898f015987Cb'}</span>
              </div>
            </div>
          </motion.div>

          {/* Specialist Skills Orchestration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="noir-card p-8 space-y-6 bg-[#121418]/90 backdrop-blur-md border border-[#72ff70]/30 shadow-2xl"
          >
            <div className="flex justify-between items-center border-b border-outline-variant/60 pb-4">
              <h2 className="font-mono text-xs font-bold text-primary-fixed uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">neurology</span>
                SPECIALIST SKILL ORCHESTRATION
              </h2>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 bg-[#0a0c0e] border border-outline-variant/80 rounded flex justify-between items-center group">
                <div>
                  <span className="block font-bold text-white text-base">ScoutMind</span>
                  <span className="text-zinc-300 text-xs font-medium">Skill: search_trends (Fit Score: 0.92)</span>
                </div>
                <button
                  onClick={() => onRunStep(2)}
                  disabled={isExecuting}
                  className="px-4 py-2.5 bg-primary-container text-on-primary-container font-bold rounded hover:bg-primary-fixed-dim transition-colors disabled:opacity-50 shadow-md shadow-primary-container/20"
                >
                  Execute
                </button>
              </div>

              <div className="p-4 bg-[#0a0c0e] border border-outline-variant/80 rounded flex justify-between items-center group">
                <div>
                  <span className="block font-bold text-white text-base">CommunityMind</span>
                  <span className="text-zinc-300 text-xs font-medium">Skill: analyze_comments (Demand: 88%)</span>
                </div>
                <button
                  onClick={() => onRunStep(3)}
                  disabled={isExecuting}
                  className="px-4 py-2.5 bg-primary-container text-on-primary-container font-bold rounded hover:bg-primary-fixed-dim transition-colors disabled:opacity-50 shadow-md shadow-primary-container/20"
                >
                  Execute
                </button>
              </div>

              <div className="p-4 bg-[#0a0c0e] border border-outline-variant/80 rounded flex justify-between items-center group">
                <div>
                  <span className="block font-bold text-white text-base">BusinessMind</span>
                  <span className="text-zinc-300 text-xs font-medium">Skill: score_deal ($5,400 Pitch)</span>
                </div>
                <button
                  onClick={() => onRunStep(4)}
                  disabled={isExecuting}
                  className="px-4 py-2.5 bg-primary-container text-on-primary-container font-bold rounded hover:bg-primary-fixed-dim transition-colors disabled:opacity-50 shadow-md shadow-primary-container/20"
                >
                  Execute
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </MindMotionBackground>
  );
}
