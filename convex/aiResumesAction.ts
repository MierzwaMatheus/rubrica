"use node";

import { v } from 'convex/values';
import { action } from './_generated/server';
import { internal, api } from './_generated/api';
import { siteUrl } from './lib/siteUrl';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

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
      'X-Title': 'Portfolio AI Resume Generator',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter error (${model}): ${errorText}`);
  }

  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = data?.choices?.[0]?.message?.content?.trim() ?? '';
  return content;
}

function parseJsonResponse(raw: string): any {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

// ── Prompts ──────────────────────────────────────────────────────────────────

const GEMINI_SYSTEM = `You are an expert ATS (Applicant Tracking System) recruiter and job description analyst.
Your task: analyze a job description and extract its structured requirements as a JSON object.

OUTPUT RULES:
- Return ONLY a valid JSON object, no text before or after
- No markdown code blocks, no comments, no explanations

JSON structure:
{
  "jobTitle": "string",
  "seniority": "junior | mid | senior | lead | staff | principal",
  "requiredSkills": ["string"],
  "optionalSkills": ["string"],
  "softSkills": ["string"],
  "stack": ["string"],
  "keywords": ["string (critical ATS keywords from the description)"],
  "responsibilities": ["string (key responsibilities mentioned)"]
}`;

const GPT_SYSTEM = `You are an expert technical recruiter specializing in candidate-job matching and ATS scoring.
Your task: compare a candidate's CV against a structured job analysis and produce a match report.

OUTPUT RULES:
- Return ONLY a valid JSON object, no text before or after
- No markdown code blocks, no comments, no explanations
- fitComment, strengths, weaknesses MUST always be written in Brazilian Portuguese (pt-BR), regardless of the CV locale
- fitComment must NOT use personal pronouns (eu, minha, meu, me, nós, nosso, nossa) or em dashes (—)
- fitComment must NOT use AI buzzwords (inovador, cutting-edge, alavancar, sinergia, game-changing, etc.)

JSON structure:
{
  "fitScore": number (0-100, integer),
  "fitComment": "string (2-4 sentences in pt-BR, no personal pronouns, no em dash)",
  "strengths": ["string in pt-BR (specific match points between CV and job)"],
  "weaknesses": ["string in pt-BR (specific gaps between CV and job)"],
  "prioritizedSkills": ["string (skills from CV that most match the job, in priority order)"],
  "experiencesToHighlight": ["string (specific experiences from CV to emphasize for this job)"],
  "keywordsToIncorporate": ["string (job keywords that appear in or can be adapted from the CV)"]
}`;

const CLAUDE_SYSTEM = `You are an expert ATS resume writer. Your task: rewrite a candidate's CV to maximize compatibility with a specific job, using the provided job analysis and match report.

MANDATORY RULES:
- Return ONLY a valid JSON object, no text before or after, no markdown code blocks
- NEVER invent experiences, skills, or achievements not present in the original CV
- NEVER use personal pronouns (I, my, me, we, our, ours)
- NEVER use em dash (—) anywhere
- NEVER use AI buzzwords: AI-powered, AI-driven, revolutionary, disruptive, cutting-edge, state-of-the-art, innovative, game-changing, leverage, utilize, synergy, paradigm, holistic, robust, scalable solutions, enterprise-grade, production-ready, transformative, seamless, next-generation
- Use strong action verbs at the start of experience bullets: Engineered, Optimized, Delivered, Built, Led, Developed, Implemented, Designed, Architected, Streamlined, Reduced, Increased, Automated, Refactored, Spearheaded
- Quantify achievements when data exists in the original CV
- Integrate job keywords naturally into text
- Adapt professional summary to align with job title and requirements
- Reorder skills to prioritize those matching the job requirements

ATS SECTION ORDER: summary -> skills -> soft_skill -> experience -> education -> course -> language -> volunteer

JSON structure:
{
  "summary": "string (2-4 lines, no personal pronouns, no em dash, keywords integrated)",
  "resumeItems": [
    {
      "type": "skill | soft_skill | experience | education | course | language | volunteer",
      "content": { ... same structure as original CV items ... },
      "order_index": number
    }
  ],
  "projects": [
    {
      "id": number,
      "title": "string",
      "description": "string (adapted to highlight relevance to job)",
      "long_description": "string",
      "tags": ["string"],
      "images": [],
      "demo_link": "string",
      "github_link": "string"
    }
  ]
}`;

// ── Action ───────────────────────────────────────────────────────────────────

export const generate = action({
  args: {
    title: v.string(),
    locale: v.union(v.literal('pt-BR'), v.literal('en-US')),
    jobDescription: v.string(),
  },
  handler: async (ctx, args): Promise<{ id: string }> => {
    const enabled = await ctx.runQuery(api.plugins.checkPlugin, { pluginId: 'ai-resumes' });
    if (!enabled) throw new Error('PLUGIN_DISABLED:ai-resumes');

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

    const { userId } = await ctx.runQuery(internal.auth.requireRoleQuery, { allowedRoles: ['root'] });

    // Fetch current CV data
    const [contactInfo, resumeItems, projects, aboutContent] = await Promise.all([
      ctx.runQuery(api.contactInfo.get, {}),
      ctx.runQuery(api.resumeItems.listAll, {}),
      ctx.runQuery(api.projects.list, {}),
      ctx.runQuery(api.homeContent.getByKey, { key: 'about_text' }),
    ]);

    const summary = (() => {
      if (!aboutContent?.value) return '';
      if (typeof aboutContent.value === 'string') return aboutContent.value;
      const val = aboutContent.value as Record<string, string>;
      return args.locale === 'pt-BR'
        ? (val['pt-BR'] ?? val['ptBR'] ?? Object.values(val)[0] ?? '')
        : (val['en-US'] ?? val['enUS'] ?? val['pt-BR'] ?? val['ptBR'] ?? Object.values(val)[0] ?? '');
    })();

    const cvPayload = JSON.stringify({ contactInfo, resumeItems, projects, summary }, null, 2);

    // Etapa 1 — Gemini: analyze job description
    const geminiRaw = await callOpenRouter(
      apiKey,
      'google/gemini-3.1-pro-preview',
      GEMINI_SYSTEM,
      `Analyze this job description:\n\n${args.jobDescription}`,
      0.2,
    );
    const jobAnalysis = parseJsonResponse(geminiRaw);

    // Etapa 2 — GPT-5.4: match CV against job
    const gptRaw = await callOpenRouter(
      apiKey,
      'openai/gpt-5.4',
      GPT_SYSTEM,
      `CANDIDATE CV:\n${cvPayload}\n\nJOB ANALYSIS:\n${JSON.stringify(jobAnalysis, null, 2)}`,
      0.3,
    );
    const matchReport = parseJsonResponse(gptRaw);

    // Etapa 3 — Claude Sonnet: rewrite CV
    const claudeRaw = await callOpenRouter(
      apiKey,
      'anthropic/claude-sonnet-4-6',
      CLAUDE_SYSTEM,
      `ORIGINAL CV:\n${cvPayload}\n\nJOB ANALYSIS:\n${JSON.stringify(jobAnalysis, null, 2)}\n\nMATCH REPORT:\n${JSON.stringify(matchReport, null, 2)}\n\nLocale: ${args.locale}\n\nRewrite the CV to maximize ATS compatibility for this specific job.`,
      0.4,
    );

    // Build cvData merging contactInfo so it's available for PDF generation
    const cvDataRaw = parseJsonResponse(claudeRaw);
    const cvData = {
      ...cvDataRaw,
      contactInfo: contactInfo ?? {},
    };

    const id = await ctx.runMutation(internal.aiResumes.save, {
      title: args.title,
      locale: args.locale,
      jobDescription: args.jobDescription,
      fitScore: matchReport.fitScore ?? 0,
      fitComment: matchReport.fitComment ?? '',
      strengths: matchReport.strengths ?? [],
      weaknesses: matchReport.weaknesses ?? [],
      cvData,
      createdBy: userId,
    });

    return { id: id.toString() };
  },
});
