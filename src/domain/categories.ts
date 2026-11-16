/**
 * The 8 fixed categories (Constitution, "หมวดหลัก").
 * Changing this list requires a constitution amendment.
 */
export const CATEGORIES = [
  { id: "login", name: "เข้าสู่ระบบ / EHP Agent", icon: "log-in" },
  { id: "authen", name: "ตรวจสอบสิทธิ / Authen Code", icon: "id-card" },
  { id: "claim", name: "ส่งเคลม / ส่งออกข้อมูล", icon: "upload" },
  { id: "print", name: "การพิมพ์ / เครื่องพิมพ์", icon: "printer" },
  { id: "drug", name: "ยา / คลังเวชภัณฑ์", icon: "pill" },
  { id: "service", name: "บันทึกการให้บริการ", icon: "stethoscope" },
  { id: "finance", name: "การเงิน / ค่าบริการ", icon: "wallet" },
  { id: "registry", name: "ทะเบียนผู้ป่วย / แบบฟอร์ม", icon: "clipboard-list" },
] as const;

export type Category = (typeof CATEGORIES)[number];
export type CategoryId = Category["id"];
export type CategoryIcon = Category["icon"];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as [CategoryId, ...CategoryId[]];

export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === "string" && (CATEGORY_IDS as readonly string[]).includes(value);
}

export function categoryName(id: CategoryId): string {
  return CATEGORIES.find((c) => c.id === id)?.name ?? id;
}
