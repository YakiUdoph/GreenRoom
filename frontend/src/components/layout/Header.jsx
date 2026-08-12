import React from 'react';
import { Play } from 'lucide-react';

export function Header({
  mindsStatus,
  onRunStep,
  onRunFullDemo,
  onResetState,
  isExecuting,
}) {
  const getStatusBadge = () => {
    if (mindsStatus.mode === 'production' && mindsStatus.connected) {
      const mindIdSnippet = mindsStatus.real_platform_mind?.mindId
        ? ` (${mindsStatus.real_platform_mind.mindId.slice(0, 8)}...)`
        : '';
      return {
        className: 'px-3 py-1.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 rounded-full text-xs font-semibold flex items-center gap-2 shadow-inner',
        dotClass: 'w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-md shadow-emerald-400',
        label: `Remote Minds Connected${mindIdSnippet}`,
      };
    }

    if (mindsStatus.mode === 'demo' || mindsStatus.is_mock || mindsStatus.demo_mode_active) {
      return {
        className: 'px-3 py-1.5 bg-cyan-950/80 text-cyan-400 border border-cyan-800/80 rounded-full text-xs font-semibold flex items-center gap-2 shadow-inner',
        dotClass: 'w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-md shadow-cyan-400',
        label: 'Standby Mode',
      };
    }

    return {
      className: 'px-3 py-1.5 bg-slate-900 text-slate-400 border border-slate-800 rounded-full text-xs font-semibold flex items-center gap-2 shadow-inner',
      dotClass: 'w-2.5 h-2.5 rounded-full bg-slate-500',
      label: 'Minds Gateway Offline',
    };
  };

  const statusInfo = getStatusBadge();

  const stepLabels = {
    1: 'Step 1: Profile',
    2: 'Step 2: Trends',
    3: 'Step 3: Strategy',
    4: 'Step 4: Business',
    5: 'Step 5: Learn',
  };

  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800/80 pb-5 gap-4">
      <div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-slate-950 text-xl shadow-lg shadow-emerald-500/20">
            GR
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Greenroom Command Center
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 font-mono font-medium">
                v1.0 IMP
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Persistent Multi-Mind Creator Engine • Google Antigravity
            </p>
          </div>
        </div>
      </div>

      {/* Controls & Status Badge */}
      <div className="flex flex-wrap items-center gap-3">
        <span className={statusInfo.className}>
          <span className={statusInfo.dotClass}></span>
          <span>{statusInfo.label}</span>
        </span>

        {/* Agent Pipeline Execution Controls */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
          <button
            onClick={onRunFullDemo}
            disabled={isExecuting}
            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-900/30 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Run Agent Pipeline
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1"></div>

          {[1, 2, 3, 4, 5].map((step) => (
            <button
              key={step}
              onClick={() => onRunStep(step)}
              disabled={isExecuting}
              className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded text-xs font-mono font-medium transition disabled:opacity-50"
              title={stepLabels[step]}
            >
              {stepLabels[step]}
            </button>
          ))}

          <div className="h-4 w-px bg-slate-800 mx-1"></div>

          <button
            onClick={onResetState}
            disabled={isExecuting}
            className="px-2.5 py-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded text-xs font-medium transition disabled:opacity-50"
            title="Reset Memory State"
          >
            Reset
          </button>
        </div>
      </div>
    </header>
  );
}
