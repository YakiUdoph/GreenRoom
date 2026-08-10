import React from 'react';
import { Sparkles, ArrowDown, Search, Users, DollarSign, Cpu, CheckCircle2 } from 'lucide-react';

export function Intelligence({
  impMessages,
  onInspectPayload,
  onRunStep,
  isExecuting,
}) {
  const messages = Array.isArray(impMessages) ? impMessages : [];

  const getMindIcon = (mindName) => {
    switch (mindName) {
      case 'ScoutMind':
        return <Search className="w-4 h-4 text-cyan-400" />;
      case 'CommunityMind':
        return <Users className="w-4 h-4 text-amber-400" />;
      case 'BusinessMind':
        return <DollarSign className="w-4 h-4 text-emerald-400" />;
      default:
        return <Cpu className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest bg-cyan-950/60 border border-cyan-800 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            MULTI-MIND INTELLIGENCE CHAIN
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight mt-2">
            Inter-Mind Reason Thread
          </h1>
          <p className="text-sm text-slate-400">
            Human-readable agent collaboration sequence powered by real IMP protocol events.
          </p>
        </div>

        <button
          onClick={() => onRunStep(3)}
          disabled={isExecuting}
          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
        >
          Synthesize Strategy Thread
        </button>
      </div>

      {/* Readable Decision Thread */}
      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="p-8 bg-slate-950 border border-slate-800 rounded-3xl text-center text-slate-500 text-sm italic">
            No intelligence events captured yet. Trigger demo steps above to observe agent collaboration.
          </div>
        ) : (
          messages.slice().reverse().map((msg, index) => {
            const sender = msg.sender_mind || 'GreenroomCore';
            const target = msg.target_mind ? ` → ${msg.target_mind}` : '';
            const action = msg.action_type || 'INFO';
            const conf = msg.confidence_score !== undefined ? `${(msg.confidence_score * 100).toFixed(0)}%` : '100%';

            return (
              <div key={msg.message_id || index} className="space-y-2">
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 hover:border-slate-700 transition shadow-lg">
                  <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        {getMindIcon(sender)}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white font-mono">
                          [{sender}{target}]
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          Protocol: IMP v1.0 • ID: {msg.message_id}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-2.5 py-0.5 rounded">
                        Confidence: {conf}
                      </span>
                      <span className="text-xs font-mono uppercase bg-slate-900 text-slate-300 border border-slate-800 px-2.5 py-0.5 rounded">
                        {action}
                      </span>
                      <button
                        onClick={() => onInspectPayload(msg)}
                        className="p-1 text-slate-400 hover:text-white bg-slate-900 rounded border border-slate-800 text-xs"
                        title="View Raw Payload JSON"
                      >
                        🔍 Raw JSON
                      </button>
                    </div>
                  </div>

                  <div className="text-xs font-sans text-slate-300 leading-relaxed pl-1">
                    {msg.payload?.trend_name && (
                      <p className="font-bold text-cyan-300">
                        Trend Evaluated: "{msg.payload.trend_name}" — Status: {msg.payload.status} (Fit Score: {msg.payload.fit_score})
                      </p>
                    )}
                    {msg.payload?.extracted_hook && (
                      <p className="font-bold text-amber-300">
                        Audience Sentiment Signal: {msg.payload.extracted_hook}
                      </p>
                    )}
                    {msg.payload?.sponsor_name && (
                      <p className="font-bold text-emerald-300">
                        Monetization Pitch Drafted: {msg.payload.sponsor_name} (Match Score: {(msg.payload.match_score * 100).toFixed(0)}%)
                      </p>
                    )}
                    {msg.payload?.script_concept && (
                      <p className="font-bold text-purple-300">
                        Creative Strategy Synthesized (Learned Punchy Voice: {msg.payload.is_punchy_voice ? 'YES' : 'NO'})
                      </p>
                    )}
                    {msg.payload?.extracted_learned_rule && (
                      <p className="font-bold text-amber-400">
                        Learned Voice Preference Updated: "{msg.payload.extracted_learned_rule}"
                      </p>
                    )}
                  </div>
                </div>

                {index < messages.length - 1 && (
                  <div className="flex justify-center my-1">
                    <ArrowDown className="w-4 h-4 text-slate-600 animate-pulse" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
