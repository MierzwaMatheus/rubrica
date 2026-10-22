import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
import { allowedOrigins, siteUrl } from './lib/siteUrl';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function hmacKeyFingerprint(apiKey: string): Promise<string> {
  const pepper = process.env.PLAYGROUND_KEY_PEPPER;
  if (!pepper) throw new Error('PLAYGROUND_KEY_PEPPER not configured');
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(pepper), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', keyMaterial, new TextEncoder().encode(apiKey));
  return Array.from(new Uint8Array(sig)).slice(0, 4).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function callOpenRouter(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userMessage: string,
  temperature = 0.3,
): Promise<string> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': siteUrl(),
      'X-Title': 'Portfolio Playground',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }],
      temperature,
    }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter error (${model}): ${err.slice(0, 300)}`);
  }
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data?.choices?.[0]?.message?.content?.trim() ?? '';
}

function parseJson(raw: string): unknown {
  const cleaned = raw.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
  return JSON.parse(cleaned);
}

// ── Demo mode: single model ───────────────────────────────────────────────────

async function generateDemo(apiKey: string, jobDescription: string, locale: string, cvContent?: string): Promise<unknown> {
  const cvNote = cvContent
    ? `Use the candidate's CV provided below as the basis for the resume.`
    : `Create a realistic example CV since no CV was provided.`;

  const langInstruction = locale === 'pt-BR'
    ? 'ALL text values in the JSON (summary, role titles, descriptions, etc.) MUST be written in Brazilian Portuguese (pt-BR).'
    : 'ALL text values in the JSON (summary, role titles, descriptions, etc.) MUST be written in English (en-US).';

  const systemPrompt = `You are a resume expert. ${cvContent ? 'Use the candidate CV provided as the basis.' : 'Create a realistic example CV.'} Analyze the job description and generate an adapted resume in JSON with fields: name, title, summary, skills (string array), experience (array with role/company/period/description), education (array with degree/institution/period). ${langInstruction} Respond ONLY with valid JSON, no markdown.`;

  const userMessage = cvContent
    ? `JOB DESCRIPTION:\n${jobDescription}\n\nCANDIDATE CV:\n${cvContent}\n\nRemember: output locale is ${locale}.`
    : `JOB DESCRIPTION:\n${jobDescription}\n\nOutput locale: ${locale}.`;

  const raw = await callOpenRouter(apiKey, 'google/gemini-2.0-flash-001', systemPrompt, userMessage, 0.3);
  return parseJson(raw);
}

// ── Production mode: 3-model pipeline ────────────────────────────────────────

const GEMINI_SYSTEM = `You are an expert ATS recruiter and job description analyst.
Analyze a job description and extract structured requirements as a JSON object.
Return ONLY a valid JSON object, no markdown, no explanations.

JSON structure:
{
  "jobTitle": "string",
  "seniority": "junior | mid | senior | lead",
  "requiredSkills": ["string"],
  "optionalSkills": ["string"],
  "softSkills": ["string"],
  "stack": ["string"],
  "keywords": ["string"]
}`;

const GPT_SYSTEM = `You are an expert technical recruiter specializing in ATS scoring.
Compare a candidate's profile against a job analysis and return a match report.
Return ONLY a valid JSON object, no markdown, no explanations.
fitComment, strengths, weaknesses MUST be written in Brazilian Portuguese (pt-BR).

JSON structure:
{
  "fitScore": number (0-100),
  "fitComment": "string (2-3 sentences in pt-BR)",
  "strengths": ["string in pt-BR"],
  "weaknesses": ["string in pt-BR"],
  "keywordsToIncorporate": ["string"]
}`;

const CLAUDE_SYSTEM = `You are an expert ATS resume writer. Rewrite a candidate's CV to maximize compatibility with a specific job.
Return ONLY a valid JSON object, no markdown.
NEVER invent experiences, skills, or achievements not in the original CV.
NEVER use personal pronouns or em dashes.

JSON structure:
{
  "name": "string",
  "title": "string (adapted to job title)",
  "summary": "string (2-3 lines, keywords integrated, no personal pronouns)",
  "skills": ["string (reordered to match job)"],
  "experience": [{"role": "string", "company": "string", "period": "string", "description": "string"}],
  "education": [{"degree": "string", "institution": "string", "period": "string"}],
  "fitScore": number,
  "fitComment": "string in pt-BR",
  "strengths": ["string in pt-BR"],
  "weaknesses": ["string in pt-BR"]
}`;

async function generateProduction(apiKey: string, jobDescription: string, locale: string, cvContent?: string): Promise<unknown> {
  const cvPlaceholder = cvContent ?? `This is a playground demonstration. Generate a realistic example CV in locale: ${locale} that would be a reasonable match for the provided job description.`;

  // Step 1 — Gemini: analyze job
  const geminiRaw = await callOpenRouter(
    apiKey,
    'google/gemini-2.0-flash-001',
    GEMINI_SYSTEM,
    `Analyze this job description:\n\n${jobDescription}`,
    0.2,
  );
  const jobAnalysis = parseJson(geminiRaw);

  // Step 2 — GPT: score match
  const gptRaw = await callOpenRouter(
    apiKey,
    'openai/gpt-4o-mini',
    GPT_SYSTEM,
    `CANDIDATE PROFILE:\n${cvPlaceholder}\n\nJOB ANALYSIS:\n${JSON.stringify(jobAnalysis, null, 2)}`,
    0.3,
  );
  const matchReport = parseJson(gptRaw);

  // Step 3 — Claude: rewrite CV
  const claudeRaw = await callOpenRouter(
    apiKey,
    'anthropic/claude-sonnet-4-6',
    CLAUDE_SYSTEM,
    `CV PROFILE:\n${cvPlaceholder}\n\nJOB ANALYSIS:\n${JSON.stringify(jobAnalysis, null, 2)}\n\nMATCH REPORT:\n${JSON.stringify(matchReport, null, 2)}\n\nLocale: ${locale}`,
    0.4,
  );
  return parseJson(claudeRaw);
}

// ── HTTP Action ───────────────────────────────────────────────────────────────

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Id',
    'Vary': 'Origin',
  };
}

function json(body: unknown, status = 200, origin: string | null = null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (origin) Object.assign(headers, corsHeaders(origin));
  return new Response(JSON.stringify(body), { status, headers });
}

export const aiProxy = httpAction(async (ctx, req) => {
  const origin = req.headers.get('origin');

  // Block requests from disallowed origins (server-to-server bypasses browser CORS)
  if (!origin || !allowedOrigins().has(origin)) {
    return new Response('Forbidden', { status: 403 });
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const sessionId = req.headers.get('x-session-id');
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!sessionId || !UUID_RE.test(sessionId)) {
    return json({ error: 'Missing or invalid session' }, 400, origin);
  }
  const apiKey = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!apiKey) return json({ error: 'Missing API key' }, 401, origin);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rateLimitResult = await ctx.runMutation(internal.playground.checkAndRecordAiRateLimit, { ip });
  if (!rateLimitResult.allowed) {
    return json({ error: 'Rate limit exceeded', blockedUntil: rateLimitResult.blockedUntil }, 429, origin);
  }

  let body: { jobDescription?: string; locale?: string; mode?: string; cvContent?: string };
  try { body = await req.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400, origin); }

  const { jobDescription, locale = 'pt-BR', mode = 'demo', cvContent } = body;
  if (!jobDescription || typeof jobDescription !== 'string') {
    return json({ error: 'jobDescription is required' }, 400, origin);
  }

  const keyFingerprint = await hmacKeyFingerprint(apiKey);
  const models = mode === 'production'
    ? ['google/gemini-2.0-flash-001', 'openai/gpt-4o-mini', 'anthropic/claude-sonnet-4-6']
    : ['google/gemini-flash-1.5'];

  let cvData: unknown = null;
  let success = false;
  let errorMessage: string | undefined;

  try {
    cvData = mode === 'production'
      ? await generateProduction(apiKey, jobDescription, locale, cvContent)
      : await generateDemo(apiKey, jobDescription, locale, cvContent);
    success = true;
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : 'Unknown error';
  }

  try {
    await ctx.runMutation(internal.playground.internalLogEvent, {
      sessionId,
      eventType: 'playground.ai_cv_generated',
      metadata: { keyFingerprint, models, mode, success, error: errorMessage },
      ipAddress: ip,
      userAgent: req.headers.get('user-agent') ?? undefined,
    });
  } catch { /* non-fatal */ }

  if (!success) return json({ error: errorMessage ?? 'Failed to generate CV' }, 500, origin);
  return json({ cvData, mode, models }, 200, origin);
});
