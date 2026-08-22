const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.detail || `HTTP Error ${response.status}`);
  }

  return response.json();
}

export const api = {
  getMemoryState: () => request('/api/state'),

  rememberPreference: (preference) =>
    request('/api/memory/preferences', {
      method: 'POST',
      body: JSON.stringify({ preference }),
    }),
  
  getMindsStatus: () => request('/api/minds/status'),
  
  getImpHistory: (limit = 50) => request(`/api/imp/history?limit=${limit}`),
  
  resetDemoState: () => request('/api/demo/reset', { method: 'POST' }),
  
  runDemoStep: (stepId, feedback = null) => {
    const options = { method: 'POST' };
    if (feedback !== null) {
      options.body = JSON.stringify({ feedback });
    }
    return request(`/api/demo/step/${stepId}`, options);
  },
  
  runFullDemo: () => request('/api/demo/full', { method: 'POST' }),
  
  submitActionFeedback: (feedback) => 
    request('/api/action/feedback', {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    }),
  
  approveAction: (actionName = 'Sponsorship Outreach Pitch for TechBrand Inc.') => 
    request('/api/action/approve', {
      method: 'POST',
      body: JSON.stringify({ action_name: actionName }),
    }),

  onboardCreator: (data) =>
    request('/api/creator/onboard', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  rejectAction: (itemId, reasonCategory, notes = '') =>
    request('/api/action/reject', {
      method: 'POST',
      body: JSON.stringify({ item_id: itemId, reason_category: reasonCategory, notes }),
    }),

  compareRecommendations: () =>
    request('/api/recommendation/compare', {
      method: 'POST',
    }),

  getSignals: () => request('/api/signals'),

  triggerBriefing: (objectiveId) =>
    request('/api/briefing/trigger', {
      method: 'POST',
      body: JSON.stringify({ objective_id: objectiveId }),
    }),

  getLatestBriefing: () => request('/api/briefing/latest'),

  getRunBriefing: (runId) => request(`/api/briefing/run/${encodeURIComponent(runId)}`),

  getBriefingStatus: (runId) =>
    request(runId ? `/api/briefing/status?run_id=${runId}` : '/api/briefing/status'),

  runMemoryProofTest: (constraintText = "I don't like clickbait.") =>
    request('/api/memory/proof-test', {
      method: 'POST',
      body: JSON.stringify({ constraint_text: constraintText }),
    }),

  getMindsProvenanceTrace: () => request('/api/minds/provenance-trace'),

  createObjective: (title, details = '') =>
    request('/api/objective/create', {
      method: 'POST',
      body: JSON.stringify({ title, details }),
    }),

  runObjective: (objectiveId) =>
    request('/api/objective/run', {
      method: 'POST',
      body: JSON.stringify({ objective_id: objectiveId }),
    }),

  listObjectives: () => request('/api/objective/list'),
};
