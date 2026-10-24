import type { Project } from "@/repositories/interfaces/PortfolioRepository";

/** Projeto com página de case própria (slug + case study). */
export function hasCaseStudy(project: Project): boolean {
  return Boolean(project.slug && project.case_study);
}

/** Categorias distintas, na ordem em que aparecem nos projetos. */
export function listCategories(projects: Project[]): string[] {
  const seen = new Set<string>();
  for (const p of projects) {
    const c = p.category?.trim();
    if (c) seen.add(c);
  }
  return Array.from(seen);
}

/** null = todas as categorias. */
export function filterByCategory(projects: Project[], category: string | null): Project[] {
  if (!category) return projects;
  return projects.filter(p => p.category?.trim() === category);
}

/** Próximo case da lista (com volta ao início), ignorando projetos sem case. */
export function nextCase(projects: Project[], currentSlug: string | undefined): Project | null {
  const cases = projects.filter(hasCaseStudy);
  const idx = cases.findIndex(p => p.slug === currentSlug);
  if (idx === -1) return cases[0] ?? null;
  if (cases.length < 2) return null;
  return cases[(idx + 1) % cases.length];
}
