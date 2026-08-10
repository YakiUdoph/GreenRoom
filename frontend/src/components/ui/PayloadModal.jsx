import React from 'react';
import { X } from 'lucide-react';

export function PayloadModal({ isOpen, message, onClose }) {
  if (!isOpen || !message) return null;

  const title = `IMP Payload: [${message.sender_mind || 'Core'} → ${message.target_mind || 'Core'}] (${message.action_type || 'INFO'})`;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="font-bold text-emerald-400 text-lg">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <pre className="p-4 bg-slate-950 rounded-xl text-xs font-mono text-cyan-300 border border-slate-800 overflow-x-auto max-h-96">
          {JSON.stringify(message, null, 2)}
        </pre>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
