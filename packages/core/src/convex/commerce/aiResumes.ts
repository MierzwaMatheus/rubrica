/**
 * Currículo por vaga com IA (plugin `ai-resumes`, só no tipo pessoal, requer `resume`;
 * port da v1, decisão 32). Só root.
 *
 * Três etapas no OpenRouter (OPENROUTER_API_KEY): analisa a vaga, compara com o
 * currículo e reescreve o currículo para a vaga, sem inventar nada. O currículo de
 * origem sai da coleção `resume` da v2 (itens publicados), dos projetos publicados e
 * das configurações do site (pessoa, descrição).
 *
 * Os modelos podem ser trocados por variável de ambiente (OPENROUTER_RESUME_MODELS,
 * três ids separados por vírgula: análise, comparação, escrita).
 */
import { v } from "convex/values";
import { logUserAction } from "../audit";
import { requireRole } from "../auth";
import type { Role } from "../lib/roles";
import { anyText } from "../lib/text";
import { getSettingsDoc } from "../plugins";
import type { RubricaRuntime } from "../runtime";
import { action, internalMutation, internalQuery, mutation, query, ref, type Doc, type Id, type MutationCtx } from "../server";
import { guard } from "./shared";

export const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
export const DEFAULT_RESUME_MODELS = ["google/gemini-3.1-pro-preview", "openai/gpt-5.4", "anthropic/claude-sonnet-4-6"] as const;
const MAX_JOB_DESCRIPTION = 20_000;
/** Só a agência (root), como na v1. */
export const AI_RESUMES_ROLES = ["root"] as const satisfies readonly Role[];

export function resumeModels(env: Record<string, string | undefined> = process.env): [string, string, string] {
  const custom = env.OPENROUTER_RESUME_MODELS?.split(",").map((m) => m.trim()).filter(Boolean) ?? [];
  const [a, b, c] = DEFAULT_RESUME_MODELS;
  return [custom[0] ?? a, custom[1] ?? b, custom[2] ?? c];
}

async function callOpenRouter(apiKey: string, referer: string | undefined, model: string, system: string, user: string, temperature: number): Promise<string> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(referer ? { "HTTP-Referer": referer } : {}),
      "X-Title": "Rubrica: currículo por vaga",
    },
    body: JSON.stringify({ model, messages: [{ role: "system", content: system }, { role: "user", content: user }], temperature }),
  });
  if (!response.ok) throw new Error(`OpenRouter (${model}) respondeu HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data?.choices?.[0]?.message?.content?.trim() ?? "";
}

/** JSON da resposta, sem a cerca de código que alguns modelos põem. */
export function parseJsonResponse(raw: string): Record<string, unknown> {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try {
    const parsed = JSON.parse(cleaned) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
  } catch {
    // cai no erro abaixo
  }
  throw new Error("A IA devolveu uma resposta fora do formato esperado. Tente de novo.");
}

const strings = (value: unknown): string[] => (Array.isArray(value) ? value.filter((s): s is string => typeof s === "string") : []);

// ── Prompts (os da v1) ───────────────────────────────────────────────────────

const ANALYZE_SYSTEM = `You are an expert ATS (Applicant Tracking System) recruiter and job description analyst.
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

const MATCH_SYSTEM = `You are an expert technical recruiter specializing in candidate-job matching and ATS scoring.
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

const WRITE_SYSTEM = `You are an expert ATS resume writer. Your task: rewrite a candidate's CV to maximize compatibility with a specific job, using the provided job analysis and match report.

MANDATORY RULES:
- Return ONLY a valid JSON object, no text before or after, no markdown code blocks
- NEVER invent experiences, skills, or achievements not present in the original CV
- NEVER use personal pronouns (I, my, me, we, our, ours)
- NEVER use em dash (—) anywhere
- NEVER use AI buzzwords: AI-powered, AI-driven, revolutionary, disruptive, cutting-edge, state-of-the-art, innovative, game-changing, leverage, utilize, synergy, paradigm, holistic, robust, scalable solutions, enterprise-grade, production-ready, transformative, seamless, next-generation
- Use strong action verbs at the start of experience bullets
- Quantify achievements when data exists in the original CV
- Integrate job keywords naturally into text
- Adapt the professional summary to align with the job title and requirements
- Reorder skills to prioritize those matching the job requirements
- Write every text in the requested locale

ATS SECTION ORDER: summary -> skill -> experience -> education -> certification -> language

JSON structure:
{
  "summary": "string (2-4 lines, no personal pronouns, no em dash, keywords integrated)",
  "resumeItems": [
    {
      "kind": "experience | education | skill | certification | language",
      "title": "string",
      "organization": "string (optional)",
      "location": "string (optional)",
      "start": "string (optional, as in the original)",
      "end": "string (optional, as in the original)",
      "description": "string (optional)"
    }
  ],
  "projects": [
    { "title": "string", "summary": "string (adapted to highlight relevance to the job)", "tags": ["string"] }
  ]
}`;

// ── Currículo de origem ──────────────────────────────────────────────────────

/** Texto traduzível no idioma pedido (senão no principal). */
const text = (value: Record<string, string> | undefined, locale: string, fallback?: string) => anyText(value, locale) || anyText(value, fallback) || undefined;

export interface CvSource {
  person: { name?: string; jobTitle?: string; email?: string } | null;
  summary?: string;
  resumeItems: Array<{ kind: string; title?: string; organization?: string; location?: string; start?: string; end?: string; description?: string }>;
  projects: Array<{ title?: string; summary?: string; tags?: string[]; year?: number; client?: string }>;
}

const live = (doc: { published: boolean; deletedAt?: number }) => doc.published && doc.deletedAt === undefined;
const byOrder = (a: { order?: number }, b: { order?: number }) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);

export function aiResumesFunctions(rt: RubricaRuntime) {
  const target = (doc: Doc<"aiResumes">) => ({ type: "ai_resume", id: doc._id, label: doc.title });
  const refs = {
    access: ref<"query", { roles: Role[]; plugins: string[] }, { userId: Id<"users">; role: string }>("query", "commerce", "access"),
    cvSource: ref<"query", { locale: string }, { cv: CvSource; siteUrl: string | undefined }>("query", "aiResumes", "cvSource"),
    save: ref<"mutation", Record<string, unknown>, Id<"aiResumes">>("mutation", "aiResumes", "save"),
  };

  async function load(ctx: MutationCtx, id: Id<"aiResumes">) {
    const doc = await ctx.db.get(id);
    if (!doc) throw new Error("Currículo não encontrado");
    return doc;
  }

  return {
    list: query({
      args: { includeDeleted: v.optional(v.boolean()) },
      handler: async (ctx, args) => {
        await guard(ctx, rt, AI_RESUMES_ROLES, "ai-resumes");
        const all = await ctx.db.query("aiResumes").withIndex("by_createdAt").order("desc").collect();
        return args.includeDeleted ? all : all.filter((r) => r.deletedAt === undefined);
      },
    }),

    get: query({
      args: { id: v.id("aiResumes") },
      handler: async (ctx, args) => {
        await guard(ctx, rt, AI_RESUMES_ROLES, "ai-resumes");
        return ctx.db.get(args.id);
      },
    }),

    /** Gera um currículo para a vaga. Leva alguns minutos (três chamadas à IA). */
    generate: action({
      args: { title: v.string(), locale: v.string(), jobDescription: v.string() },
      handler: async (ctx, args): Promise<{ id: Id<"aiResumes"> }> => {
        const { userId } = await ctx.runQuery(refs.access, { roles: [...AI_RESUMES_ROLES], plugins: ["ai-resumes"] });
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) throw new Error("Currículo com IA não configurado: defina OPENROUTER_API_KEY nas variáveis do Convex.");
        const jobDescription = args.jobDescription.trim();
        if (!args.title.trim()) throw new Error("Dê um título ao currículo (ex.: a vaga e a empresa).");
        if (!jobDescription) throw new Error("Cole a descrição da vaga.");
        if (jobDescription.length > MAX_JOB_DESCRIPTION) throw new Error(`A descrição da vaga passa de ${MAX_JOB_DESCRIPTION} caracteres.`);

        const { cv, siteUrl } = await ctx.runQuery(refs.cvSource, { locale: args.locale });
        const cvPayload = JSON.stringify(cv, null, 2);
        const [analyzeModel, matchModel, writeModel] = resumeModels();

        const jobAnalysis = parseJsonResponse(await callOpenRouter(apiKey, siteUrl, analyzeModel, ANALYZE_SYSTEM, `Analyze this job description:\n\n${jobDescription}`, 0.2));
        const matchReport = parseJsonResponse(
          await callOpenRouter(apiKey, siteUrl, matchModel, MATCH_SYSTEM, `CANDIDATE CV:\n${cvPayload}\n\nJOB ANALYSIS:\n${JSON.stringify(jobAnalysis, null, 2)}`, 0.3),
        );
        const rewritten = parseJsonResponse(
          await callOpenRouter(
            apiKey,
            siteUrl,
            writeModel,
            WRITE_SYSTEM,
            `ORIGINAL CV:\n${cvPayload}\n\nJOB ANALYSIS:\n${JSON.stringify(jobAnalysis, null, 2)}\n\nMATCH REPORT:\n${JSON.stringify(matchReport, null, 2)}\n\nLocale: ${args.locale}\n\nRewrite the CV to maximize ATS compatibility for this specific job.`,
            0.4,
          ),
        );

        const fitScore = typeof matchReport.fitScore === "number" ? Math.max(0, Math.min(100, Math.round(matchReport.fitScore))) : 0;
        const id = await ctx.runMutation(refs.save, {
          title: args.title.trim(),
          locale: args.locale,
          jobDescription,
          fitScore,
          fitComment: typeof matchReport.fitComment === "string" ? matchReport.fitComment : "",
          strengths: strings(matchReport.strengths),
          weaknesses: strings(matchReport.weaknesses),
          // A pessoa vai junto para o PDF.
          cvData: { ...rewritten, person: cv.person },
          createdBy: userId,
        });
        return { id };
      },
    }),

    remove: mutation({
      args: { id: v.id("aiResumes") },
      handler: async (ctx, args) => {
        const { userId } = await guard(ctx, rt, AI_RESUMES_ROLES, "ai-resumes");
        const doc = await load(ctx, args.id);
        await ctx.db.patch(args.id, { deletedAt: Date.now(), deletedBy: userId });
        await logUserAction(ctx, userId, "admin.delete", target(doc), { softDelete: true });
        return null;
      },
    }),

    restore: mutation({
      args: { id: v.id("aiResumes") },
      handler: async (ctx, args) => {
        const { userId } = await requireRole(ctx, "purge");
        const doc = await load(ctx, args.id);
        await ctx.db.patch(args.id, { deletedAt: undefined, deletedBy: undefined });
        await logUserAction(ctx, userId, "admin.restore", target(doc));
        return null;
      },
    }),

    removePermanently: mutation({
      args: { id: v.id("aiResumes") },
      handler: async (ctx, args) => {
        const { userId } = await requireRole(ctx, "purge");
        const doc = await load(ctx, args.id);
        await ctx.db.delete(args.id);
        await logUserAction(ctx, userId, "admin.permanent_delete", target(doc));
        return null;
      },
    }),

    // ── Internas ───────────────────────────────────────────────────────────

    /** Currículo de origem, no idioma pedido: itens publicados da coleção `resume`, projetos publicados e a pessoa. */
    cvSource: internalQuery({
      args: { locale: v.string() },
      handler: async (ctx, { locale }): Promise<{ cv: CvSource; siteUrl: string | undefined }> => {
        const settings = await getSettingsDoc(ctx);
        const fallback = settings?.locales.default;
        const items = (await ctx.db.query("resumeItems").withIndex("by_order").collect()).filter(live).sort(byOrder);
        const projects = (await ctx.db.query("projects").withIndex("by_order").collect()).filter(live).sort(byOrder);
        const person = settings?.person;
        return {
          siteUrl: process.env.SITE_URL || settings?.url || undefined,
          cv: {
            person: person ? { name: person.name, jobTitle: text(person.jobTitle, locale, fallback), email: person.email } : null,
            summary: text(settings?.description, locale, fallback),
            resumeItems: items.map((item) => ({
              kind: item.kind,
              title: text(item.title, locale, fallback),
              organization: item.organization,
              location: text(item.location, locale, fallback),
              start: item.start,
              end: item.end,
              description: text(item.description, locale, fallback),
            })),
            projects: projects.map((p) => ({ title: text(p.title, locale, fallback), summary: text(p.summary, locale, fallback), tags: p.tags, year: p.year, client: p.client })),
          },
        };
      },
    }),

    save: internalMutation({
      args: {
        title: v.string(),
        locale: v.string(),
        jobDescription: v.string(),
        fitScore: v.number(),
        fitComment: v.string(),
        strengths: v.array(v.string()),
        weaknesses: v.array(v.string()),
        cvData: v.any(),
        createdBy: v.id("users"),
      },
      handler: async (ctx, args) => {
        const id = await ctx.db.insert("aiResumes", { ...args, createdAt: Date.now() });
        await logUserAction(ctx, args.createdBy, "admin.create", { type: "ai_resume", id, label: args.title }, { fitScore: args.fitScore });
        return id;
      },
    }),
  };
}
