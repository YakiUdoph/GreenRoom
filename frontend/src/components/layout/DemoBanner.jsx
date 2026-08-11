import React from 'react';
import { Loader2 } from 'lucide-react';

export function DemoBanner({ progress }) {
  if (!progress || (!progress.isRunning && progress.activeStep === 0)) {
    return null;
  }

  return (
    <div className="bg-slate-900/90 border border-emerald-800/60 rounded-xl p-3.5 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-3">
        <span className="text-emerald-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </span>
        <div>
          <span className="font-bold text-sm text-emerald-400">
            {progress.stepTitle || 'Executing Agent Pipeline Step...'}
          </span>
          <p className="text-xs text-slate-400">
            {progress.stepDesc || 'Orchestrating agent protocol communication and updating persistent state.'}
          </p>
        </div>
      </div>
      <div className="flex gap-1.5 font-mono text-xs">
        {[1, 2, 3, 4, 5].map((step) => (
          <span
            key={step}
            className={`step-dot w-6 h-2 rounded-full ${
              step <= progress.activeStep
                ? 'bg-emerald-400 shadow-sm shadow-emerald-400'
                : 'bg-slate-800'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
