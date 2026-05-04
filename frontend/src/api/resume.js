import { api } from './client.js';

export const resumeApi = {
  // GET /api/resume — fetch current user's resume (or null)
  get: () => api.get('/resume').then((r) => r.data.resume),

  // POST /api/resume/upload — upload PDF, returns { resume, isMock }
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file); // 'file' must match multer's uploader.single('file')
    return api
      .post('/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  // PUT /api/resume — save edited fields
  update: (data) => api.put('/resume', data).then((r) => r.data.resume),
};