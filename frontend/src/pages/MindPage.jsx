import React from 'react';
import { Disc, ShieldCheck, Zap, Cpu } from 'lucide-react';

export function MindPage({ mindsStatus, onRunStep, isExecuting }) {
  const isConnected = mindsStatus?.mode === 'production' && mindsStatus?.connected;
  const realMind = mindsStatus?.real_platform_mind || {};

  return (
    <div className="flex-1 p-8 md:p-10 space-y-10 max-w-[1400px]">
      <div className="flex items-start justify-between border-b border-[#18181b] pb-8">
        <div className="space-y-2">
          <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tight text-white uppercase">
            MIND TOPOLOGY
          </h1>
          <p className="text-sm font-sans text-zinc-400">
            Chief of Staff & Specialist Sub-Mind Architecture.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-full bg-[#0d1512] border border-[#1b3d2f] text-emerald-400 text-xs font-mono font-medium flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          <span>{isConnected ? 'Real Mind Verified' : 'Mock Demo Mode'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="motion-card p-6 rounded-xl border border-[#1f1f23] space-y-4">
          <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            PLATFORM MIND CREDENTIALS
          </h3>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between p-3 bg-[#09090b] rounded border border-[#1f1f23]">
              <span className="text-zinc-500">Mind ID</span>
              <span className="text-emerald-400 font-bold">{realMind.mindId || '8208493e-f36b-1410-8466-00039ce7df11'}</span>
            </div>
            <div className="flex justify-between p-3 bg-[#09090b] rounded border border-[#1f1f23]">
              <span className="text-zinc-500">Mind Email</span>
              <span className="text-zinc-200">{realMind.email || 'udophia@hellominds.ai'}</span>
            </div>
          </div>
        </div>

        <div className="motion-card p-6 rounded-xl border border-[#1f1f23] space-y-4">
          <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            SPECIALIST SKILL ORCHESTRATION
          </h3>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center p-3 bg-[#09090b] rounded border border-[#1f1f23]">
              <span>ScoutMind (search_trends)</span>
              <button onClick={() => onRunStep(2)} disabled={isExecuting} className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded font-bold">Execute</button>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#09090b] rounded border border-[#1f1f23]">
              <span>CommunityMind (analyze_comments)</span>
              <button onClick={() => onRunStep(3)} disabled={isExecuting} className="px-3 py-1 bg-amber-950 text-amber-400 border border-amber-800 rounded font-bold">Execute</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
