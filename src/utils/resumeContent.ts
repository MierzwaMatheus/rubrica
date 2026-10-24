export interface SkillGroup<T> {
  name: string;
  items: T[];
}

/**
 * Agrupa as habilidades pelo campo `group`, mantendo a ordem em que cada grupo aparece.
 * Itens sem grupo vão para `fallback` ("Stack"), sempre no fim.
 */
export function groupSkills<T extends { translatedContent?: any; content?: any }>(
  skills: T[],
  fallback = "Stack",
): SkillGroup<T>[] {
  const groups = new Map<string, T[]>();
  const loose: T[] = [];
  for (const s of skills) {
    const raw = s.translatedContent?.group ?? s.content?.group;
    const name = typeof raw === "string" ? raw.trim() : "";
    if (!name) {
      loose.push(s);
      continue;
    }
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name)!.push(s);
  }
  const result = Array.from(groups, ([name, items]) => ({ name, items }));
  if (loose.length) result.push({ name: fallback, items: loose });
  return result;
}

/** Separa as experiências mais recentes (sempre visíveis) das anteriores (recolhidas). */
export function splitExperiences<T>(items: T[], visible = 2): { recent: T[]; older: T[] } {
  return { recent: items.slice(0, visible), older: items.slice(visible) };
}
