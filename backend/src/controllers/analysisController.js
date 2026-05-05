import { generateAnalysis, getAnalysis } from '../services/analysisService.js';

// GET /api/analysis — return cached report (or null)
export const get = async (req, res, next) => {
  try {
    const analysis = await getAnalysis(req.userId);
    res.json({ analysis });
  } catch (err) {
    next(err);
  }
};

// POST /api/analysis/generate — regenerate report (overwrites cached)
export const generate = async (req, res, next) => {
  try {
    const analysis = await generateAnalysis(req.userId);
    res.json({ analysis });
  } catch (err) {
    next(err);
  }
};