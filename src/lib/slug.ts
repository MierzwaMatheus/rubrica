export { isValidSlug } from "../../convex/lib/slug";

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
    .slice(0, 120)
    .replace(/-+$/, "");
}
