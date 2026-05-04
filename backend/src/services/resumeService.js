import { prisma } from '../prisma/client.js';
import { parseResumeWithAI } from './aiService.js';
import { ApiError } from '../middleware/errorHandler.js';
import { PDFParse } from 'pdf-parse';

// Takes a PDF buffer, extracts text, parses with AI, saves to DB (upsert)
export const uploadAndParseResume = async (userId, pdfBuffer) => {
  // 1. Extract text from PDF (v2 API: instantiate PDFParse, call getText)
  const parser = new PDFParse({ data: pdfBuffer });
  const textResult = await parser.getText();
  const rawText = textResult.text?.trim();
  await parser.destroy();

  if (!rawText || rawText.length < 50) {
    throw new ApiError(400, 'PDF appears empty or unreadable. Try a different file.');
  }

  // 2. Send to AI for structured parsing
  const parsed = await parseResumeWithAI(rawText);

  // 3. Upsert resume record (one per user — create if missing, update if exists)
  const resume = await prisma.resume.upsert({
    where: { userId },
    create: {
      userId,
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      location: parsed.location,
      linkedin: parsed.linkedin,
      github: parsed.github,
      portfolio: parsed.portfolio,
      skills: parsed.skills ?? [],
      experience: parsed.experience ?? [],
      education: parsed.education ?? [],
      projects: parsed.projects ?? [],
      rawText,
    },
    update: {
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      location: parsed.location,
      linkedin: parsed.linkedin,
      github: parsed.github,
      portfolio: parsed.portfolio,
      skills: parsed.skills ?? [],
      experience: parsed.experience ?? [],
      education: parsed.education ?? [],
      projects: parsed.projects ?? [],
      rawText,
    },
  });

  return { resume, isMock: parsed._mock === true };
};

// Get the current user's resume (or null if not uploaded yet)
export const getResume = async (userId) => {
  return prisma.resume.findUnique({ where: { userId } });
};

// Update resume fields after the user edits them in the UI
export const updateResume = async (userId, data) => {
  // Only allow these fields to be updated — protects against bad input
  const allowed = [
    'name', 'email', 'phone', 'location',
    'linkedin', 'github', 'portfolio',
    'skills', 'experience', 'education', 'projects',
  ];
  const safe = {};
  for (const key of allowed) {
    if (key in data) safe[key] = data[key];
  }

  // Verify resume exists before update
  const existing = await prisma.resume.findUnique({ where: { userId } });
  if (!existing) throw new ApiError(404, 'Resume not found. Upload one first.');

  return prisma.resume.update({ where: { userId }, data: safe });
};