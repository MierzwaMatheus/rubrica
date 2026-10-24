export interface WorkPrinciple {
  title: string;
  description: string;
  titleTranslations?: { ptBR?: string; enUS?: string };
  descriptionTranslations?: { ptBR?: string; enUS?: string };
}

const localeKey = (locale: string) => (locale === "en-US" ? "enUS" : "ptBR");

/** Valida o valor cru de `work_principles` (vem do banco como `any`) e descarta itens sem título. */
export function parseWorkPrinciples(raw: unknown): WorkPrinciple[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((p): p is WorkPrinciple => !!p && typeof p === "object" && typeof (p as any).title === "string")
    .filter(p => p.title.trim().length > 0)
    .map(p => ({ ...p, description: typeof p.description === "string" ? p.description : "" }));
}

/** Texto do princípio no idioma pedido, caindo para o português e depois para o texto base. */
export function localizePrinciple(p: WorkPrinciple, locale: string): { title: string; description: string } {
  const k = localeKey(locale);
  return {
    title: p.titleTranslations?.[k] || p.titleTranslations?.ptBR || p.title,
    description: p.descriptionTranslations?.[k] || p.descriptionTranslations?.ptBR || p.description,
  };
}

/** Separa o texto em parágrafos (linha em branco entre eles). */
export function splitParagraphs(text: string): string[] {
  return text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
}

/** Move o item `index` uma posição para cima (-1) ou para baixo (+1). Fora dos limites, devolve a lista igual. */
export function moveItem<T>(list: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (index < 0 || index >= list.length || target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/** Monta o valor salvo em `work_principles`: o texto base é o português; itens sem título saem. */
export function buildWorkPrinciplesValue(
  rows: Array<{ titlePT: string; descriptionPT: string; titleEN: string; descriptionEN: string }>,
): WorkPrinciple[] {
  return rows
    .filter(r => r.titlePT.trim())
    .map(r => ({
      title: r.titlePT.trim(),
      description: r.descriptionPT.trim(),
      titleTranslations: { ptBR: r.titlePT.trim(), ...(r.titleEN.trim() ? { enUS: r.titleEN.trim() } : {}) },
      descriptionTranslations: {
        ptBR: r.descriptionPT.trim(),
        ...(r.descriptionEN.trim() ? { enUS: r.descriptionEN.trim() } : {}),
      },
    }));
}
