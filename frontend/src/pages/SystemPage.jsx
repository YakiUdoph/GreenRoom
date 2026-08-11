import React from 'react';
import { ImpMessageStream } from '../components/activity/ImpMessageStream';

export function SystemPage({ mindsStatus, memoryState, impMessages, onInspectPayload, onRunStep, onRunFullDemo, onResetState, isExecuting }) {
  return (
    <div className="flex-1 p-8 md:p-12 space-y-12 max-w-container-max mx-auto text-on-background">
      <div className="border-b border-outline-variant pb-8 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary-fixed">terminal</span>
            <span className="font-mono text-xs text-primary-fixed uppercase tracking-widest font-bold">
              SYSTEM COMMAND CENTER
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-on-surface uppercase">
            Protocol Stream & Architecture Inspector
          </h1>
          <p className="text-sm font-sans text-on-surface-variant mt-2">
            Technical under-the-hood inspection of Animoca Brands Minds Builder platform connectivity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRunFullDemo}
            disabled={isExecuting}
            className="px-5 py-2.5 bg-primary-container text-on-primary-container font-mono text-xs font-bold uppercase rounded hover:bg-primary-fixed-dim transition-colors disabled:opacity-50"
          >
            Run 5-Min Briefing
          </button>
          <button
            onClick={onResetState}
            disabled={isExecuting}
            className="px-4 py-2.5 bg-surface-container-low border border-outline-variant text-on-surface-variant hover:text-on-surface font-mono text-xs rounded"
          >
            Reset State
          </button>
        </div>
      </div>

      <div className="bg-surface-container-low border border-outline-variant p-8 rounded">
        <ImpMessageStream messages={impMessages} onInspectPayload={onInspectPayload} />
      </div>
    </div>
  );
}
