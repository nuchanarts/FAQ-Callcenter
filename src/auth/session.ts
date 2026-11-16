import { jwtVerify, SignJWT } from "jose";
import { ADMIN_ROLES, type AdminRole } from "@/domain/permissions";
import { getConfig } from "@/lib/config";

export const SESSION_COOKIE = "bgs_admin_session";
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  role: AdminRole;
}

const key = () => new TextEncoder().encode(getConfig().sessionSecret);

function isRole(value: unknown): value is AdminRole {
  return (ADMIN_ROLES as readonly unknown[]).includes(value);
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(key());
}

export async function verifySession(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    const { id, email, displayName, role } = payload;
    if (
      typeof id !== "string" ||
      typeof email !== "string" ||
      typeof displayName !== "string" ||
      !isRole(role)
    ) {
      return null;
    }
    return { id, email, displayName, role };
  } catch {
    return null;
  }
}
