import { hashPasswordSync } from "@/auth/password";
import type { AdminUserRecord } from "@/repositories/types";

/** Demo admin accounts for local use and E2E only (research R13). */
export const DEMO_ADMINS = [
  {
    id: "a-owner",
    email: "admin@bgs.local",
    displayName: "ผู้ดูแลระบบ",
    role: "owner",
    password: "Admin#2026",
  },
  {
    id: "a-editor",
    email: "editor@bgs.local",
    displayName: "ผู้อนุมัติเนื้อหา",
    role: "approver",
    password: "Editor#2026",
  },
  {
    id: "a-author",
    email: "author@bgs.local",
    displayName: "ผู้เขียนเนื้อหา",
    role: "author",
    password: "Author#2026",
  },
] as const;

export function demoAdminRecords(): AdminUserRecord[] {
  return DEMO_ADMINS.map(({ password, ...rest }) => ({
    ...rest,
    passwordHash: hashPasswordSync(password),
    active: true,
  }));
}
