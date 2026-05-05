import {
  listApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  updateStatus,
} from '../services/applicationService.js';
import { parseJobLink } from '../services/jobLinkService.js';
import { ApiError } from '../middleware/errorHandler.js';

// GET /api/applications
export const list = async (req, res, next) => {
  try {
    const applications = await listApplications(req.userId);
    res.json({ applications });
  } catch (err) {
    next(err);
  }
};

// POST /api/applications
export const create = async (req, res, next) => {
  try {
    const application = await createApplication(req.userId, req.body);
    res.status(201).json({ application });
  } catch (err) {
    next(err);
  }
};

// PUT /api/applications/:id
export const update = async (req, res, next) => {
  try {
    const application = await updateApplication(req.userId, req.params.id, req.body);
    res.json({ application });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/applications/:id
export const remove = async (req, res, next) => {
  try {
    await deleteApplication(req.userId, req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/applications/:id/status — drag-and-drop endpoint
export const patchStatus = async (req, res, next) => {
  try {
    const { status, position } = req.body;
    if (!status) throw new ApiError(400, 'Status is required');
    const application = await updateStatus(req.userId, req.params.id, status, position);
    res.json({ application });
  } catch (err) {
    next(err);
  }
};

// POST /api/applications/parse-job-link
export const parseLink = async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) throw new ApiError(400, 'URL is required');
    const parsed = await parseJobLink(url);
    res.json(parsed);
  } catch (err) {
    next(err);
  }
};