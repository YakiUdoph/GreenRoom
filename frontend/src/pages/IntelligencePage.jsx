import React from 'react';
import { KineticNoirCore } from '../components/mind/KineticNoirCore';

export function IntelligencePage({ impMessages, onInspectPayload, onRunStep, isExecuting, onRunFullDemo }) {
  const messages = Array.isArray(impMessages) ? impMessages : [];

  return (
    <div className="flex-1 p-8 md:p-12 space-y-12 max-w-container-max mx-auto text-white">
      {/* Header */}
      <div className="border-b border-outline-variant pb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary-fixed text-2xl">neurology</span>
            <span className="font-mono text-xs text-primary-fixed uppercase tracking-widest font-bold bg-[#142616] px-3 py-1 rounded border border-[#234d28]">
              MULTI-MIND REASONING MATRIX
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-white uppercase">
            Intelligence Field & Inter-Mind Threads
          </h1>
          <p className="text-sm md:text-base font-sans text-zinc-200 mt-2 font-medium">
            Real-time agent collaboration sequence powered by Inter-Mind Protocol (IMP v1.0).
          </p>
        </div>

        <button
          onClick={() => onRunStep(3)}
          disabled={isExecuting}
          className="px-6 py-3 bg-primary-container text-on-primary-container font-mono text-xs font-bold uppercase rounded hover:bg-primary-fixed-dim transition-colors disabled:opacity-50 shadow-lg shadow-primary-container/20"
        >
          Synthesize Strategy Thread
        </button>
      </div>

      {/* INTELLIGENCE FIELD AI CORE VISUALIZER */}
      <div className="space-y-4">
        <h2 className="text-xs font-mono text-primary-fixed uppercase tracking-widest flex items-center gap-2 font-bold">
          <span className="w-4 h-[2px] bg-primary-fixed block" />
          INTELLIGENCE FIELD & REASONING CORE
        </h2>

        <KineticNoirCore onCoreClick={onRunFullDemo} />
      </div>

      {/* IMP Protocol Log Stream */}
      <div className="space-y-6">
        <h2 className="text-xs font-mono text-primary-fixed uppercase tracking-widest flex items-center gap-2 font-bold">
          <span className="w-4 h-[2px] bg-primary-fixed block" />
          INTER-MIND REASONING LOGS
        </h2>

        {messages.length === 0 ? (
          <div className="noir-card p-8 text-center text-zinc-300 text-sm font-mono italic">
            No IMP events captured yet. Execute skills above to observe real inter-mind collaboration.
          </div>
        ) : (
          messages.slice().reverse().map((msg, index) => (
            <div key={msg.message_id || index} className="noir-card p-6 space-y-3">
              <div className="flex justify-between items-center border-b border-outline-variant/60 pb-3 font-mono text-xs">
                <span className="font-bold text-primary-fixed text-sm">
                  [{msg.sender_mind || 'Core'} → {msg.target_mind || 'Core'}]
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-[#142616] px-3 py-1 rounded text-primary-fixed border border-[#234d28] font-bold">
                    CONFIDENCE: {(msg.confidence_score * 100).toFixed(0)}%
                  </span>
                  <button
                    onClick={() => onInspectPayload(msg)}
                    className="text-xs font-mono text-white hover:text-primary-fixed underline font-bold"
                  >
                    Inspect JSON Payload
                  </button>
                </div>
              </div>
              <p className="text-xs font-mono text-zinc-200 leading-relaxed font-medium">
                {JSON.stringify(msg.payload, null, 2)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
