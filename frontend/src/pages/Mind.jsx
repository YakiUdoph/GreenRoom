import React from 'react';
import { MindTopology } from '../components/mind/MindTopology';
import { Cpu, ShieldCheck, Zap, Database } from 'lucide-react';

export function Mind({
  mindsStatus,
  impMessages,
  onRunStep,
  isExecuting,
}) {
  const isConnected = mindsStatus?.mode === 'production' && mindsStatus?.connected;
  const isMock = mindsStatus?.is_mock || mindsStatus?.demo_mode_active;
  const realMind = mindsStatus?.real_platform_mind || {};

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest bg-cyan-950/60 border border-cyan-800 px-3 py-1 rounded-full">
              MIND TOPOLOGY & ARCHITECTURE
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mt-2">
            Chief of Staff & Specialist Sub-Minds
          </h1>
          <p className="text-sm text-slate-400">
            One primary Chief of Staff coordinating specialized domain algorithms.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <div className={`p-3 rounded-xl border flex items-center gap-2 ${
            isConnected
              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
              : 'bg-amber-950/80 text-amber-400 border-amber-800'
          }`}>
            <ShieldCheck className="w-4 h-4" />
            <span>{isConnected ? 'Real Mind Verified' : 'Mock Demo Mode Active'}</span>
          </div>
        </div>
      </div>

      {/* Main Topology & Visualizer Component */}
      <MindTopology
        activeMind="GreenroomCore"
        currentState={isExecuting ? 'COLLABORATING' : 'IDLE'}
      />

      {/* Mind Technical Metadata & Credentials */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Real Mind Verification Box */}
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              Platform Mind Credentials
            </h3>
            <span className="text-[10px] font-mono text-slate-500">api.build.hellominds.ai</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="text-slate-500">Platform Mind ID</span>
              <span className="text-cyan-400 font-bold">{realMind.mindId || '8208493e-f36b-1410-8466-00039ce7df11'}</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="text-slate-500">Mind Email</span>
              <span className="text-slate-200">{realMind.email || 'udophia@hellominds.ai'}</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="text-slate-500">Mind Wallet</span>
              <span className="text-slate-300 truncate max-w-[200px]">{realMind.walletAddress || '0xB675Ec9857776678aE540cF3248d898f015987Cb'}</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="text-slate-500">Verification Status</span>
              <span className={isConnected ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {isConnected ? 'VERIFIED (100%)' : 'MOCK DEMO MODE'}
              </span>
            </div>
          </div>
        </div>

        {/* Registered Skills & Controls */}
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Specialist Skill Execution
              </h3>
              <span className="text-[10px] font-mono text-slate-500">Local Orchestration</span>
            </div>

            <div className="space-y-2 mt-4 text-xs font-sans">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-200 block">search_trends (Scout Mind)</span>
                  <span className="text-slate-400 text-[11px]">Filters raw trends against creator brand matrix.</span>
                </div>
                <button
                  onClick={() => onRunStep(2)}
                  disabled={isExecuting}
                  className="px-3 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 font-mono text-[11px] font-bold border border-cyan-800 rounded-lg transition disabled:opacity-50"
                >
                  Run Skill
                </button>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-200 block">analyze_comments (Community Mind)</span>
                  <span className="text-slate-400 text-[11px]">Evaluates audience sentiment & requested hooks.</span>
                </div>
                <button
                  onClick={() => onRunStep(3)}
                  disabled={isExecuting}
                  className="px-3 py-1 bg-amber-950 hover:bg-amber-900 text-amber-300 font-mono text-[11px] font-bold border border-amber-800 rounded-lg transition disabled:opacity-50"
                >
                  Run Skill
                </button>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-200 block">score_deal (Business Mind)</span>
                  <span className="text-slate-400 text-[11px]">Monetization CPM target matching & pitch generator.</span>
                </div>
                <button
                  onClick={() => onRunStep(4)}
                  disabled={isExecuting}
                  className="px-3 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 font-mono text-[11px] font-bold border border-emerald-800 rounded-lg transition disabled:opacity-50"
                >
                  Run Skill
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
