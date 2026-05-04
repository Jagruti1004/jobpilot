import Groq from 'groq-sdk';

const apiKey = process.env.GROQ_API_KEY;
const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are a resume parser. Extract resume data into JSON matching this exact shape:

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

Rules:
- Use null for missing string fields, [] for missing arrays.
- Do not invent data.
- Return only valid JSON, no markdown, no explanation.`;

// Empty fallback — used when no API key or AI call fails
// User can fill in manually via the edit form
const buildEmptyResponse = () => ({
  name: null,
  email: null,
  phone: null,
  location: null,
  linkedin: null,
  github: null,
  portfolio: null,
  skills: [],
  experience: [],
  education: [],
  projects: [],
  _mock: true, // Still flag it so frontend can show "AI unavailable" notice
});

export const parseResumeWithAI = async (rawText) => {
  if (!apiKey) {
    console.warn('[AI] No GROQ_API_KEY set, returning empty resume');
    return buildEmptyResponse();
  }

  try {
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      model,
      response_format: { type: 'json_object' }, // Forces valid JSON output
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Resume text:\n---\n${rawText}` },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from Groq');
    return JSON.parse(content);
  } catch (err) {
    console.error('[AI] Groq call failed, falling back to empty:', err.message);
    return buildEmptyResponse();
  }
};