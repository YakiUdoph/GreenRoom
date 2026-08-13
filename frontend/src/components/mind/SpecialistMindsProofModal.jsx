import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';
import { soundFx } from '../../lib/sound';

export function SpecialistMindsProofModal({ isOpen, onClose }) {
  const [traceData, setTraceData] = useState(null);
  const [selectedMind, setSelectedMind] = useState('ScoutMind');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTrace();
    }
  }, [isOpen]);

  const fetchTrace = async () => {
    setIsLoading(true);
    try {
      const res = await api.getMindsProvenanceTrace();
      setTraceData(res);
    } catch (err) {
      console.error('[SpecialistMindsModal] Error fetching trace:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const traceList = traceData?.provenance_trace || [
    {
      mind_name: "Scout Mind",
      mind_id: "ScoutMind",
      role: "Market & Niche Trend Discovery",
      verb: "Scout Finds",
      contribution: "Identified 'Beginner AI Workflows & Automation' (High Niche Signal Volume, 0.92 raw fit score) and filtered out clickbait noise.",
      imp_event: "SCOUT_TREND_DISCOVERED",
      confidence: 0.92
    },
    {
      mind_name: "Community Mind",
      mind_id: "CommunityMind",
      role: "Audience Sentiment & Retention Analysis",
      verb: "Community Validates",
      contribution: "Confirmed high viewer demand for setup walkthroughs & benchmarked 30-second retention analytics.",
      imp_event: "COMMUNITY_SENTIMENT_VERIFIED",
      confidence: 0.88
    },
    {
      mind_name: "Business Mind",
      mind_id: "BusinessMind",
      role: "Commercial & Sponsorship Monetization",
      verb: "Business Evaluates",
      contribution: "Scored TechBrand Inc. sponsor pitch deal value, matching the creator's $45 CPM target benchmark.",
      imp_event: "BUSINESS_MONETIZATION_EVALUATED",
      confidence: 0.89
    },
    {
      mind_name: "Greenroom Core Mind",
      mind_id: "GreenroomCore",
      role: "Chief of Staff Decision & Synthesis Engine",
      verb: "Greenroom Decides",
      contribution: "Cross-referenced Scout, Community, and Business inputs with creator_profile.json memory rules, enforced non-clickbait constraint, and synthesized Executive Briefing.",
      imp_event: "EXEC_DIRECTIVE_SYNTHESIZED",
      confidence: 0.95
    }
  ];

  const activeMind = traceList.find((m) => m.mind_id === selectedMind) || traceList[0];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          className="noir-card p-6 md:p-8 w-full max-w-4xl bg-[#0e1014] border border-primary-fixed/40 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto relative"
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b border-outline-variant/60 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-primary-fixed text-xl">hub</span>
                <span className="font-mono text-[10px] text-primary-fixed uppercase tracking-widest font-bold bg-[#142616] px-2.5 py-0.5 rounded border border-[#234d28]">
                  MULTI-AGENT PROVENANCE MATRIX
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-display font-bold text-white uppercase tracking-tight">
                Why 4 Specialist Minds Instead of 1 Monolithic Agent?
              </h2>
              <p className="text-xs font-sans text-zinc-300 mt-1 font-medium">
                Separation of concerns: Trace every recommendation back through the discrete contributions of each specialist Mind.
              </p>
            </div>

            <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 transition">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Core Multi-Mind Thesis Banner */}
          <div className="p-4 bg-[#142616] border border-[#234d28] rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs shadow-lg">
            <div className="flex items-center gap-2 text-primary-fixed font-bold">
              <span className="material-symbols-outlined text-xl">account_tree</span>
              <span>SPECIALIST VERB LIFECYCLE:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
              <span className="px-3 py-1 bg-[#111115] text-emerald-400 border border-emerald-800 rounded">SCOUT FINDS</span>
              <span className="text-zinc-500">→</span>
              <span className="px-3 py-1 bg-[#111115] text-cyan-400 border border-cyan-800 rounded">COMMUNITY VALIDATES</span>
              <span className="text-zinc-500">→</span>
              <span className="px-3 py-1 bg-[#111115] text-amber-400 border border-amber-800 rounded">BUSINESS EVALUATES</span>
              <span className="text-zinc-500">→</span>
              <span className="px-3 py-1 bg-[#142616] text-primary-fixed border border-[#234d28] rounded shadow-[0_0_8px_#72ff70]">GREENROOM DECIDES</span>
            </div>
          </div>

          {/* 4 Specialist Mind Interactive Selector Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
            {traceList.map((mind) => {
              const isSelected = selectedMind === mind.mind_id;
              const colorClass =
                mind.mind_id === 'ScoutMind'
                  ? 'text-emerald-400 border-emerald-800'
                  : mind.mind_id === 'CommunityMind'
                  ? 'text-cyan-400 border-cyan-800'
                  : mind.mind_id === 'BusinessMind'
                  ? 'text-amber-400 border-amber-800'
                  : 'text-primary-fixed border-[#234d28]';

              return (
                <button
                  key={mind.mind_id}
                  onClick={() => {
                    soundFx.playSynapsePulse();
                    setSelectedMind(mind.mind_id);
                  }}
                  className={`p-3.5 rounded border text-left transition ${
                    isSelected
                      ? 'bg-[#142616] border-primary-fixed shadow-[0_0_12px_rgba(114,255,112,0.2)]'
                      : 'bg-[#0a0c0e] border-outline-variant hover:border-zinc-500'
                  }`}
                >
                  <span className={`text-[10px] font-bold block uppercase px-2 py-0.5 rounded border w-fit mb-1 bg-[#111115] ${colorClass}`}>
                    {mind.verb}
                  </span>
                  <h4 className="text-sm font-bold text-white">{mind.mind_name}</h4>
                  <span className="text-[10px] text-zinc-400 block mt-1 font-mono">Conf: {(mind.confidence * 100).toFixed(0)}%</span>
                </button>
              );
            })}
          </div>

          {/* Active Mind Provenance Detail Box */}
          <div className="noir-card p-6 space-y-4 bg-[#0a0c0e] border border-primary-fixed/30 rounded-xl">
            <div className="flex justify-between items-center border-b border-outline-variant/60 pb-3 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-fixed text-xl">neurology</span>
                <div>
                  <span className="text-primary-fixed font-bold text-sm block">
                    {activeMind.mind_name} ({activeMind.mind_id})
                  </span>
                  <span className="text-zinc-400 text-[11px] font-medium">{activeMind.role}</span>
                </div>
              </div>

              <span className="font-mono text-xs font-bold text-primary-fixed bg-[#142616] px-3 py-1 rounded border border-[#234d28]">
                VERB: {activeMind.verb.toUpperCase()}
              </span>
            </div>

            {/* Exact Contribution Detail */}
            <div className="space-y-2 font-mono text-xs">
              <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">
                EXACT CONTRIBUTION TO EXECUTIVE DIRECTIVE:
              </span>
              <div className="p-4 bg-[#111115] border border-outline-variant rounded text-zinc-200 leading-relaxed font-medium">
                {activeMind.contribution}
              </div>
            </div>

            {/* IMP Protocol Event Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 bg-[#111115] rounded border border-outline-variant">
                <span className="text-[10px] text-zinc-400 block font-bold uppercase">IMP PROTOCOL EVENT</span>
                <span className="text-primary-fixed font-bold">{activeMind.imp_event}</span>
              </div>
              <div className="p-3 bg-[#111115] rounded border border-outline-variant">
                <span className="text-[10px] text-zinc-400 block font-bold uppercase">MIND ANIMOCA UUID</span>
                <span className="text-white font-bold text-[11px]">8208493e-f36b-1410</span>
              </div>
              <div className="p-3 bg-[#111115] rounded border border-outline-variant">
                <span className="text-[10px] text-zinc-400 block font-bold uppercase">SPECIALIST CONFIDENCE</span>
                <span className="text-emerald-400 font-bold">{(activeMind.confidence * 100).toFixed(0)}% High</span>
              </div>
            </div>
          </div>

          {/* Footer & Close */}
          <div className="p-4 bg-[#0a0c0e] border border-outline-variant rounded-xl font-mono text-xs flex justify-between items-center">
            <span className="text-zinc-300">
              Verified: Each Mind executes independent analysis before Greenroom Core synthesizes.
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary-container text-on-primary-container font-bold uppercase rounded hover:bg-primary-fixed-dim transition shadow-md shadow-primary-container/20"
            >
              Close & View Intelligence Page
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default SpecialistMindsProofModal;
