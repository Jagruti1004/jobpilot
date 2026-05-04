import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

// Strict JSON schema we want Gemini to fill in
const RESUME_SCHEMA_PROMPT = `
You are a resume parser. Extract the resume data from the text below into this exact JSON shape.
Return ONLY valid JSON, no markdown, no explanation.

{
  "name": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "location": "string or null",
  "linkedin": "string or null",
  "github": "string or null",
  "portfolio": "string or null",
  "skills": ["array of strings"],
  "experience": [{ "company": "", "role": "", "duration": "", "description": "" }],
  "education": [{ "school": "", "degree": "", "year": "" }],
  "projects": [{ "name": "", "description": "", "link": "" }]
}

If a field is missing in the resume, use null (for strings) or [] (for arrays). Do not invent data.

Resume text:
---
`;

// Mock fallback — used when no API key is set
const buildMockResponse = (rawText) => ({
  name: 'Jane Doe',
  email: 'jane.doe@example.com',
  phone: '+1 555-123-4567',
  location: 'San Francisco, CA',
  linkedin: 'https://linkedin.com/in/janedoe',
  github: 'https://github.com/janedoe',
  portfolio: null,
  skills: ['JavaScript', 'React', 'Node.js', 'PostgreSQL', 'TypeScript'],
  experience: [
    {
      company: 'Acme Corp',
      role: 'Senior Software Engineer',
      duration: '2022 - Present',
      description: 'Led frontend redesign; mentored 3 junior engineers.',
    },
  ],
  education: [{ school: 'UC Berkeley', degree: 'B.S. Computer Science', year: '2020' }],
  projects: [
    {
      name: 'JobPilot',
      description: 'AI-powered job application tracker',
      link: 'https://github.com/janedoe/jobpilot',
    },
  ],
  _mock: true, // Flag so frontend can show "AI is in mock mode"
  _rawTextLength: rawText.length,
});

export const parseResumeWithAI = async (rawText) => {
  // No key? Return mock immediately.
  if (!apiKey) {
    console.warn('[AI] No GEMINI_API_KEY set, returning mock data');
    return buildMockResponse(rawText);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const aiModel = genAI.getGenerativeModel({
      model,
      generationConfig: { responseMimeType: 'application/json' }, // Forces JSON output
    });

    const result = await aiModel.generateContent(RESUME_SCHEMA_PROMPT + rawText);
    const responseText = result.response.text();
    return JSON.parse(responseText);
  } catch (err) {
    console.error('[AI] Gemini call failed, falling back to mock:', err.message);
    return buildMockResponse(rawText);
  }
};