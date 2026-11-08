/**
 * Slug de URL (posts e projetos): minúsculas, números, hífen e sublinhado, começando
 * por letra ou número. Vira parte da URL sem escape.
 *
 * O slug é estável: é gerado do título só na criação (quando não vem pronto) e só
 * muda quando alguém pede explicitamente. Editar o título não mexe nele (correção da
 * v1.10: trocar o título quebrava a URL de posts publicados).
 */
export const SLUG_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;
export const SLUG_MAX_LENGTH = 120;

export function isValidSlug(slug: string): boolean {
  return slug.length > 0 && slug.length <= SLUG_MAX_LENGTH && SLUG_PATTERN.test(slug);
}

export function assertValidSlug(slug: string): void {
  if (!isValidSlug(slug)) {
    throw new Error(`Slug inválido: "${slug}". Use letras minúsculas, números e hífens.`);
  }
}

/** Sugere um slug a partir de um texto: "Olá, Mundo!" → "ola-mundo". */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^[-_]+/, "")
    .replace(/-+$/, "")
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/, "");
}

/**
 * Primeiro slug livre a partir da base: `post`, `post-2`, `post-3`…
 * `isTaken` consulta o banco.
 */
export async function uniqueSlug(base: string, isTaken: (slug: string) => Promise<boolean>): Promise<string> {
  const root = slugify(base) || "item";
  if (!(await isTaken(root))) return root;
  for (let n = 2; n < 1000; n++) {
    const suffix = `-${n}`;
    const candidate = `${root.slice(0, SLUG_MAX_LENGTH - suffix.length).replace(/-+$/, "")}${suffix}`;
    if (!(await isTaken(candidate))) return candidate;
  }
  throw new Error(`Não foi possível gerar um slug livre a partir de "${base}"`);
}
