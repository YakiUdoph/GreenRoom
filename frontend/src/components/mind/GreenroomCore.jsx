import React from 'react';
import { Cpu, Brain, Sparkles, Zap, CheckCircle2 } from 'lucide-react';

export function GreenroomCore({
  stateName = 'IDLE',
  subtitle = 'Chief of Staff Core Active',
  compact = false,
}) {
  const getStateInfo = () => {
    switch (stateName.toUpperCase()) {
      case 'THINKING':
        return {
          label: 'THINKING',
          badgeClass: 'bg-cyan-950 text-cyan-400 border-cyan-800',
          glowClass: 'from-cyan-500 to-emerald-500 animate-thinking',
          icon: Cpu,
        };
      case 'RECEIVING':
        return {
          label: 'RECEIVING SIGNAL',
          badgeClass: 'bg-emerald-950 text-emerald-400 border-emerald-800',
          glowClass: 'from-emerald-400 to-teal-400 animate-pulse',
          icon: Zap,
        };
      case 'COLLABORATING':
        return {
          label: 'MULTI-MIND COLLABORATION',
          badgeClass: 'bg-purple-950 text-purple-300 border-purple-800',
          glowClass: 'from-purple-500 to-emerald-400 animate-pulse',
          icon: Sparkles,
        };
      case 'LEARNING':
        return {
          label: 'LEARNING & PERSISTING',
          badgeClass: 'bg-amber-950 text-amber-300 border-amber-800',
          glowClass: 'from-amber-400 to-emerald-400 animate-breath',
          icon: Brain,
        };
      case 'ACTING':
        return {
          label: 'EXECUTING ACTION',
          badgeClass: 'bg-teal-950 text-teal-300 border-teal-800',
          glowClass: 'from-teal-400 to-emerald-500 animate-pulse',
          icon: CheckCircle2,
        };
      case 'IDLE':
      default:
        return {
          label: 'CREATOR STAFF ONLINE',
          badgeClass: 'bg-emerald-950/80 text-emerald-400 border-emerald-800',
          glowClass: 'from-emerald-500 to-teal-600 animate-breath',
          icon: Cpu,
        };
    }
  };

  const stateInfo = getStateInfo();
  const Icon = stateInfo.icon;

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${stateInfo.glowClass} flex items-center justify-center text-slate-950 font-bold shadow-md`}>
          <Icon className="w-4 h-4 text-slate-950" />
        </div>
        <div>
          <span className={`text-[10px] font-mono font-bold uppercase border px-2 py-0.5 rounded ${stateInfo.badgeClass}`}>
            {stateInfo.label}
          </span>
          <p className="text-xs text-slate-300 font-medium mt-0.5">{subtitle}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center p-8 bg-slate-950/90 border border-slate-800/90 rounded-3xl shadow-2xl overflow-hidden group">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 via-transparent to-transparent pointer-events-none" />

      {/* Living Animated Core Ring */}
      <div className="relative flex items-center justify-center w-36 h-36 md:w-44 md:h-44">
        {/* Outer Aura Ring */}
        <div className={`absolute inset-0 rounded-full bg-gradient-to-tr ${stateInfo.glowClass} opacity-30 blur-xl transition-all duration-700`} />
        
        {/* Border Ring */}
        <div className={`absolute inset-0 rounded-full border-2 border-emerald-500/30 bg-slate-900/80 backdrop-blur-md flex items-center justify-center transition-all duration-500`} />
        
        {/* Inner Glowing Orb */}
        <div className={`w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-tr ${stateInfo.glowClass} flex items-center justify-center text-slate-950 shadow-2xl transition-all duration-500`}>
          <Icon className="w-10 h-10 md:w-12 md:h-12 text-slate-950 stroke-[2.2]" />
        </div>
      </div>

      {/* Status Label & Title */}
      <div className="mt-6 text-center z-10 space-y-1.5">
        <span className={`text-xs font-mono font-extrabold tracking-wider border px-3 py-1 rounded-full ${stateInfo.badgeClass}`}>
          ● {stateInfo.label}
        </span>
        <h3 className="text-lg md:text-xl font-extrabold text-white tracking-tight">
          Greenroom Core Mind
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
