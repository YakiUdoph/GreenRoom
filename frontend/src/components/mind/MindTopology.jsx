import React from 'react';
import { Search, Users, DollarSign, ArrowUpRight } from 'lucide-react';
import { GreenroomCore } from './GreenroomCore';

export function MindTopology({
  activeMind = 'GreenroomCore',
  currentState = 'IDLE',
}) {
  const specialists = [
    {
      id: 'ScoutMind',
      name: 'Scout Mind',
      role: 'Trend Researcher',
      skill: 'search_trends',
      icon: Search,
      color: 'cyan',
      borderClass: 'border-cyan-500/60 bg-cyan-950/20 text-cyan-400',
      badgeClass: 'bg-cyan-950 text-cyan-300 border-cyan-800',
      desc: 'Filters raw trend noise against brand boundaries.',
    },
    {
      id: 'CommunityMind',
      name: 'Community Mind',
      role: 'Audience Analyst',
      skill: 'analyze_comments',
      icon: Users,
      color: 'amber',
      borderClass: 'border-amber-500/60 bg-amber-950/20 text-amber-400',
      badgeClass: 'bg-amber-950 text-amber-300 border-amber-800',
      desc: 'Evaluates retention drivers & comment hooks.',
    },
    {
      id: 'BusinessMind',
      name: 'Business Mind',
      role: 'Monetization Strategist',
      skill: 'score_deal',
      icon: DollarSign,
      color: 'emerald',
      borderClass: 'border-emerald-500/60 bg-emerald-950/20 text-emerald-400',
      badgeClass: 'bg-emerald-950 text-emerald-300 border-emerald-800',
      desc: 'Calculates brand match scores & generates pitches.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Central Core Visualizer */}
      <GreenroomCore
        stateName={currentState}
        subtitle="Chief of Staff Engine • Platform Mind 8208493e-f36b-1410-8466-00039ce7df11"
      />

      {/* Specialist Minds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {specialists.map((mind) => {
          const Icon = mind.icon;
          const isActive = activeMind === mind.id;
          return (
            <div
              key={mind.id}
              className={`p-4 rounded-2xl border transition-all duration-300 ${
                isActive
                  ? 'border-emerald-400 bg-slate-900 shadow-lg ring-1 ring-emerald-500/40'
                  : 'border-slate-800/80 bg-slate-950/80 hover:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${mind.borderClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-mono font-bold border px-2 py-0.5 rounded ${mind.badgeClass}`}>
                  {mind.skill}
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-100 mt-3 flex items-center gap-1.5">
                {mind.name}
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
              </h4>
              <p className="text-xs font-semibold text-slate-400">{mind.role}</p>
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                {mind.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
