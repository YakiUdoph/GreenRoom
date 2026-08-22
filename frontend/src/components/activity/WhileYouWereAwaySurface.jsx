import React from 'react';
import { motion } from 'framer-motion';
import { isOlderBriefingAfterFailedRun } from '../../lib/offlineRun';

export function WhileYouWereAwaySurface({ briefingData, memoryState, onNavigate }) {
  const suppliedBriefing = Array.isArray(briefingData?.items) ? briefingData : null;
  const briefing = suppliedBriefing || memoryState?.latest_briefing || null;
  const items = Array.isArray(briefing?.items) ? briefing.items : [];
  const hasCompletedRun = Boolean(
    briefing && (items.length > 0 || briefing.recommended_topic || briefing.script_concept || briefing.overview)
  );
  const legacyItem = hasCompletedRun && items.length === 0 ? {
    id: 'legacy-briefing',
    priority: 'TOP OPPORTUNITY',
    title: briefing.recommended_topic || briefing.script_concept?.title || briefing.title,
    what_changed: briefing.scout_finding || briefing.overview,
    why_it_matters: briefing.community_evidence,
    recommended_action: briefing.script_concept?.concept || briefing.recommended_action,
  } : null;
  const rankedItems = items.length > 0 ? items.slice(0, 3) : (legacyItem ? [legacyItem] : []);
  const isOlderBriefing = isOlderBriefingAfterFailedRun(briefing, memoryState?.latest_offline_run);

  return (
    <section id="while-you-were-away" className="noir-card p-5 md:p-7 bg-[#0e1014]/92 border border-primary-fixed/30 shadow-2xl space-y-5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 border-b border-outline-variant/60 pb-4">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary-fixed text-lg">nightlight</span>
            <span className="font-mono text-[10px] text-primary-fixed uppercase tracking-[0.18em] font-bold">While you were away</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
            {hasCompletedRun ? `${rankedItems.length} ranked growth ${rankedItems.length === 1 ? 'opportunity' : 'opportunities'}, ready.` : 'Your next briefing will land here.'}
          </h2>
          <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
            Greenroom evaluates every signal against the objective, boundaries, and feedback it remembers about this creator.
          </p>
        </div>
        <span className={`font-mono text-[10px] font-bold px-2.5 py-1 rounded border whitespace-nowrap ${hasCompletedRun ? 'text-primary-fixed bg-[#142616] border-[#234d28]' : 'text-zinc-400 bg-[#111115] border-outline-variant'}`}>
          {hasCompletedRun ? 'BRIEFING COMPLETE' : 'WAITING FOR FIRST RUN'}
        </span>
      </div>

      {isOlderBriefing && (
        <div className="p-3 rounded border border-rose-800 bg-rose-950/50 text-xs text-rose-200">
          The newest offline run failed. The briefing below is an older successful run and is not the failed run's result.
        </div>
      )}

      {hasCompletedRun ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {rankedItems.map((item, index) => (
            <motion.article
              key={item.id || `${item.title}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: index * 0.06 }}
              className={`p-4 rounded-xl border flex flex-col gap-3 ${index === 0 ? 'bg-[#142616]/70 border-primary-fixed/45 lg:col-span-2' : 'bg-[#0a0c0e] border-outline-variant/70'}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] text-primary-fixed font-bold uppercase tracking-wider">
                  {index + 1}. {item.priority || 'Ranked opportunity'}
                </span>
                <span className="font-mono text-[9px] text-zinc-500 uppercase">{item.category || 'Growth'}</span>
              </div>
              <h3 className={`${index === 0 ? 'text-xl' : 'text-base'} font-display font-bold text-white leading-tight`}>{item.title}</h3>
              {item.what_changed && <p className="text-xs text-zinc-300 leading-relaxed">{item.what_changed}</p>}
              {item.why_it_matters && <p className="text-xs text-zinc-400 leading-relaxed border-l border-primary-fixed/50 pl-3">{item.why_it_matters}</p>}
              {item.recommended_action && (
                <div className="mt-auto pt-2">
                  <span className="font-mono text-[9px] text-zinc-500 uppercase block mb-1">Recommended next move</span>
                  <p className="text-xs text-white font-medium">{item.recommended_action}</p>
                </div>
              )}
            </motion.article>
          ))}
        </div>
      ) : (
        <div className="p-7 bg-[#0a0c0e] border border-dashed border-outline-variant rounded-xl text-center space-y-2">
          <span className="material-symbols-outlined text-3xl text-zinc-500">schedule</span>
          <h3 className="font-display font-bold text-white">Set an objective, then let Greenroom work in the background.</h3>
          <p className="text-xs text-zinc-400 max-w-lg mx-auto">The dashboard will show only completed, persisted results—never a fabricated placeholder briefing.</p>
        </div>
      )}

      {hasCompletedRun && onNavigate && (
        <div className="flex justify-end">
          <button onClick={() => onNavigate('actions')} className="text-primary-fixed hover:text-white font-mono text-xs font-bold flex items-center gap-1 transition">
            Review actions <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      )}
    </section>
  );
}

export default WhileYouWereAwaySurface;
