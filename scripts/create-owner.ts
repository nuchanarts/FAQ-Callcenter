/**
 * Grant the first owner (a Gmail address) in the Google Sheet backend (DATA_BACKEND=sheets),
 * so they can "Sign in with Google" and add everyone else from /admin/users.
 *
 * Usage (reads SHEET_WEBHOOK_URL / SHEET_WEBHOOK_SECRET from .env.local):
 *   npm run create-owner -- <gmail> "<display name>"
 */
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

function env(name: string): string {
  if (process.env[name]) return process.env[name]!;
  try {
    const line = readFileSync(".env.local", "utf8")
      .split(/\r?\n/)
      .find((l) => l.startsWith(`${name}=`));
    if (line) return line.slice(name.length + 1).trim();
  } catch {
    // no .env.local
  }
  return "";
}

const [email, displayName] = process.argv.slice(2);
if (!email || !email.includes("@") || !displayName) {
  console.error('Usage: npm run create-owner -- <gmail> "<display name>"');
  process.exit(1);
}
const url = env("SHEET_WEBHOOK_URL");
const secret = env("SHEET_WEBHOOK_SECRET");
if (!url || !secret) {
  console.error("Set SHEET_WEBHOOK_URL and SHEET_WEBHOOK_SECRET (in .env.local) first.");
  process.exit(1);
}

async function call(action: string, payload: Record<string, unknown> = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ secret, action, ...payload }),
    redirect: "follow",
  });
  const reply = (await res.json()) as { ok: boolean; data?: unknown; error?: string };
  if (!reply.ok) throw new Error(reply.error ?? `${action} failed`);
  return reply.data;
}

const key = email.trim().toLowerCase();
const existing = ((await call("admins.list")) as { id: string; email: string }[]).find(
  (a) => a.email === key,
);
await call("admins.upsert", {
  row: {
    id: existing?.id ?? `u-${randomUUID()}`,
    email: key,
    display_name: displayName,
    role: "owner",
    password_hash: "",
    active: "true",
  },
});
console.log(`${existing ? "Updated" : "Granted"} owner ${key}. Sign in with Google at /login.`);
