import React, { useState } from 'react';
import { KineticNoirCore } from '../components/mind/KineticNoirCore';

export function IntelligencePage({
  impMessages,
  onInspectPayload,
  onRunStep,
  isExecuting,
  onRunFullDemo,
}) {
  const messages = Array.isArray(impMessages) ? impMessages : [];
  const [showRawInspector, setShowRawInspector] = useState(false);

  return (
    <div className="flex-1 p-6 md:p-10 space-y-8 max-w-container-max mx-auto text-white">
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
