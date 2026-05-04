import { uploadAndParseResume, getResume, updateResume } from '../services/resumeService.js';
import { ApiError } from '../middleware/errorHandler.js';

// POST /api/resume/upload — multer puts the file in req.file
export const upload = async (req, res, next) => {
  try {
    if (!req.file) throw new ApiError(400, 'No file uploaded');
    if (req.file.mimetype !== 'application/pdf') {
      throw new ApiError(400, 'Only PDF files are supported');
    }

    const result = await uploadAndParseResume(req.userId, req.file.buffer);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// GET /api/resume — returns current user's resume (or null)
export const get = async (req, res, next) => {
  try {
    const resume = await getResume(req.userId);
    res.json({ resume });
  } catch (err) {
    next(err);
  }
};

// PUT /api/resume — update edited fields
export const update = async (req, res, next) => {
  try {
    const resume = await updateResume(req.userId, req.body);
    res.json({ resume });
  } catch (err) {
    next(err);
  }
};