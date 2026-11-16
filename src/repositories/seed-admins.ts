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
    displayName: "ทีมเนื้อหา",
    role: "editor",
    password: "Editor#2026",
  },
] as const;

export function demoAdminRecords(): AdminUserRecord[] {
  return DEMO_ADMINS.map(({ password, ...rest }) => ({
    ...rest,
    passwordHash: hashPasswordSync(password),
  }));
}
