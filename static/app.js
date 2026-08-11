// Greenroom Command Center Frontend JavaScript — Sharpened MVP

let ws = null;
let currentMemoryState = {};
let impMessages = [];
let latestBriefing = null;

// Initialize application on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initWebSocket();
  fetchInitialState();
  fetchMindsStatus();
  fetchLatestBriefing();
});

// Fetch health/status endpoint on load
function fetchMindsStatus() {
  fetch('/api/minds/status')
    .then(res => res.json())
    .then(data => {
      updateStatusBadge(data);
    })
    .catch(() => {
      const statusEl = document.getElementById('connection-status');
      if (statusEl) {
        statusEl.className = 'px-3 py-1 bg-slate-900 text-slate-400 border border-slate-800 rounded-full text-xs flex items-center gap-2 font-medium';
        statusEl.innerHTML = '⚠️ Minds Status Unavailable';
      }
    });
}

function updateStatusBadge(data) {
  const statusEl = document.getElementById('connection-status');
  if (!statusEl) return;
  if (data.mode === 'production' && data.connected) {
    const mindIdSnippet = data.real_platform_mind?.mindId ? ` (${data.real_platform_mind.mindId.slice(0, 8)}...)` : '';
    statusEl.className = 'px-3.5 py-1.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full text-xs flex items-center gap-2 font-semibold shadow-inner';
    statusEl.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span> 🟢 Remote Animoca Mind Connected${mindIdSnippet}`;
  } else if (data.mode === 'demo' || data.is_mock || data.demo_mode_active) {
    statusEl.className = 'px-3.5 py-1.5 bg-amber-950 text-amber-400 border border-amber-800 rounded-full text-xs flex items-center gap-2 font-semibold shadow-inner';
    statusEl.innerHTML = '<span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span> 🟡 MOCK DEMO MODE — Offline Development';
  } else {
    statusEl.className = 'px-3.5 py-1.5 bg-rose-950 text-rose-400 border border-rose-800 rounded-full text-xs flex items-center gap-2 font-semibold shadow-inner';
    statusEl.innerHTML = '<span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span> 🔴 Animoca Minds Builder Disconnected';
  }
}

// WebSocket Connection
function initWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('[Greenroom] WebSocket connected');
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.minds_status) {
        updateStatusBadge(data.minds_status);
      }
      if (data.type === 'INITIAL_SNAPSHOT') {
        impMessages = data.imp_history || [];
        currentMemoryState = data.memory_state || {};
        renderAll();
      } else if (data.type === 'IMP_MESSAGE') {
        impMessages.push(data.data);
        if (data.memory_state) {
          currentMemoryState = data.memory_state;
        }
        if (data.data && data.data.payload && data.data.payload.briefing) {
          latestBriefing = data.data.payload.briefing;
          renderBriefing(latestBriefing);
        }
        renderIMPStream();
        renderStateStore();
      }
    } catch (err) {
      console.error('[Greenroom] WS Parse Error:', err);
    }
  };

  ws.onclose = () => {
    const statusEl = document.getElementById('connection-status');
    if (statusEl) statusEl.textContent = 'Connecting...';
    setTimeout(initWebSocket, 2000);
  };
}

// Fetch Initial State via REST
async function fetchInitialState() {
  try {
    const [stateRes, historyRes] = await Promise.all([
      fetch('/api/state'),
      fetch('/api/imp/history')
    ]);
    if (stateRes.ok) currentMemoryState = await stateRes.json();
    if (historyRes.ok) impMessages = await historyRes.json();
    renderAll();
  } catch (err) {
    console.warn('[Greenroom] REST fetch error:', err);
  }
}

// Fetch Latest Briefing on page load / refresh
async function fetchLatestBriefing() {
  try {
    const res = await fetch('/api/briefing/latest');
    if (res.ok) {
      const data = await res.json();
      if (data.briefing) {
        latestBriefing = data.briefing;
        renderBriefing(latestBriefing);
      } else {
        // Trigger initial cycle if no briefing stored
        triggerAsyncRun(true);
      }
    }
  } catch (err) {
    console.warn('[Greenroom] Error fetching briefing:', err);
  }
}

// Trigger Async Offline Run (Hackathon Demo Trigger)
async function triggerAsyncRun(silent = false) {
  if (!silent) showBanner("Greenroom Mind Working While You Are Away...", "Processing audience signals & ranking growth opportunities...");

  try {
    const res = await fetch('/api/briefing/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accelerated: true })
    });

    const data = await res.json();
    if (data.briefing) {
      latestBriefing = data.briefing;
      renderBriefing(latestBriefing);
    }
    if (data.minds_status) updateStatusBadge(data.minds_status);
  } catch (err) {
    console.error('[Greenroom] Error triggering async run:', err);
  } finally {
    if (!silent) setTimeout(hideBanner, 1000);
  }
}

// Submit Item Feedback (Useful, Done, Dismiss)
async function submitItemFeedback(itemId, feedbackType) {
  try {
    const res = await fetch('/api/briefing/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: itemId, feedback_type: feedbackType })
    });

    const data = await res.json();
    if (data.state) {
      currentMemoryState = data.state;
      renderStateStore();
    }
    alert(`Feedback saved to creator profile memory: [${feedbackType.toUpperCase()}]`);
    // Re-run autonomous cycle so the briefing dynamically demonstrates continuity!
    await triggerAsyncRun(true);
  } catch (err) {
    console.error('[Greenroom] Error submitting item feedback:', err);
  }
}

// Global Render Dispatcher
function renderAll() {
  renderIMPStream();
  renderStateStore();
  if (latestBriefing) renderBriefing(latestBriefing);
}

// Render "While You Were Away" Briefing & Judge Proof Panel
function renderBriefing(briefing) {
  if (!briefing) return;

  // Metadata Bar Updates
  document.getElementById('briefing-time').textContent = `Last Autonomous Run: ${briefing.last_run_formatted || 'Just Now'}`;
  document.getElementById('briefing-signals-count').textContent = `${briefing.signals_reviewed_count || 3} Signals Reviewed`;
  document.getElementById('briefing-opps-count').textContent = `${briefing.opportunities_found_count || 3} Opportunities Ranked`;
  document.getElementById('briefing-signal-source').textContent = `[${briefing.signal_source_label || 'DEMO DATASET'}]`;

  // Continuity Banner
  const contBanner = document.getElementById('continuity-banner');
  const contText = document.getElementById('continuity-note-text');
  if (briefing.continuity_note) {
    if (contBanner) contBanner.classList.remove('hidden');
    if (contText) contText.textContent = briefing.continuity_note;
  } else {
    if (contBanner) contBanner.classList.add('hidden');
  }

  // Judge Proof Panel Population
  const prov = briefing.provenance || {};
  const runIdEl = document.getElementById('proof-run-id');
  if (runIdEl) runIdEl.textContent = prov.run_id || briefing.run_id || 'run_active';

  const analysisEl = document.getElementById('proof-analysis');
  if (analysisEl) analysisEl.textContent = prov.analysis_provider || briefing.analysis_provider || 'Animoca Minds';

  const verifiedEl = document.getElementById('proof-verified');
  if (verifiedEl) verifiedEl.textContent = (prov.mind_verified || briefing.minds_verified) ? 'Yes (8208493e...)' : 'No (Mock)';

  const signalsEl = document.getElementById('proof-signals');
  if (signalsEl) signalsEl.textContent = prov.signal_source || briefing.signal_source_label || 'Demo Dataset (Simulated)';

  const persistenceEl = document.getElementById('proof-persistence');
  if (persistenceEl) persistenceEl.textContent = prov.persistence_mode || briefing.persistence_mode || 'LOCAL FILE';

  const container = document.getElementById('briefing-cards-container');
  if (!container || !briefing.items) return;

  container.innerHTML = briefing.items.map((item, idx) => {
    let borderClass = 'border-slate-800 hover:border-slate-700';
    let badgeClass = 'text-cyan-400 bg-cyan-950 border-cyan-800';
    let nextActionClass = 'bg-slate-900 border-slate-800 text-slate-200';

    if (item.priority === 'HIGH PRIORITY') {
      borderClass = 'border-emerald-500/40 hover:border-emerald-400/70';
      badgeClass = 'text-emerald-400 bg-emerald-950 border-emerald-800';
      nextActionClass = 'bg-emerald-950/40 border-emerald-900/60 text-emerald-200';
    } else if (item.priority === 'MEDIUM PRIORITY') {
      borderClass = 'border-amber-500/30 hover:border-amber-400/60';
      badgeClass = 'text-amber-400 bg-amber-950 border-amber-800';
      nextActionClass = 'bg-amber-950/40 border-amber-900/60 text-amber-200';
    }

    return `
      <div class="bg-slate-950/90 border ${borderClass} rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl transition group">
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-[10px] font-extrabold ${badgeClass} border px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              ${idx + 1}. ${escapeHtml(item.priority)}
            </span>
            <span class="text-[10px] font-mono text-slate-500">${escapeHtml(item.category || 'Growth Signal')}</span>
          </div>

          <h3 class="font-bold text-slate-100 text-base group-hover:text-emerald-300 transition">
            ${escapeHtml(item.title)}
          </h3>

          <div class="space-y-2 text-xs text-slate-300">
            <div class="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/80">
              <span class="text-[10px] text-slate-400 font-semibold uppercase block">What Changed:</span>
              <p class="text-slate-200 mt-0.5">${escapeHtml(item.what_changed)}</p>
            </div>

            <div class="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/80">
              <span class="text-[10px] text-cyan-400 font-semibold uppercase block">Why It Matters (Memory Grounded):</span>
              <p class="text-slate-200 mt-0.5">${escapeHtml(item.why_it_matters)}</p>
            </div>

            <div class="p-2.5 ${nextActionClass} rounded-xl border">
              <span class="text-[10px] font-semibold uppercase block">Recommended Next Action:</span>
              <p class="font-medium mt-0.5">${escapeHtml(item.recommended_action)}</p>
            </div>
          </div>
        </div>

        <div class="pt-2 border-t border-slate-900 flex justify-between items-center gap-2">
          <span class="text-[10px] text-slate-500 font-mono">Memory: ${escapeHtml(item.memory_context_used || 'creator_profile')}</span>
          <div class="flex gap-1.5">
            <button onclick="submitItemFeedback('${item.id}', 'useful')" class="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 rounded-lg text-xs font-semibold transition" title="Mark Useful">✓ Useful</button>
            <button onclick="submitItemFeedback('${item.id}', 'done')" class="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-xs transition" title="Mark Done">⚡ Done</button>
            <button onclick="submitItemFeedback('${item.id}', 'dismiss')" class="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 rounded-lg text-xs transition" title="Dismiss">✕</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Render Inter-Mind Message Log (IMP)
function renderIMPStream() {
  const container = document.getElementById('activity-stream');
  const countEl = document.getElementById('msg-count-badge');
  if (countEl) countEl.textContent = `${impMessages.length} messages`;
  if (!container) return;

  if (!impMessages || impMessages.length === 0) {
    container.innerHTML = `
      <div class="p-4 bg-slate-950/60 border border-slate-800/60 rounded-xl text-slate-400 text-center italic">
        Waiting for agent network communication...
      </div>`;
    return;
  }

  container.innerHTML = impMessages.slice().reverse().map(msg => {
    const sender = msg.sender_mind || 'Core';
    const target = msg.target_mind ? ` → ${msg.target_mind}` : '';
    const action = msg.action_type || 'INFO';
    const conf = msg.confidence_score !== undefined ? (msg.confidence_score * 100).toFixed(0) + '%' : '';

    let borderClass = 'border-purple-500/80';
    let textClass = 'text-purple-400';

    if (sender === 'ScoutMind') {
      borderClass = 'border-cyan-500/80';
      textClass = 'text-cyan-400';
    } else if (sender === 'CommunityMind') {
      borderClass = 'border-amber-500/80';
      textClass = 'text-amber-400';
    } else if (sender === 'BusinessMind') {
      borderClass = 'border-emerald-500/80';
      textClass = 'text-emerald-400';
    } else if (sender === 'User') {
      borderClass = 'border-pink-500/80';
      textClass = 'text-pink-400';
    }

    const payloadSnippet = getPayloadSnippet(msg.payload, action);

    return `
      <div class="p-3 bg-slate-950 border-l-2 ${borderClass} rounded-xl shadow transition hover:border-l-4">
        <div class="flex justify-between items-center">
          <span class="font-bold ${textClass}">[${sender}${target}]</span>
          <div class="flex items-center gap-1.5">
            ${conf ? `<span class="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 text-slate-400 border border-slate-800">${conf}</span>` : ''}
            <span class="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 text-slate-300 font-sans uppercase">${action}</span>
            <button onclick="inspectPayload('${msg.message_id}')" class="text-slate-500 hover:text-slate-300 ml-1 text-[11px]" title="View raw JSON">🔍</button>
          </div>
        </div>
        <p class="mt-1.5 text-slate-300 leading-relaxed font-sans text-xs">${escapeHtml(payloadSnippet)}</p>
      </div>
    `;
  }).join('');
}

// Generate human-readable summary from payload
function getPayloadSnippet(payload, action) {
  if (!payload) return 'No payload data';
  if (payload.event === 'WHILE_YOU_WERE_AWAY_BRIEFING_READY') {
    return `AUTONOMOUS BRIEFING COMPLETED: ${payload.opportunities_count} ranked growth opportunities created for creator return.`;
  }
  if (payload.trend_name) {
    if (payload.status === 'REJECTED') {
      return `REJECTED trend: "${payload.trend_name}". ${payload.rejection_reason || ''}`;
    }
    return `Flagged trend: "${payload.trend_name}". Fit Score: ${payload.fit_score || 0.92}. ${payload.relevance_reason || ''}`;
  }
  if (payload.extracted_hook) return `Extracted hook: ${payload.extracted_hook}`;
  if (payload.sponsor_name) return `Generated pitch for ${payload.sponsor_name}. Calculated match score: ${(payload.match_score * 100).toFixed(0)}%.`;
  if (payload.extracted_learned_rule) return `PROOF OF LEARNING: Updated persistent voice rule -> "${payload.extracted_learned_rule}"`;

  return JSON.stringify(payload).slice(0, 120) + '...';
}

// Render Persistent State Store Inspector
function renderStateStore() {
  if (!currentMemoryState) return;

  const creatorNameEl = document.getElementById('state-creator-name');
  if (creatorNameEl) creatorNameEl.textContent = currentMemoryState.creator_name || 'Alex Rivera';
  
  const voiceAttrs = currentMemoryState.brand_voice_attributes || [];
  const voiceEl = document.getElementById('state-voice-attributes');
  if (voiceEl) {
    voiceEl.innerHTML = voiceAttrs.map(v => 
      `<span class="px-2 py-0.5 bg-slate-900 text-slate-300 rounded text-[10px] border border-slate-800 font-sans">${escapeHtml(v)}</span>`
    ).join('');
  }

  // Learned Voice Rules
  const learnedRules = currentMemoryState.learned_voice_rules || [];
  const countBadge = document.getElementById('rule-count-badge');
  if (countBadge) countBadge.textContent = `${learnedRules.length} rules`;
  
  const rulesContainer = document.getElementById('state-learned-rules');
  if (rulesContainer) {
    if (learnedRules.length === 0) {
      rulesContainer.innerHTML = `<p class="text-slate-500 italic text-[11px]">No feedback rules learned yet.</p>`;
    } else {
      rulesContainer.innerHTML = learnedRules.map(r => `
        <div class="p-2 bg-amber-950/40 border border-amber-800/60 rounded-lg text-amber-200 text-[11px] font-sans flex items-start gap-1.5 shadow-sm">
          <span class="text-amber-400 font-bold">✓</span>
          <span>${escapeHtml(r)}</span>
        </div>
      `).join('');
    }
  }

  // Memory Nodes
  const nodes = currentMemoryState.memory_nodes || [];
  const nodesContainer = document.getElementById('state-memory-nodes');
  if (nodesContainer) {
    if (nodes.length === 0) {
      nodesContainer.innerHTML = `<p class="text-slate-500 italic text-[11px]">No persistent memory nodes stored.</p>`;
    } else {
      nodesContainer.innerHTML = nodes.slice(-3).map(n => `
        <div class="p-2 bg-slate-900 border border-slate-800 rounded-lg text-[11px]">
          <span class="text-[9px] font-bold uppercase text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-900">${n.type || 'node'}</span>
          <p class="mt-1 text-slate-300 leading-snug">${escapeHtml(n.content || '')}</p>
        </div>
      `).join('');
    }
  }
}

async function submitFeedback() {
  const fbInput = document.getElementById('feedback-input');
  if (!fbInput || !fbInput.value) return;

  showBanner("Proof of Learning Executing...", "Persisting custom instruction into creator memory profile.");
  try {
    const res = await fetch('/api/action/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback: fbInput.value })
    });
    const data = await res.json();
    if (data.state) {
      currentMemoryState = data.state;
      renderStateStore();
    }
    // Re-run autonomous cycle so the briefing dynamically reflects the updated rule!
    await triggerAsyncRun(true);
  } catch (err) {
    console.error('[Greenroom] Error submitting feedback:', err);
  } font-medium;
}

async function approveSponsorship() {
  try {
    const res = await fetch('/api/action/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action_name: "Sponsorship Pitch for TechBrand Inc." })
    });
    alert("Sponsorship Pitch Approved & Sent to TechBrand Inc.!");
  } catch (err) {
    console.error('[Greenroom] Error approving pitch:', err);
  }
}

async function resetState() {
  try {
    const res = await fetch('/api/demo/reset', { method: 'POST' });
    const data = await res.json();
    impMessages = [];
    currentMemoryState = data.state;
    latestBriefing = null;
    renderAll();
    triggerAsyncRun(true);
  } catch (err) {
    console.error('[Greenroom] Error resetting state:', err);
  }
}

// Banner Helpers
function showBanner(title, desc) {
  const banner = document.getElementById('demo-banner');
  const titleEl = document.getElementById('demo-step-title');
  const descEl = document.getElementById('demo-step-desc');
  if (banner) banner.classList.remove('hidden');
  if (titleEl) titleEl.textContent = title;
  if (descEl) descEl.textContent = desc;
}

function hideBanner() {
  const banner = document.getElementById('demo-banner');
  if (banner) banner.classList.add('hidden');
}

function inspectPayload(msgId) {
  const msg = impMessages.find(m => m.message_id === msgId);
  if (!msg) return;
  document.getElementById('modal-title').textContent = `IMP Payload: [${msg.sender_mind} → ${msg.target_mind}] (${msg.action_type})`;
  document.getElementById('modal-json').textContent = JSON.stringify(msg, null, 2);
  document.getElementById('modal-payload').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-payload').classList.add('hidden');
}

function escapeHtml(str) {
  if (typeof str !== 'string') return String(str);
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
