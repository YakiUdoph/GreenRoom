import React, { useState } from 'react';
import { KineticNoirCore } from '../components/mind/KineticNoirCore';

export function IntelligencePage({
  impMessages,
  onInspectPayload,
  onRunStep,
  onOpenSpecialistProofModal,
  isExecuting,
  onRunFullDemo,
}) {
  const messages = Array.isArray(impMessages) ? impMessages : [];
  const [showRawInspector, setShowRawInspector] = useState(false);

  return (
    <div className="manus-route manus-route--intelligence flex-1 p-6 md:p-10 space-y-8 max-w-container-max mx-auto text-white">
      {/* Header */}
      <div className="border-b border-[#72ff70]/30 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary-fixed text-2xl">hub</span>
            <span className="font-mono text-xs text-primary-fixed uppercase tracking-widest font-bold bg-[#142616] px-3 py-0.5 rounded border border-[#234d28]">
              MULTI-MIND REASONING MATRIX
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white uppercase tracking-tight">
            Inter-Mind Reason Thread
          </h1>
          <p className="text-xs md:text-sm font-sans text-zinc-200 mt-1 font-medium">
            Human-readable agent collaboration sequence powered by live IMP protocol events.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onOpenSpecialistProofModal && (
            <button
              onClick={() => {
                soundFx.playSynapsePulse();
                onOpenSpecialistProofModal();
              }}
              className="px-4 py-2.5 bg-emerald-950/80 border border-emerald-500/60 hover:border-primary-fixed text-emerald-300 hover:text-white font-mono text-xs font-bold transition flex items-center gap-2 rounded shadow-lg shadow-emerald-950/40"
              title="Trace why Greenroom is split into 4 specialist Minds: Scout finds -> Community validates -> Business evaluates -> Greenroom decides"
            >
              <span className="material-symbols-outlined text-base text-primary-fixed animate-pulse">account_tree</span>
              <span>Prove 4 Specialist Minds</span>
            </button>
          )}

          <button
            onClick={() => onRunStep(3)}
            disabled={isExecuting}
            className="px-5 py-2.5 bg-primary-container text-on-primary-container font-mono text-xs font-bold uppercase rounded hover:bg-primary-fixed-dim transition-colors shadow-lg shadow-primary-container/20 disabled:opacity-50"
          >
            Synthesize Strategy Thread
          </button>
          <button
            onClick={() => setShowRawInspector(!showRawInspector)}
            className="px-3.5 py-2.5 bg-[#111115] border border-outline-variant text-zinc-300 font-mono text-xs font-bold rounded hover:text-white transition"
          >
            {showRawInspector ? 'Hide Technical Inspector' : 'Expand Raw Protocol Stream'}
          </button>
        </div>
      </div>

      {/* Multi-Mind Verb Lifecycle Thesis Banner */}
      <div className="p-4 bg-[#142616] border border-[#234d28] rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs shadow-lg">
        <div className="flex items-center gap-2 text-primary-fixed font-bold">
          <span className="material-symbols-outlined text-xl">hub</span>
          <span>SPECIALIST MINDS RESPONSIBILITY TRACE:</span>
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

      {/* Intelligence Core Visualizer */}
      <div className="space-y-4">
        <h2 className="text-xs font-mono text-primary-fixed uppercase tracking-widest flex items-center gap-2 font-bold">
          <span className="w-3 h-[2px] bg-primary-fixed block" />
          INTELLIGENCE FIELD & REASONING CORE
        </h2>

        <KineticNoirCore onCoreClick={onRunFullDemo} />
      </div>

      {/* Human-Readable Decision Thread */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2">
          <h2 className="text-xs font-mono text-primary-fixed uppercase tracking-widest flex items-center gap-2 font-bold">
            <span className="w-3 h-[2px] bg-primary-fixed block" />
            COLLABORATIVE AGENT REASONING THREAD
          </h2>
          <span className="text-xs font-mono text-zinc-400 font-bold">
            {messages.length} Protocol Events Recorded
          </span>
        </div>

        {messages.length === 0 ? (
          <div className="noir-card p-6 text-center text-zinc-400 text-xs font-sans italic">
            No intelligence events captured yet. Execute agent pipeline skills above to observe real inter-mind collaboration.
          </div>
        ) : (
          messages.slice().reverse().map((msg, index) => {
            const sender = msg.sender_mind || 'GreenroomCore';
            const target = msg.target_mind ? ` → ${msg.target_mind}` : '';
            const action = msg.action_type || 'INFO';
            const conf = msg.confidence_score !== undefined ? `${(msg.confidence_score * 100).toFixed(0)}%` : '100%';

            return (
              <div key={msg.message_id || index} className="noir-card p-5 space-y-3">
                <div className="flex justify-between items-center border-b border-outline-variant/60 pb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary-fixed text-xl">neurology</span>
                    <div>
                      <span className="font-mono text-xs font-bold text-white">
                        [{sender}{target}]
                      </span>
                      <span className="font-mono text-[9px] text-zinc-400 block">
                        IMP v1.0 • ID: {msg.message_id}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-primary-fixed bg-[#142616] px-2.5 py-0.5 rounded border border-[#234d28]">
                      Confidence: {conf}
                    </span>
                    <span className="font-mono text-[10px] uppercase bg-[#111115] text-zinc-200 border border-outline-variant px-2.5 py-0.5 rounded font-bold">
                      {action}
                    </span>
                    <button
                      onClick={() => onInspectPayload(msg)}
                      className="font-mono text-xs text-primary-fixed hover:underline font-bold"
                    >
                      Inspect Payload JSON
                    </button>
                  </div>
                </div>

                <div className="font-sans text-xs md:text-sm text-zinc-100 leading-relaxed font-medium">
                  {msg.payload?.trend_name && (
                    <p className="font-bold text-primary-fixed">
                      Scout Mind Flagged Trend: "{msg.payload.trend_name}" (Fit Score: {msg.payload.fit_score}) — Filtered generic clickbait.
                    </p>
                  )}
                  {msg.payload?.extracted_hook && (
                    <p className="font-bold text-amber-300">
                      Community Mind Audience Signal: {msg.payload.extracted_hook}
                    </p>
                  )}
                  {msg.payload?.sponsor_name && (
                    <p className="font-bold text-emerald-300">
                      Business Mind Scored Deal: {msg.payload.sponsor_name} (Match Score: {(msg.payload.match_score * 100).toFixed(0)}%)
                    </p>
                  )}
                  {msg.payload?.script_concept && (
                    <p className="font-bold text-purple-300">
                      Greenroom Core Synthesized Strategy Direction (Learned Voice Rule Applied)
                    </p>
                  )}
                  {msg.payload?.extracted_learned_rule && (
                    <p className="font-bold text-amber-400">
                      Greenroom Learned New Preference Rule: "{msg.payload.extracted_learned_rule}"
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* EXPANDABLE RAW IMP PROTOCOL INSPECTOR */}
      {showRawInspector && (
        <div className="noir-card p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-outline-variant/60 pb-2 font-mono text-xs">
            <span className="font-bold text-primary-fixed uppercase">RAW IMP EVENT STREAM (TECHNICAL DIAGNOSTICS)</span>
            <span className="text-zinc-400">IMP v1.0 Protocol</span>
          </div>

          <div className="space-y-3 font-mono text-xs max-h-80 overflow-y-auto">
            {messages.map((msg, idx) => (
              <div key={msg.message_id || idx} className="p-3 bg-[#0a0c0e] border border-outline-variant rounded space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-primary-fixed font-bold">[{msg.sender_mind || 'Core'} → {msg.target_mind || 'Core'}]</span>
                  <span className="text-zinc-400">{msg.action_type}</span>
                </div>
                <pre className="text-zinc-300 text-[11px] overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(msg.payload, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default IntelligencePage;
