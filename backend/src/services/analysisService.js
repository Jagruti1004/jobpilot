import Groq from 'groq-sdk';
import { prisma } from '../prisma/client.js';
import { ApiError } from '../middleware/errorHandler.js';

const apiKey = process.env.GROQ_API_KEY;
const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

// What we expect Groq to return — strict JSON shape, fully editorial
const SYSTEM_PROMPT = `You are an expert job-search coach. Given a candidate's resume and their job application history (with statuses), produce a structured coaching report.

Return JSON in this exact shape:
{
  "callbackHealth": {
    "verdict": "string — one of: 'Excellent', 'Healthy', 'Needs work', 'Critical'",
    "summary": "string — 1-2 sentence honest take on their callback rate"
  },
  "resumeJobMatch": {
    "summary": "string — 2-3 sentences on how well their resume aligns with the jobs they're applying to",
    "strengths": ["array of strings — specific resume strengths relative to their target roles"],
    "gaps": ["array of strings — specific gaps between resume and job requirements"]
  },
  "missingSkills": [
    { "skill": "string", "frequency": "number — how many job descriptions mention it", "priority": "string — 'High', 'Medium', or 'Low'" }
  ],
  "applicationPatternIssues": ["array of strings — concrete issues with their application strategy"],
  "missingProfileSignals": ["array of strings — what's missing from resume/profile (e.g., 'No GitHub link', 'No quantified impact metrics')"],
  "bestFitRoleTypes": ["array of strings — role types where this candidate is most likely to succeed, based on their resume + best-matching applications"],
  "sevenDayActionPlan": [
    { "day": "number 1-7", "action": "string — concrete action item", "rationale": "string — why this matters" }
  ]
}

Rules:
- Be specific and honest. No generic advice like "tailor your resume" — say WHAT to tailor and HOW.
- For missingSkills, only include skills mentioned in 2+ job descriptions but not on the resume.
- For sevenDayActionPlan, give 7 distinct days with progressively building actions.
- Return only valid JSON, no markdown.`;

// Compute the simple metrics deterministically — no AI needed for math
const computeStats = (applications) => {
  const totalApplied = applications.filter((a) =>
    ['APPLIED', 'IN_CONTACT', 'INTERVIEWING', 'REJECTED', 'OFFER'].includes(a.status)
  ).length;

  const totalCallbacks = applications.filter((a) =>
    ['IN_CONTACT', 'INTERVIEWING', 'OFFER'].includes(a.status)
  ).length;

  const callbackRate = totalApplied > 0 ? totalCallbacks / totalApplied : 0;

  // Status counts for the prompt context
  const statusCounts = {};
  applications.forEach((a) => {
    statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
  });

  return { totalApplied, totalCallbacks, callbackRate, statusCounts };
};

// Strip resume to only the bits the AI needs (saves tokens)
const summarizeResume = (resume) => ({
  name: resume.name,
  location: resume.location,
  linkedin: resume.linkedin,
  github: resume.github,
  portfolio: resume.portfolio,
  skills: resume.skills,
  experience: resume.experience,
  education: resume.education,
  projects: resume.projects,
});

const summarizeApplications = (applications) =>
  applications.map((a) => ({
    company: a.company,
    role: a.role,
    location: a.location,
    experienceRequired: a.experienceRequired,
    skillsRequired: a.skillsRequired,
    status: a.status,
    description: a.description?.slice(0, 500), // Cap to keep prompt size sane
  }));

// Empty fallback when AI is unavailable
const buildEmptyReport = () => ({
  callbackHealth: {
    verdict: 'Unknown',
    summary: 'AI analysis is unavailable right now. Try again in a moment.',
  },
  resumeJobMatch: { summary: '', strengths: [], gaps: [] },
  missingSkills: [],
  applicationPatternIssues: [],
  missingProfileSignals: [],
  bestFitRoleTypes: [],
  sevenDayActionPlan: [],
  _mock: true,
});

// Main entry: regenerate the analysis for this user
export const generateAnalysis = async (userId) => {
  // Fetch resume + applications
  const [resume, applications] = await Promise.all([
    prisma.resume.findUnique({ where: { userId } }),
    prisma.application.findMany({ where: { userId } }),
  ]);

  if (!resume) {
    throw new ApiError(400, 'Upload your resume first to generate an analysis.');
  }
  if (applications.length < 3) {
    throw new ApiError(
      400,
      `Add at least 3 applications to generate analysis (you have ${applications.length}).`
    );
  }

  const stats = computeStats(applications);

  // Build the user-facing prompt
  const userPrompt = `
RESUME:
${JSON.stringify(summarizeResume(resume), null, 2)}

APPLICATIONS (${applications.length} total):
${JSON.stringify(summarizeApplications(applications), null, 2)}

STATS:
- Applied to ${stats.totalApplied} jobs
- Got ${stats.totalCallbacks} callbacks (any positive response: in-contact, interviewing, or offer)
- Callback rate: ${(stats.callbackRate * 100).toFixed(1)}%
- Status breakdown: ${JSON.stringify(stats.statusCounts)}

Generate the coaching report now.`;

  let report;
  if (!apiKey) {
    console.warn('[Analysis] No GROQ_API_KEY set, returning empty report');
    report = buildEmptyReport();
  } else {
    try {
      const groq = new Groq({ apiKey });
      const completion = await groq.chat.completions.create({
        model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from Groq');
      report = JSON.parse(content);
    } catch (err) {
      console.error('[Analysis] Groq call failed, falling back to empty:', err.message);
      report = buildEmptyReport();
    }
  }

  // Upsert (one analysis per user — replace previous)
  const saved = await prisma.analysis.upsert({
    where: { userId },
    create: {
      userId,
      report,
      callbackRate: stats.callbackRate,
      totalApplied: stats.totalApplied,
      totalCallbacks: stats.totalCallbacks,
    },
    update: {
      report,
      callbackRate: stats.callbackRate,
      totalApplied: stats.totalApplied,
      totalCallbacks: stats.totalCallbacks,
    },
  });

  return saved;
};

// Get the cached analysis (or null)
export const getAnalysis = async (userId) => {
  return prisma.analysis.findUnique({ where: { userId } });
};