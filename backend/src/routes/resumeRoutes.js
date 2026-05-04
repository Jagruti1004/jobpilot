import { Router } from 'express';
import multer from 'multer';
import { upload, get, update } from '../controllers/resumeController.js';
import { requireAuth } from '../middleware/auth.js';

// Multer config: keep file in memory (don't save to disk), 10MB max
const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const resumeRoutes = Router();

// All resume routes are protected
resumeRoutes.use(requireAuth);

// Field name 'file' is what the frontend will use in FormData.append('file', pdf)
resumeRoutes.post('/upload', uploader.single('file'), upload);
resumeRoutes.get('/', get);
resumeRoutes.put('/', update);