import React from 'react';

export function IntelligencePage({ impMessages, onInspectPayload, onRunStep, isExecuting }) {
  const messages = Array.isArray(impMessages) ? impMessages : [];

  return (
    <div className="flex-1 p-8 md:p-12 space-y-12 max-w-container-max mx-auto text-on-background">
      <div className="border-b border-outline-variant pb-8 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary-fixed">neurology</span>
            <span className="font-mono text-xs text-primary-fixed uppercase tracking-widest font-bold">
              MULTI-MIND REASONING THREAD
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-on-surface uppercase">
            Inter-Mind Reason Thread & IMP Protocol Logs
          </h1>
          <p className="text-sm font-sans text-on-surface-variant mt-2">
            Real-time agent collaboration sequence powered by Inter-Mind Protocol (IMP v1.0).
          </p>
        </div>

        <button
          onClick={() => onRunStep(3)}
          disabled={isExecuting}
          className="px-5 py-2.5 bg-primary-container text-on-primary-container font-mono text-xs font-bold uppercase rounded hover:bg-primary-fixed-dim transition-colors disabled:opacity-50"
        >
          Synthesize Thread
        </button>
      </div>

      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="p-8 bg-surface-container-low border border-outline-variant rounded text-center text-on-surface-variant text-xs font-mono italic">
            No IMP events captured yet. Execute skills above to observe real inter-mind collaboration.
          </div>
        ) : (
          messages.slice().reverse().map((msg, index) => (
            <div key={msg.message_id || index} className="motion-card p-6 rounded border border-outline-variant space-y-3">
              <div className="flex justify-between items-center border-b border-outline-variant pb-3 font-mono text-xs">
                <span className="font-bold text-primary-fixed">
                  [{msg.sender_mind || 'Core'} → {msg.target_mind || 'Core'}]
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] bg-background px-2.5 py-1 rounded text-primary-fixed border border-outline-variant font-bold">
                    CONFIDENCE: {(msg.confidence_score * 100).toFixed(0)}%
                  </span>
                  <button
                    onClick={() => onInspectPayload(msg)}
                    className="text-xs font-mono text-on-surface hover:text-primary-fixed underline"
                  >
                    Inspect JSON Payload
                  </button>
                </div>
              </div>
              <p className="text-xs font-mono text-on-surface-variant leading-relaxed">
                {JSON.stringify(msg.payload, null, 2)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
