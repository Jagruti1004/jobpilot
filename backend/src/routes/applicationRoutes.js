import { Router } from 'express';
import {
  list,
  create,
  update,
  remove,
  patchStatus,
  parseLink,
} from '../controllers/applicationController.js';
import { requireAuth } from '../middleware/auth.js';

export const applicationRoutes = Router();

// All application routes are protected
applicationRoutes.use(requireAuth);

// Order matters: more specific routes (parse-job-link, /:id/status) before generic /:id
applicationRoutes.post('/parse-job-link', parseLink);
applicationRoutes.patch('/:id/status', patchStatus);

applicationRoutes.get('/', list);
applicationRoutes.post('/', create);
applicationRoutes.put('/:id', update);
applicationRoutes.delete('/:id', remove);