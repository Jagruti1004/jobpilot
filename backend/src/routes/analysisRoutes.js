import { Router } from 'express';
import { get, generate } from '../controllers/analysisController.js';
import { requireAuth } from '../middleware/auth.js';

export const analysisRoutes = Router();

analysisRoutes.use(requireAuth);

analysisRoutes.get('/', get);
analysisRoutes.post('/generate', generate);