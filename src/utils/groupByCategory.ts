export interface CategoryGroup<T> {
  /** undefined = sem categoria */
  category?: string;
  items: T[];
}

/**
 * Agrupa por `category` na ordem em que cada categoria aparece primeiro.
 * Itens sem categoria vão para um grupo no final.
 */
export function groupByCategory<T extends { category?: string | null }>(items: T[]): CategoryGroup<T>[] {
  const groups = new Map<string, T[]>();
  const uncategorized: T[] = [];
  for (const item of items) {
    const key = item.category?.trim();
    if (!key) {
      uncategorized.push(item);
      continue;
    }
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  const result: CategoryGroup<T>[] = Array.from(groups.entries(), ([category, list]) => ({ category, items: list }));
  if (uncategorized.length) result.push({ items: uncategorized });
  return result;
}
