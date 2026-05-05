import { prisma } from '../prisma/client.js';
import { ApiError } from '../middleware/errorHandler.js';

// GET /api/applications — return all applications for the user, ordered by Kanban position
export const listApplications = async (userId) => {
  return prisma.application.findMany({
    where: { userId },
    orderBy: [{ status: 'asc' }, { position: 'asc' }, { createdAt: 'desc' }],
  });
};

// POST /api/applications — create a new application (manual entry or after job-link parse)
export const createApplication = async (userId, data) => {
  if (!data.company || !data.role) {
    throw new ApiError(400, 'Company and role are required');
  }

  // Place new card at the bottom of its column (highest position + 1)
  const last = await prisma.application.findFirst({
    where: { userId, status: data.status || 'SAVED' },
    orderBy: { position: 'desc' },
  });
  const position = last ? last.position + 1 : 0;

  return prisma.application.create({
    data: {
      userId,
      company: data.company,
      role: data.role,
      location: data.location || null,
      experienceRequired: data.experienceRequired || null,
      sourceUrl: data.sourceUrl || null,
      description: data.description || null,
      skillsRequired: data.skillsRequired ?? [],
      status: data.status || 'SAVED',
      matchScore: data.matchScore ?? null,
      appliedDate: data.appliedDate ? new Date(data.appliedDate) : null,
      position,
    },
  });
};

// PUT /api/applications/:id — edit an existing application
export const updateApplication = async (userId, id, data) => {
  // Verify the application exists AND belongs to this user
  const existing = await prisma.application.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new ApiError(404, 'Application not found');
  }

  const allowed = [
    'company', 'role', 'location', 'experienceRequired',
    'sourceUrl', 'description', 'skillsRequired',
    'status', 'matchScore', 'appliedDate',
  ];
  const safe = {};
  for (const key of allowed) {
    if (key in data) {
      safe[key] = key === 'appliedDate' && data[key]
        ? new Date(data[key])
        : data[key];
    }
  }

  return prisma.application.update({ where: { id }, data: safe });
};

// DELETE /api/applications/:id
export const deleteApplication = async (userId, id) => {
  const existing = await prisma.application.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new ApiError(404, 'Application not found');
  }
  await prisma.application.delete({ where: { id } });
};

// PATCH /api/applications/:id/status — drag-and-drop endpoint
// Updates status + position. If user dropped to APPLIED for the first time, auto-set appliedDate.
export const updateStatus = async (userId, id, status, position) => {
  const existing = await prisma.application.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new ApiError(404, 'Application not found');
  }

  const validStatuses = ['SAVED', 'APPLIED', 'IN_CONTACT', 'INTERVIEWING', 'REJECTED', 'OFFER'];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, 'Invalid status');
  }

  // Auto-set appliedDate the first time a card moves to APPLIED
  const updates = { status, position: position ?? 0 };
  if (status === 'APPLIED' && !existing.appliedDate) {
    updates.appliedDate = new Date();
  }

  return prisma.application.update({ where: { id }, data: updates });
};