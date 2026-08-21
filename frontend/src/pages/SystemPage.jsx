import React from 'react';
import { ImpMessageStream } from '../components/activity/ImpMessageStream';
import { StateStoreInspector } from '../components/memory/StateStoreInspector';
import { soundFx } from '../lib/sound';

export function SystemPage({
  mindsStatus,
  memoryState,
  impMessages,
  onInspectPayload,
  onRunStep,
  onRunFullDemo,
  onResetState,
  isExecuting,
}) {
  const mode = mindsStatus?.mode || 'production';
  const isConnected = mindsStatus?.connected !== false;
  const mindUuid = mindsStatus?.mind_uuid || '8208493e-f36b-1410-8466-00039ce7df11';
  const persistenceMode = memoryState?.persistence_mode || 'LOCAL FILE';

  const stepLabels = {
    1: 'Step 1: Ingest Profile',
    2: 'Step 2: Scan Trends',
    3: 'Step 3: Draft Strategy',
    4: 'Step 4: Pitch Sponsor',
    5: 'Step 5: Extract Rules',
  };

  const handleStepClick = (step) => {
    soundFx.playSynapsePulse();
    onRunStep(step);
  };

  const handleRunFullDemoClick = () => {
    soundFx.playSynapsePulse();
    onRunFullDemo();
  };

  const handleResetStateClick = () => {
    soundFx.playSynapsePulse();
    onResetState();
  };

  return (
    <div className="manus-route manus-route--system flex-1 p-6 md:p-10 space-y-8 max-w-container-max mx-auto text-white relative z-10 font-sans">
      {/* Header */}
      <div className="border-b border-[#72ff70]/30 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary-fixed text-2xl">terminal</span>
            <span className="font-mono text-xs text-primary-fixed uppercase tracking-widest font-bold bg-[#142616] px-3 py-0.5 rounded border border-[#234d28]">
              SYSTEM & DEVELOPER COMMAND CENTER
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white uppercase tracking-tight">
            Protocol Stream & Architecture Inspector
          </h1>
          <p className="text-xs md:text-sm font-sans text-zinc-200 mt-1 font-medium">
            Technical under-the-hood diagnostic suite for Animoca Brands Minds SDK integration, IMP message bus, and persistent state.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center bg-[#0e1014] border border-outline-variant rounded-xl p-2 gap-2 shadow-2xl">
          <button
            onClick={handleRunFullDemoClick}
            disabled={isExecuting}
            className="px-4 py-2 bg-primary-container text-on-primary-container text-xs font-mono font-bold uppercase rounded hover:bg-primary-fixed-dim transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-primary-container/20"
          >
            <span className="material-symbols-outlined text-sm font-bold">play_arrow</span>
            <span>Run Pipeline</span>
          </button>

          <div className="h-4 w-px bg-outline-variant mx-1 hidden sm:block" />

          {[1, 2, 3, 4, 5].map((step) => (
            <button
              key={step}
              onClick={() => handleStepClick(step)}
              disabled={isExecuting}
              className="px-3 py-1.5 bg-[#111115] hover:bg-[#142616] text-zinc-300 hover:text-primary-fixed border border-outline-variant hover:border-[#234d28] rounded text-xs font-mono font-bold transition disabled:opacity-50"
              title={stepLabels[step]}
            >
              Step {step}
            </button>
          ))}

          <div className="h-4 w-px bg-outline-variant mx-1 hidden sm:block" />

          <button
            onClick={handleResetStateClick}
            disabled={isExecuting}
            className="px-3 py-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/60 rounded text-xs font-mono font-bold transition disabled:opacity-50 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-xs">restart_alt</span>
            <span>Reset State</span>
          </button>
        </div>
      </div>

      {/* SYSTEM HEALTH & CONNECTIVITY DIAGNOSTICS BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        {/* Metric 1: Minds SDK */}
        <div className="noir-card p-4 space-y-1.5 border-l-4 border-l-primary-fixed bg-[#0e1014]/90">
          <div className="flex justify-between items-center text-[10px] text-zinc-400 font-bold uppercase">
            <span>ANIMOCA MINDS SDK</span>
            <span className="text-primary-fixed bg-[#142616] px-2 py-0.5 rounded border border-[#234d28]">
              {mode.toUpperCase()} MODE
            </span>
          </div>
          <p className="text-sm font-bold text-white flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-primary-fixed animate-pulse' : 'bg-rose-500'}`} />
            <span>Greenroom Core Mind</span>
          </p>
          <p className="text-[10px] text-zinc-400 truncate">UUID: {mindUuid}</p>
        </div>

        {/* Metric 2: WebSocket IMP Gateway */}
        <div className="noir-card p-4 space-y-1.5 border-l-4 border-l-cyan-400 bg-[#0e1014]/90">
          <div className="flex justify-between items-center text-[10px] text-zinc-400 font-bold uppercase">
            <span>IMP WEBSOCKET GATEWAY</span>
            <span className="text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              LIVE /ws STREAM
            </span>
          </div>
          <p className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Inter-Mind Event Bus</span>
          </p>
          <p className="text-[10px] text-zinc-400">{impMessages.length} Messages Broadcasted</p>
        </div>

        {/* Metric 3: Persistence Engine */}
        <div className="noir-card p-4 space-y-1.5 border-l-4 border-l-amber-400 bg-[#0e1014]/90">
          <div className="flex justify-between items-center text-[10px] text-zinc-400 font-bold uppercase">
            <span>PERSISTENCE STORE</span>
            <span className="text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
              {persistenceMode}
            </span>
          </div>
          <p className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>creator_profile.json</span>
          </p>
          <p className="text-[10px] text-zinc-400">720H Recency Decay Engine Active</p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-12 gap-6 relative z-10">
        <div className="col-span-12 lg:col-span-7">
          <ImpMessageStream
            messages={impMessages}
            onInspectPayload={onInspectPayload}
          />
        </div>

        <div className="col-span-12 lg:col-span-5">
          <StateStoreInspector memoryState={memoryState} />
        </div>
      </div>
    </div>
  );
}

export default SystemPage;
