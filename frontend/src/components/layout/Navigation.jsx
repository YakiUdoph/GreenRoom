import React from 'react';
import { Home, Cpu, Brain, Sparkles, CheckSquare, Terminal, Eye } from 'lucide-react';

export function Navigation({
  activeTab,
  onTabChange,
  mindsStatus,
}) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'mind', label: 'Mind', icon: Cpu },
    { id: 'memory', label: 'Memory', icon: Brain },
    { id: 'intelligence', label: 'Intelligence', icon: Sparkles },
    { id: 'actions', label: 'Actions', icon: CheckSquare },
    { id: 'system', label: 'System', icon: Terminal },
  ];

  const getStatusBadge = () => {
    if (mindsStatus?.mode === 'production' && mindsStatus?.connected) {
      return {
        dotClass: 'bg-emerald-400 animate-pulse shadow-md shadow-emerald-400',
        textClass: 'text-emerald-400 bg-emerald-950/80 border-emerald-800/80',
        label: 'Production Mind Connected',
      };
    }
    if (mindsStatus?.mode === 'demo' || mindsStatus?.is_mock || mindsStatus?.demo_mode_active) {
      return {
        dotClass: 'bg-amber-400 shadow-md shadow-amber-400',
        textClass: 'text-amber-400 bg-amber-950/80 border-amber-800/80',
        label: 'Mock Demo Mode',
      };
    }
    return {
      dotClass: 'bg-rose-500',
      textClass: 'text-rose-400 bg-rose-950/80 border-rose-800/80',
      label: 'Platform Mind Disconnected',
    };
  };

  const status = getStatusBadge();

  return (
    <nav className="border-b border-slate-800/80 bg-[#070b14]/90 backdrop-blur-md sticky top-0 z-40 px-4 md:px-6 py-3">
      <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Status */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <div
            onClick={() => onTabChange('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              GR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-white font-sans uppercase">
                  GREENROOM
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold">
                  v2.0 OS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Persistent AI Chief of Staff</p>
            </div>
          </div>

          {/* Minds Status Indicator Pill */}
          <div className={`px-2.5 py-1 rounded-full text-xs border font-semibold flex items-center gap-2 ${status.textClass}`}>
            <span className={`w-2 h-2 rounded-full ${status.dotClass}`}></span>
            <span className="hidden sm:inline font-mono">{status.label}</span>
          </div>
        </div>

        {/* Persistent Nav Tabs */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 p-1 rounded-xl w-full md:w-auto overflow-x-auto justify-start md:justify-center">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* View Toggle */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={() => onTabChange(activeTab === 'system' ? 'home' : 'system')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 ${
              activeTab === 'system'
                ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            {activeTab === 'system' ? (
              <>
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>Switch to Creator View</span>
              </>
            ) : (
              <>
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>System View</span>
              </>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
