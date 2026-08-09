// Greenroom Command Center Frontend JavaScript

let ws = null;
let currentMemoryState = {};
let impMessages = [];

// Initialize application on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initWebSocket();
  fetchInitialState();
});

// WebSocket Connection
function initWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('[Greenroom] WebSocket connected');
    document.getElementById('connection-status').textContent = '4 Minds Active';
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'INITIAL_SNAPSHOT') {
        impMessages = data.imp_history || [];
        currentMemoryState = data.memory_state || {};
        renderAll();
      } else if (data.type === 'IMP_MESSAGE') {
        impMessages.push(data.data);
        if (data.memory_state) {
          currentMemoryState = data.memory_state;
        }
        renderIMPStream();
        renderStateStore();
        checkAndRenderCards(data.data);
      }
    } catch (err) {
      console.error('[Greenroom] WS Parse Error:', err);
    }
  };

  ws.onclose = () => {
    document.getElementById('connection-status').textContent = 'Connecting...';
    setTimeout(initWebSocket, 2000);
  };
}

// Fetch State via REST API fallback
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

// Global Render Dispatcher
function renderAll() {
  renderIMPStream();
  renderStateStore();
  renderActiveCards();
}

// Render Inter-Mind Message Log (IMP)
function renderIMPStream() {
  const container = document.getElementById('activity-stream');
  document.getElementById('msg-count-badge').textContent = `${impMessages.length} messages`;

  if (!impMessages || impMessages.length === 0) {
    container.innerHTML = `
      <div class="p-4 bg-slate-950/60 border border-slate-800/60 rounded-xl text-slate-400 text-center italic">
        Waiting for agent network initialization... Run demo or trigger steps above.
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
  if (payload.trend_name) {
    if (payload.status === 'REJECTED') {
      return `REJECTED trend: "${payload.trend_name}". ${payload.rejection_reason || ''}`;
    }
    return `Flagged trend: "${payload.trend_name}". Fit Score: ${payload.fit_score || 0.92}. ${payload.relevance_reason || ''}`;
  }
  if (payload.extracted_hook) return `Extracted hook: ${payload.extracted_hook}`;
  if (payload.sponsor_name) return `Generated pitch for ${payload.sponsor_name}. Calculated match score: ${payload.match_score * 100}%.`;
  if (payload.script_concept) return `Synthesized Creative Script Concept. (Punchy: ${payload.is_punchy_voice ? 'YES' : 'NO'})`;
  if (payload.extracted_learned_rule) return `PROOF OF LEARNING: Updated persistent voice rule -> "${payload.extracted_learned_rule}"`;
  if (payload.action_name) return `Action approved: "${payload.action_name}"`;

  return JSON.stringify(payload).slice(0, 120) + '...';
}

// Render Persistent State Store Inspector
function renderStateStore() {
  if (!currentMemoryState) return;

  // Name & Voice Attributes
  document.getElementById('state-creator-name').textContent = currentMemoryState.creator_name || 'Alex Rivera';
  const voiceAttrs = currentMemoryState.brand_voice_attributes || [];
  document.getElementById('state-voice-attributes').innerHTML = voiceAttrs.map(v => 
    `<span class="px-2 py-0.5 bg-slate-900 text-slate-300 rounded text-[10px] border border-slate-800 font-sans">${escapeHtml(v)}</span>`
  ).join('');

  // Learned Voice Rules (Minute 5 Magic)
  const learnedRules = currentMemoryState.learned_voice_rules || [];
  document.getElementById('rule-count-badge').textContent = `${learnedRules.length} rules`;
  
  const rulesContainer = document.getElementById('state-learned-rules');
  if (learnedRules.length === 0) {
    rulesContainer.innerHTML = `<p class="text-slate-500 italic text-[11px]">No feedback rules learned yet. Run Minute 5 step to test proof of learning.</p>`;
  } else {
    rulesContainer.innerHTML = learnedRules.map(r => `
      <div class="p-2 bg-amber-950/40 border border-amber-800/60 rounded-lg text-amber-200 text-[11px] font-sans flex items-start gap-1.5 shadow-sm">
        <span class="text-amber-400 font-bold">✓</span>
        <span>${escapeHtml(r)}</span>
      </div>
    `).join('');
  }

  // Rejected Topics
  const rejected = currentMemoryState.rejected_topics || [];
  document.getElementById('state-rejected-topics').innerHTML = rejected.map(r => 
    `<p class="text-rose-300/80">• ${escapeHtml(r)}</p>`
  ).join('');

  // Monetization
  const mb = currentMemoryState.monetization_benchmarks || {};
  document.getElementById('state-cpm').textContent = mb.cpm_target ? `$${mb.cpm_target}` : '$45';
  document.getElementById('state-min-deal').textContent = mb.minimum_deal_size ? `$${mb.minimum_deal_size}` : '$5,000';

  // Memory Nodes
  const nodes = currentMemoryState.memory_nodes || [];
  const nodesContainer = document.getElementById('state-memory-nodes');
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

// Render Action Cards
function renderActiveCards() {
  // Check latest strategy message
  const stratMsg = impMessages.slice().reverse().find(m => m.action_type === 'DELEGATE_DRAFT');
  if (stratMsg && stratMsg.payload) {
    document.getElementById('script-concept-body').textContent = stratMsg.payload.script_concept || 'Script conceptualized.';
    if (stratMsg.payload.is_punchy_voice) {
      document.getElementById('punchy-tag').classList.remove('hidden');
    }
  }

  // Check latest pitch message
  const pitchMsg = impMessages.slice().reverse().find(m => m.action_type === 'PITCH_PROPOSAL');
  if (pitchMsg && pitchMsg.payload) {
    const p = pitchMsg.payload;
    document.getElementById('sponsor-card-title').textContent = `Pitch Draft for ${p.sponsor_name || 'TechBrand Inc.'}`;
    document.getElementById('match-score-badge').textContent = `Match: ${(p.match_score * 100).toFixed(0)}%`;
    document.getElementById('pitch-preview-box').textContent = p.pitch_draft || 'Draft created.';
  }
}

function checkAndRenderCards(msg) {
  renderActiveCards();
}

// Hackathon Step Runners
async function runStep(stepId) {
  showDemoBanner(stepId);
  try {
    let body = null;
    if (stepId === 5) {
      const fb = document.getElementById('feedback-input').value;
      body = JSON.stringify({ feedback: fb });
    }

    const res = await fetch(`/api/demo/step/${stepId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body
    });

    const data = await res.json();
    if (data.state) {
      currentMemoryState = data.state;
      renderStateStore();
    }
    updateProgressDots(stepId);
    setTimeout(hideDemoBanner, 1000);
  } catch (err) {
    console.error(`[Greenroom] Error running step ${stepId}:`, err);
    hideDemoBanner();
  }
}

async function runFullDemo() {
  for (let i = 1; i <= 5; i++) {
    await runStep(i);
    await new Promise(r => setTimeout(r, 600));
  }
}

async function resetState() {
  try {
    const res = await fetch('/api/demo/reset', { method: 'POST' });
    const data = await res.json();
    impMessages = [];
    currentMemoryState = data.state;
    renderAll();
    document.getElementById('punchy-tag').classList.add('hidden');
    document.getElementById('script-concept-body').textContent = 'Run Minute 3 demo step to trigger multi-mind strategy synthesis.';
    document.getElementById('pitch-preview-box').textContent = 'Run Minute 4 demo step to generate autonomous pitch proposal.';
  } catch (err) {
    console.error('[Greenroom] Error resetting state:', err);
  }
}

async function submitFeedback() {
  await runStep(5);
}

async function approveSponsorship() {
  try {
    const res = await fetch('/api/action/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action_name: "Sponsorship Outreach Pitch for TechBrand Inc." })
    });
    alert("Sponsorship Pitch Approved & Executed!");
  } catch (err) {
    console.error('[Greenroom] Error approving pitch:', err);
  }
}

function modifyPitch() {
  const newPitch = prompt("Enter modifications for Business Mind pitch:");
  if (newPitch) {
    document.getElementById('pitch-preview-box').textContent = newPitch;
  }
}

// UI Helpers & Modal
function showDemoBanner(stepId) {
  const titles = [
    "",
    "Minute 1: Zero-State Profile Ingestion",
    "Minute 2: Autonomous Trend Filtering (Scout Mind)",
    "Minute 3: Multi-Mind Strategy Synthesis (Core + Community)",
    "Minute 4: Autonomous Business Execution (Business Mind)",
    "Minute 5: Proof of Learning ('The Magic Moment')"
  ];
  document.getElementById('demo-banner').classList.remove('hidden');
  document.getElementById('demo-step-title').textContent = titles[stepId] || `Executing Step ${stepId}...`;
  updateProgressDots(stepId);
}

function hideDemoBanner() {
  document.getElementById('demo-banner').classList.add('hidden');
}

function updateProgressDots(activeStep) {
  for (let i = 1; i <= 5; i++) {
    const dot = document.getElementById(`dot-${i}`);
    if (dot) {
      if (i <= activeStep) {
        dot.className = "step-dot w-6 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400";
      } else {
        dot.className = "step-dot w-6 h-2 rounded-full bg-slate-800";
      }
    }
  }
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
