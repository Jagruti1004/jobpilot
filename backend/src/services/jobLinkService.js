import * as cheerio from 'cheerio';
import { ApiError } from '../middleware/errorHandler.js';
import Groq from 'groq-sdk';

const apiKey = process.env.GROQ_API_KEY;
const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are a job posting parser. Extract structured data from the job posting text.

Return JSON in this exact shape:
{
  "company": "string",
  "role": "string",
  "location": "string or null",
  "experienceRequired": "string or null (e.g. '3-5 years', 'Entry level')",
  "skillsRequired": ["array of strings"],
  "description": "string — a 1-2 sentence summary of the job"
}

Rules:
- Use null for missing string fields, [] for missing arrays.
- Do not invent data. If you cannot find the company or role clearly, use empty strings.
- Return only valid JSON, no markdown, no explanation.`;

// Fetch a job URL and return cleaned-up text suitable for AI parsing
const fetchAndCleanHtml = async (url) => {
  const res = await fetch(url, {
    headers: {
      // Some job sites block default fetch user-agents; pretend to be a browser
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
    },
  });

  if (!res.ok) {
    throw new ApiError(400, `Could not fetch the URL (HTTP ${res.status})`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // Remove non-content elements
  $('script, style, noscript, iframe, header, footer, nav').remove();

  // Get readable text, collapse whitespace
  const text = $('body').text().replace(/\s+/g, ' ').trim();

  // Cap length to keep AI prompts cheap (jobs rarely need more than ~6000 chars)
  return text.slice(0, 6000);
};

// Empty fallback when AI is unavailable — frontend will show a manual-entry form
const buildEmptyResponse = () => ({
  company: '',
  role: '',
  location: null,
  experienceRequired: null,
  skillsRequired: [],
  description: null,
  _mock: true,
});

export const parseJobLink = async (url) => {
  if (!url || !url.startsWith('http')) {
    throw new ApiError(400, 'A valid job URL is required (must start with http or https)');
  }

  let cleanText;
  try {
    cleanText = await fetchAndCleanHtml(url);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(400, 'Failed to fetch the URL. The site may be blocking us, or the link is invalid.');
  }

  if (cleanText.length < 200) {
    // Page had almost no content — likely client-rendered / JS-heavy site (LinkedIn, Workday, etc.)
    return { ...buildEmptyResponse(), sourceUrl: url };
  }

  if (!apiKey) {
    console.warn('[JobLink] No GROQ_API_KEY set, returning empty for manual entry');
    return { ...buildEmptyResponse(), sourceUrl: url };
  }

  try {
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Job posting text:\n---\n${cleanText}` },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from Groq');
    const parsed = JSON.parse(content);
    return { ...parsed, sourceUrl: url };
  } catch (err) {
    console.error('[JobLink] Groq call failed, falling back to empty:', err.message);
    return { ...buildEmptyResponse(), sourceUrl: url };
  }
};