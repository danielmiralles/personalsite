/**
 * URL-safe slug from any tag string.
 * - lowercases
 * - strips diacritics ("píldora" → "pildora")
 * - collapses non-alphanumeric runs to a single hyphen
 * - trims hyphens from the edges
 */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
