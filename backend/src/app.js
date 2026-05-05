import express from 'express';
import cors from 'cors';
import { authRoutes } from './routes/authRoutes.js';
import { resumeRoutes } from './routes/resumeRoutes.js';
import { applicationRoutes } from './routes/applicationRoutes.js';
import { analysisRoutes } from './routes/analysisRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

// Allow frontend (port 5173) to call backend (port 4000)
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);

// Parse JSON request bodies (10mb limit for resume PDFs in Phase 2)
app.use(express.json({ limit: '10mb' }));

// Health check endpoint — useful for verifying server is running
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Mount auth routes at /api/auth
app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/analysis', analysisRoutes);

// Must be registered LAST — catches all errors thrown upstream
app.use(errorHandler);