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
  
  onboardCreator: (data) =>
    request('/api/creator/onboard', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  triggerBriefing: (objectiveId) =>
    request('/api/briefing/trigger', {
      method: 'POST',
      body: JSON.stringify({ objective_id: objectiveId }),
    }),

  getLatestBriefing: () => request('/api/briefing/latest'),

  getRecentBriefingRuns: () => request('/api/briefing/recent'),

  getRunBriefing: (runId) => request(`/api/briefing/run/${encodeURIComponent(runId)}`),

  getBriefingStatus: (runId) =>
    request(runId ? `/api/briefing/status?run_id=${runId}` : '/api/briefing/status'),

  createObjective: (title, details = '') =>
    request('/api/objective/create', {
      method: 'POST',
      body: JSON.stringify({ title, details }),
    }),

};
