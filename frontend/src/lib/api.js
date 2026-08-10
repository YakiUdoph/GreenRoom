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
};
