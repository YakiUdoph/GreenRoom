import React from 'react';
import { Terminal, Play } from 'lucide-react';
import { ImpMessageStream } from '../components/activity/ImpMessageStream';

export function SystemPage({ mindsStatus, memoryState, impMessages, onInspectPayload, onRunStep, onRunFullDemo, onResetState, isExecuting }) {
  return (
    <div className="flex-1 p-8 md:p-10 space-y-8 max-w-[1400px]">
      <div className="flex items-start justify-between border-b border-[#18181b] pb-8">
        <div className="space-y-2">
          <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tight text-white uppercase">
            SYSTEM
          </h1>
          <p className="text-sm font-sans text-zinc-400">
            Raw Developer Command Center & Protocol Stream.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRunFullDemo}
            disabled={isExecuting}
            className="px-4 py-2 bg-emerald-500 text-zinc-950 font-mono text-xs font-bold uppercase rounded shadow flex items-center gap-1.5 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Run 5-Min Demo
          </button>
          <button
            onClick={onResetState}
            disabled={isExecuting}
            className="px-3 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-rose-400 font-mono text-xs rounded"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ImpMessageStream messages={impMessages} onInspectPayload={onInspectPayload} />
      </div>
    </div>
  );
}
