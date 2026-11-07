/**
 * Slug de URL (posts do blog): minúsculas, números, hífen e sublinhado, começando por
 * letra ou número. Vira pasta na pré-renderização e parte da URL sem escape.
 */
export const SLUG_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;

export function isValidSlug(slug: string): boolean {
  return slug.length > 0 && slug.length <= 120 && SLUG_PATTERN.test(slug);
}

export function assertValidSlug(slug: string): void {
  if (!isValidSlug(slug)) {
    throw new Error("Invalid slug: use lowercase letters, numbers and hyphens");
  }
}
