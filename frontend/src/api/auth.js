import { api } from './client.js';

export const authApi = {
  register: (email, password, name) =>
    api.post('/auth/register', { email, password, name }).then((r) => r.data),

  login: (email, password) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),

  me: () => api.get('/auth/me').then((r) => r.data.user),
};