import React from 'react';
import { Sparkles, ArrowDown } from 'lucide-react';

export function IntelligencePage({ impMessages, onInspectPayload, onRunStep, isExecuting }) {
  const messages = Array.isArray(impMessages) ? impMessages : [];

  return (
    <div className="flex-1 p-8 md:p-10 space-y-10 max-w-[1400px]">
      <div className="flex items-start justify-between border-b border-[#18181b] pb-8">
        <div className="space-y-2">
          <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tight text-white uppercase">
            INTELLIGENCE
          </h1>
          <p className="text-sm font-sans text-zinc-400">
            Multi-Mind Reasoning Chain & Protocol Logs.
          </p>
        </div>

        <button
          onClick={() => onRunStep(3)}
          disabled={isExecuting}
          className="px-5 py-2.5 bg-emerald-500 text-zinc-950 font-mono text-xs font-bold uppercase rounded-lg shadow disabled:opacity-50"
        >
          Synthesize Chain
        </button>
      </div>

      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="p-8 bg-[#111114] border border-[#1f1f23] rounded-xl text-center text-zinc-500 text-xs font-mono italic">
            Waiting for agent network initialization... Run demo above to trigger inter-mind events.
          </div>
        ) : (
          messages.slice().reverse().map((msg, index) => (
            <div key={msg.message_id || index} className="space-y-2">
              <div className="motion-card p-5 rounded-xl border border-[#1f1f23] space-y-2">
                <div className="flex justify-between items-center border-b border-[#18181b] pb-2 font-mono text-xs">
                  <span className="font-bold text-emerald-400">
                    [{msg.sender_mind || 'Core'} → {msg.target_mind || 'Core'}]
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-[#09090b] px-2 py-0.5 rounded text-zinc-400 border border-[#27272a]">
                      CONF: {(msg.confidence_score * 100).toFixed(0)}%
                    </span>
                    <button
                      onClick={() => onInspectPayload(msg)}
                      className="text-[10px] text-zinc-400 hover:text-white underline"
                    >
                      Inspect JSON
                    </button>
                  </div>
                </div>
                <p className="text-xs font-sans text-zinc-300 leading-relaxed">
                  {JSON.stringify(msg.payload)}
                </p>
              </div>
              {index < messages.length - 1 && (
                <div className="flex justify-center">
                  <ArrowDown className="w-3.5 h-3.5 text-zinc-600 animate-pulse" />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
