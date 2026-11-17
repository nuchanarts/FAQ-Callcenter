import { DEFAULT_TAXONOMY } from "@/domain/taxonomy";

/**
 * Self-service levels (Constitution I) are editable at /admin/taxonomy (src/domain/taxonomy.ts).
 * These exports describe the built-in default set.
 */
export const LEVELS = DEFAULT_TAXONOMY.levels.map((l) => l.id);
export type Level = string;
