import React from 'react';
import { Terminal, ShieldCheck, Play, RefreshCw } from 'lucide-react';
import { ImpMessageStream } from '../components/activity/ImpMessageStream';
import { StateStoreInspector } from '../components/memory/StateStoreInspector';

export function System({
  mindsStatus,
  memoryState,
  impMessages,
  onInspectPayload,
  onRunStep,
  onRunFullDemo,
  onResetState,
  isExecuting,
}) {
  return (
    <div className="space-y-6 max-w-[1700px] mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest bg-amber-950/60 border border-amber-800 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              SYSTEM & DEVELOPER COMMAND CENTER
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-2">
            Raw Protocol Stream & Architecture Inspector
          </h1>
          <p className="text-xs text-slate-400">
            Technical under-the-hood inspection of Animoca Brands Minds Builder API connectivity and inter-mind IMP bus messages.
          </p>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
          <button
            onClick={onRunFullDemo}
            disabled={isExecuting}
            className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-md disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Run 5-Min Demo
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1"></div>

          {[1, 2, 3, 4, 5].map((step) => (
            <button
              key={step}
              onClick={() => onRunStep(step)}
              disabled={isExecuting}
              className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded text-xs font-mono font-medium transition disabled:opacity-50"
            >
              Min {step}
            </button>
          ))}

          <div className="h-4 w-px bg-slate-800 mx-1"></div>

          <button
            onClick={onResetState}
            disabled={isExecuting}
            className="px-2.5 py-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded text-xs font-medium transition disabled:opacity-50"
          >
            Reset State
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Inter-Mind Message Stream (7 cols) */}
        <div className="col-span-12 lg:col-span-8">
          <ImpMessageStream
            messages={impMessages}
            onInspectPayload={onInspectPayload}
          />
        </div>

        {/* Right Column: Persistent Memory State Store Inspector (4 cols) */}
        <div className="col-span-12 lg:col-span-4">
          <StateStoreInspector memoryState={memoryState} />
        </div>
      </div>
    </div>
  );
}
