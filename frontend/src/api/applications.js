import { api } from './client.js';

export const applicationApi = {
  // GET /api/applications
  list: () => api.get('/applications').then((r) => r.data.applications),

  // POST /api/applications
  create: (data) => api.post('/applications', data).then((r) => r.data.application),

  // PUT /api/applications/:id
  update: (id, data) => api.put(`/applications/${id}`, data).then((r) => r.data.application),

  // DELETE /api/applications/:id
  remove: (id) => api.delete(`/applications/${id}`).then((r) => r.data),

  // PATCH /api/applications/:id/status — drag-and-drop endpoint
  updateStatus: (id, status, position) =>
    api.patch(`/applications/${id}/status`, { status, position }).then((r) => r.data.application),

  // POST /api/applications/parse-job-link
  parseLink: (url) => api.post('/applications/parse-job-link', { url }).then((r) => r.data),
};