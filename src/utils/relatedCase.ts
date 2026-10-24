import type { Project } from "@/repositories/interfaces/PortfolioRepository";

/** Primeiro projeto com página de case que divide pelo menos uma tag com o post (sem diferenciar maiúsculas). */
export function findRelatedCase(postTags: string[] | undefined, projects: Project[]): Project | undefined {
  const tags = new Set((postTags ?? []).map(t => t.trim().toLowerCase()).filter(Boolean));
  if (tags.size === 0) return undefined;
  return projects.find(
    p => p.slug && p.case_study && p.tags?.some(t => tags.has(t.trim().toLowerCase())),
  );
}
