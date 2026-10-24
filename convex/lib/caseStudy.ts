import { v } from 'convex/values';

/**
 * Case study de um projeto. Um só validador para o schema e para create/update.
 * role/context/decisions/learnings são opcionais para não quebrar projetos antigos.
 */
export const caseStudyValidator = v.object({
  problem: v.string(),
  solution: v.string(),
  results: v.string(),
  role: v.optional(v.string()),       // meu papel: cargo, time, escopo
  context: v.optional(v.string()),    // antes: o estado inicial, medido
  decisions: v.optional(v.string()),  // decisões, trade-offs e caminhos descartados
  learnings: v.optional(v.string()),  // o que aprendi
  metrics: v.array(v.object({ label: v.string(), value: v.string(), icon: v.optional(v.string()) })),
  testimonial: v.optional(v.object({ text: v.string(), author: v.string(), role: v.optional(v.string()) })),
});

const caseStudyText = v.object({
  problem: v.string(),
  solution: v.string(),
  results: v.string(),
  role: v.optional(v.string()),
  context: v.optional(v.string()),
  decisions: v.optional(v.string()),
  learnings: v.optional(v.string()),
});

export const caseStudyTranslationsValidator = v.object({
  ptBR: v.optional(caseStudyText),
  enUS: v.optional(caseStudyText),
});

/** Categoria livre do projeto ("IA aplicada", "Marca e design"), usada nos filtros do portfólio. */
export const categoryTranslationsValidator = v.object({ ptBR: v.string(), enUS: v.optional(v.string()) });
