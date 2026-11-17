import { z } from "zod";
import { th } from "@/i18n/th";

/**
 * Editable classification of topics: categories (หมวด) and levels (ระดับ).
 * The built-in set below is the default; approvers/owners can add, rename, reorder and remove
 * entries at /admin/taxonomy. Entries used by any topic cannot be removed.
 */

/** Icons an admin can pick for a category (rendered by CategoryIcon). */
export const CATEGORY_ICONS = [
  "log-in",
  "id-card",
  "upload",
  "printer",
  "pill",
  "stethoscope",
  "wallet",
  "clipboard-list",
  "monitor",
  "wifi",
  "database",
  "settings",
  "file-text",
  "calendar",
  "users",
  "syringe",
  "receipt",
  "circle-help",
] as const;
export type CategoryIconName = (typeof CATEGORY_ICONS)[number];

/** Colors (badge tones) an admin can pick for a level. */
export const LEVEL_TONES = ["self", "partial", "team", "neutral", "danger"] as const;
export type LevelTone = (typeof LEVEL_TONES)[number];

/** Icons an admin can pick for a level (rendered by LevelBadge). */
export const LEVEL_ICONS = [
  "circle-check",
  "circle-dashed",
  "headset",
  "triangle-alert",
  "info",
  "wrench",
] as const;
export type LevelIconName = (typeof LEVEL_ICONS)[number];

export interface CategoryDef {
  id: string;
  name: string;
  icon: CategoryIconName;
}

export interface LevelDef {
  id: string;
  name: string;
  tone: LevelTone;
  icon: LevelIconName;
}

export interface Taxonomy {
  categories: CategoryDef[];
  levels: LevelDef[];
}

export const DEFAULT_TAXONOMY: Taxonomy = {
  categories: [
    { id: "login", name: "เข้าสู่ระบบ / EHP Agent", icon: "log-in" },
    { id: "authen", name: "ตรวจสอบสิทธิ / Authen Code", icon: "id-card" },
    { id: "claim", name: "ส่งเคลม / ส่งออกข้อมูล", icon: "upload" },
    { id: "print", name: "การพิมพ์ / เครื่องพิมพ์", icon: "printer" },
    { id: "drug", name: "ยา / คลังเวชภัณฑ์", icon: "pill" },
    { id: "service", name: "บันทึกการให้บริการ", icon: "stethoscope" },
    { id: "finance", name: "การเงิน / ค่าบริการ", icon: "wallet" },
    { id: "registry", name: "ทะเบียนผู้ป่วย / แบบฟอร์ม", icon: "clipboard-list" },
  ],
  levels: [
    { id: "self", name: "ทำเองได้", tone: "self", icon: "circle-check" },
    { id: "partial", name: "ทำเองได้บางส่วน", tone: "partial", icon: "circle-dashed" },
    { id: "team", name: "ต้องแจ้งทีม", tone: "team", icon: "headset" },
  ],
};

export const TAXONOMY_LIMITS = { name: 60, entries: 40, id: 40 } as const;

const v = th.validation;
const id = z.string().trim().max(TAXONOMY_LIMITS.id); // "" = new entry (server assigns an id)
const name = z
  .string()
  .trim()
  .min(1, v.required)
  .max(TAXONOMY_LIMITS.name, v.tooLong(TAXONOMY_LIMITS.name));

export const taxonomySchema = z.object({
  categories: z
    .array(z.object({ id, name, icon: z.enum(CATEGORY_ICONS) }))
    .min(1, th.taxonomy.needOne)
    .max(TAXONOMY_LIMITS.entries, v.tooMany(TAXONOMY_LIMITS.entries)),
  levels: z
    .array(z.object({ id, name, tone: z.enum(LEVEL_TONES), icon: z.enum(LEVEL_ICONS) }))
    .min(1, th.taxonomy.needOne)
    .max(TAXONOMY_LIMITS.entries, v.tooMany(TAXONOMY_LIMITS.entries)),
});

export type TaxonomyInput = z.input<typeof taxonomySchema>;

export function categoryName(t: Taxonomy, categoryId: string): string {
  return t.categories.find((c) => c.id === categoryId)?.name ?? categoryId;
}

export function findCategory(t: Taxonomy, categoryId: string): CategoryDef | undefined {
  return t.categories.find((c) => c.id === categoryId);
}

/** Unknown levels (e.g. removed while a draft referenced it) render as a neutral badge. */
export function findLevel(t: Taxonomy, levelId: string): LevelDef {
  return (
    t.levels.find((l) => l.id === levelId) ?? {
      id: levelId,
      name: levelId,
      tone: "neutral",
      icon: "info",
    }
  );
}
