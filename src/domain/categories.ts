import { DEFAULT_TAXONOMY } from "@/domain/taxonomy";

/**
 * Categories are editable at /admin/taxonomy (see src/domain/taxonomy.ts).
 * These exports describe the built-in default set, used for seed content and fallbacks.
 */
export const CATEGORIES = DEFAULT_TAXONOMY.categories;
export type CategoryId = string;
export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

export function isDefaultCategoryId(value: unknown): value is CategoryId {
  return typeof value === "string" && CATEGORY_IDS.includes(value);
}
