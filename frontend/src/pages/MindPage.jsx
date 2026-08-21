import React from 'react';
import { motion } from 'framer-motion';
import { MindTopology } from '../components/mind/MindTopology';

export function MindPage({ mindsStatus, onRunStep, isExecuting }) {
  const isConnected = mindsStatus?.mode === 'production' && mindsStatus?.connected;
  const realMind = mindsStatus?.real_platform_mind || {};

  return (
    <div className="manus-route manus-route--mind flex-1 p-6 md:p-10 space-y-8 max-w-container-max mx-auto text-white">
      {/* Header Bar */}
      <div className="border-b border-[#72ff70]/30 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary-fixed text-2xl">psychology</span>
            <span className="font-mono text-xs text-primary-fixed uppercase tracking-widest font-bold bg-[#142616] px-3 py-0.5 rounded border border-[#234d28]">
              MEET YOUR AI STAFF • MULTI-MIND COMMAND CENTER
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white uppercase tracking-tight">
            Chief of Staff & Specialist Team
          </h1>
          <p className="text-xs md:text-sm font-sans text-zinc-200 mt-1 font-medium">
            One primary Chief of Staff coordinating specialized domain algorithms to manage creator operations.
          </p>
        </div>

        <div className="px-4 py-2 bg-[#142616]/90 border border-[#234d28] rounded font-mono text-xs text-primary-fixed font-bold flex items-center gap-2.5 backdrop-blur-md shadow-lg shadow-[#72ff70]/10">
          <span className="w-2.5 h-2.5 rounded-full bg-primary-fixed animate-pulse shadow-[0_0_10px_#72ff70]" />
          <span>{isConnected ? 'PLATFORM MIND VERIFIED' : 'SYNAPSE GATEWAY ONLINE'}</span>
        </div>
      </div>

      {/* Main Redesigned Interactive Mind Topology */}
      <MindTopology
        activeMind="GreenroomCore"
        currentState={isExecuting ? 'COLLABORATING' : 'IDLE'}
        onRunStep={onRunStep}
        isExecuting={isExecuting}
      />

      {/* Verified Platform Mind Identity & Security Credentials */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Platform Identity Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="noir-card p-6 space-y-5 bg-[#121418]/90 backdrop-blur-md border border-[#72ff70]/30 shadow-xl"
        >
          <div className="flex justify-between items-center border-b border-outline-variant/60 pb-3">
            <h2 className="font-mono text-xs font-bold text-primary-fixed uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-base">verified</span>
              ANIMOCA BRANDS PLATFORM MIND IDENTITY
            </h2>
            <span className="font-mono text-xs text-zinc-300 font-bold bg-[#111115] px-2.5 py-0.5 rounded border border-outline-variant">
              IMP v1.0
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 bg-[#0a0c0e] border border-outline-variant/80 rounded flex justify-between items-center">
              <span className="text-zinc-400 font-bold">Platform Mind UUID</span>
              <span className="text-primary-fixed font-bold text-xs">{realMind.mindId || '8208493e-f36b-1410-8466-00039ce7df11'}</span>
            </div>

            <div className="p-3 bg-[#0a0c0e] border border-outline-variant/80 rounded flex justify-between items-center">
              <span className="text-zinc-400 font-bold">Mind Developer Email</span>
              <span className="text-white font-semibold text-xs">{realMind.email || 'antigravity@greenroom.ai'}</span>
            </div>

            <div className="p-3 bg-[#0a0c0e] border border-outline-variant/80 rounded flex justify-between items-center">
              <span className="text-zinc-400 font-bold">Mind Wallet Address</span>
              <span className="text-zinc-200 font-mono truncate max-w-[220px] text-xs">{realMind.walletAddress || '0x72ff70...002203'}</span>
            </div>
          </div>
        </motion.div>

        {/* Real-time Gateway Security & Memory Routing Matrix */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="noir-card p-6 space-y-5 bg-[#121418]/90 backdrop-blur-md border border-[#72ff70]/30 shadow-xl"
        >
          <div className="flex justify-between items-center border-b border-outline-variant/60 pb-3">
            <h2 className="font-mono text-xs font-bold text-primary-fixed uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-base">security</span>
              MEMORY ROUTING & SECURITY GATEWAY
            </h2>
            <span className="font-mono text-xs text-primary-fixed font-bold bg-[#142616] px-2.5 py-0.5 rounded border border-[#234d28]">
              ACTIVE
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 bg-[#0a0c0e] border border-outline-variant/80 rounded flex justify-between items-center">
              <span className="text-zinc-400 font-bold">Inter-Mind Protocol (IMP)</span>
              <span className="text-primary-fixed font-bold text-xs">v1.0 Event Bus (Active)</span>
            </div>

            <div className="p-3 bg-[#0a0c0e] border border-outline-variant/80 rounded flex justify-between items-center">
              <span className="text-zinc-400 font-bold">Persistent Memory Engine</span>
              <span className="text-white font-semibold text-xs">creator_profile.json (Synced)</span>
            </div>

            <div className="p-3 bg-[#0a0c0e] border border-outline-variant/80 rounded flex justify-between items-center">
              <span className="text-zinc-400 font-bold">Specialist Sub-Minds</span>
              <span className="text-primary-fixed font-bold text-xs">3 Domain Minds Online</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default MindPage;
