/** Self-service level labels (Constitution I). */
export const LEVELS = ["self", "partial", "team"] as const;
export type Level = (typeof LEVELS)[number];

export function isLevel(value: unknown): value is Level {
  return typeof value === "string" && (LEVELS as readonly string[]).includes(value);
}
