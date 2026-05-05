import { api } from './client.js';

export const analysisApi = {
  // GET /api/analysis — fetch cached report (or null)
  get: () => api.get('/analysis').then((r) => r.data.analysis),

  // POST /api/analysis/generate — regenerate (slow, ~5s)
  generate: () => api.post('/analysis/generate').then((r) => r.data.analysis),
};