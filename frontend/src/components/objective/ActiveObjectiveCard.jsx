import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { soundFx } from '../../lib/sound';

export function ActiveObjectiveCard({
  memoryState,
  onRunObjective,
  onCreateObjective,
  isExecuting,
}) {
  const objectives = memoryState?.creator_objectives || [];
  const currentObjective = objectives.length > 0 ? objectives[0] : null;

  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDetails, setNewDetails] = useState('');

  const learnedRules = memoryState?.learned_voice_rules || [];
  const activeConstraint = learnedRules.length > 0
    ? learnedRules[learnedRules.length - 1]
    : null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    soundFx.playSuccessChime();
    if (onCreateObjective) {
      await onCreateObjective(newTitle.trim(), newDetails.trim());
    }
    setIsEditing(false);
    setNewTitle('');
    setNewDetails('');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RUNNING':
        return {
          bg: 'bg-cyan-950 text-cyan-300 border-cyan-700',
          icon: 'sync',
          animate: 'animate-spin',
          label: 'RUNNING BACKGROUND WORK',
        };
      case 'QUEUED':
        return {
          bg: 'bg-amber-950 text-amber-300 border-amber-800',
          icon: 'schedule',
          animate: '',
          label: 'QUEUED IN WORKER',
        };
      case 'COMPLETED':
        return {
          bg: 'bg-[#142616] text-primary-fixed border-[#234d28]',
          icon: 'check_circle',
          animate: '',
          label: 'OBJECTIVE COMPLETED',
        };
      case 'FAILED':
        return {
          bg: 'bg-rose-950 text-rose-300 border-rose-800',
          icon: 'error',
          animate: '',
          label: 'EXECUTION FAILED',
        };
      default:
        return {
          bg: 'bg-[#111115] text-zinc-300 border-outline-variant',
          icon: 'flag',
          animate: '',
          label: 'OBJECTIVE CREATED',
        };
    }
  };

  const statusInfo = getStatusBadge(isExecuting ? 'RUNNING' : currentObjective?.status);

  return (
    <div className="noir-card p-6 md:p-8 bg-[#0e1014]/95 border-2 border-primary-fixed/40 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-outline-variant/60 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary-fixed text-xl">target</span>
            <span className="font-mono text-xs text-primary-fixed uppercase tracking-widest font-bold bg-[#142616] px-3 py-0.5 rounded border border-[#234d28]">
              PRIMARY ORGANIZING UNIT • CREATOR OBJECTIVE
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-display font-bold text-white uppercase tracking-tight">
            What Are You Trying To Accomplish?
          </h2>
          <p className="text-xs font-sans text-zinc-300 mt-1 font-medium">
            Greenroom coordinates specialist Minds (Scout, Community, Business) and evaluates opportunities directly against your objective.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`font-mono text-xs font-bold px-3 py-1 rounded border flex items-center gap-1.5 shadow-sm ${statusInfo.bg}`}>
            <span className={`material-symbols-outlined text-sm ${statusInfo.animate}`}>{statusInfo.icon}</span>
            <span>{statusInfo.label}</span>
          </span>
        </div>
      </div>

      {/* Active Objective Content */}
      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-4 font-mono text-xs">
          <div className="space-y-1">
            <label className="text-zinc-400 font-bold uppercase text-[10px] block">New Creator Objective</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g., Find a sponsorship opportunity that fits my audience..."
              className="w-full bg-[#0a0c0e] border border-outline-variant rounded p-3 text-white focus:border-primary-fixed focus:outline-none"
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <label className="text-zinc-400 font-bold uppercase text-[10px] block">Specific Details / Timeframe (Optional)</label>
            <input
              type="text"
              value={newDetails}
              onChange={(e) => setNewDetails(e.target.value)}
              placeholder="e.g., Focus on developer tools; target $45 CPM benchmark..."
              className="w-full bg-[#0a0c0e] border border-outline-variant rounded p-3 text-white focus:border-primary-fixed focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-[#111115] border border-outline-variant text-zinc-300 text-xs font-bold uppercase rounded hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary-container text-on-primary-container text-xs font-bold uppercase rounded hover:bg-primary-fixed-dim shadow-md"
            >
              Save Objective
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-[#0a0c0e] rounded-xl border border-outline-variant flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1 flex-1">
              <span className="font-mono text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                ACTIVE OBJECTIVE
              </span>
              <h3 className="text-lg font-sans font-bold text-white leading-snug">
                "{currentObjective?.title || 'No creator objective has been created yet'}"
              </h3>
              {currentObjective?.details && (
                <p className="font-mono text-xs text-zinc-300 leading-relaxed font-medium">
                  {currentObjective.details}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-2 bg-[#111115] border border-outline-variant hover:border-primary-fixed/60 text-zinc-300 hover:text-white text-xs font-mono font-bold rounded transition"
              >
                Change Objective
              </button>
              <button
                onClick={() => {
                  soundFx.playSynapsePulse();
                  if (onRunObjective && currentObjective) onRunObjective(currentObjective.id);
                }}
                disabled={isExecuting || !currentObjective}
                className="px-4 py-2 bg-primary-container text-on-primary-container text-xs font-mono font-bold uppercase rounded hover:bg-primary-fixed-dim transition flex items-center gap-1.5 shadow-lg shadow-primary-container/20 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">play_arrow</span>
                <span>{isExecuting ? 'Executing...' : 'Run Objective'}</span>
              </button>
            </div>
          </div>

          {/* Contextually Using Your Memory Banner */}
          <div className="p-3.5 bg-[#142616]/80 border border-[#234d28] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-fixed text-base">psychology</span>
              <span className="text-primary-fixed font-bold uppercase text-[10px] tracking-wider">
                USING YOUR PERSISTENT MEMORY AUTOMATICALLY:
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="text-zinc-200">
                Niche: <strong className="text-white">{memoryState?.niche || 'Developer Tools'}</strong>
              </span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-200">
                Constraint: <strong className="text-emerald-300">{activeConstraint ? `"${activeConstraint}"` : 'None learned yet'}</strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActiveObjectiveCard;
