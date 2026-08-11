import React from 'react';
import { ImpMessageStream } from '../components/activity/ImpMessageStream';
import { StateStoreInspector } from '../components/memory/StateStoreInspector';

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
  const stepLabels = {
    1: 'Step 1: Profile',
    2: 'Step 2: Trends',
    3: 'Step 3: Strategy',
    4: 'Step 4: Business',
    5: 'Step 5: Learn',
  };

  return (
    <div className="flex-1 p-6 md:p-10 space-y-8 max-w-container-max mx-auto text-white relative z-10">
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
            Technical under-the-hood inspection of Animoca Brands Minds Builder API connectivity and inter-mind IMP bus messages.
          </p>
        </div>

        <div className="flex flex-wrap items-center bg-[#111115] border border-outline-variant rounded p-1.5 gap-2 shadow-xl">
          <button
            onClick={onRunFullDemo}
            disabled={isExecuting}
            className="px-4 py-2 bg-primary-container text-on-primary-container text-xs font-mono font-bold uppercase rounded hover:bg-primary-fixed-dim transition-colors disabled:opacity-50"
          >
            Run Agent Pipeline
          </button>

          <div className="h-4 w-px bg-outline-variant mx-1" />

          {[1, 2, 3, 4, 5].map((step) => (
            <button
              key={step}
              onClick={() => onRunStep(step)}
              disabled={isExecuting}
              className="px-3 py-1.5 text-zinc-300 hover:text-white hover:bg-[#142616] rounded text-xs font-mono font-bold transition disabled:opacity-50"
              title={stepLabels[step]}
            >
              {stepLabels[step]}
            </button>
          ))}

          <div className="h-4 w-px bg-outline-variant mx-1" />

          <button
            onClick={onResetState}
            disabled={isExecuting}
            className="px-3 py-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 rounded text-xs font-mono font-bold transition disabled:opacity-50"
          >
            Reset State
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-12 gap-6 relative z-10">
        <div className="col-span-12 lg:col-span-8">
          <ImpMessageStream
            messages={impMessages}
            onInspectPayload={onInspectPayload}
          />
        </div>

        <div className="col-span-12 lg:col-span-4">
          <StateStoreInspector memoryState={memoryState} />
        </div>
      </div>
    </div>
  );
}

export default SystemPage;
