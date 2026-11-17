import "server-only";

/**
 * Appends rows to the Google Sheet through its Apps Script web app
 * (scripts/google-sheet-webhook.gs). Logging must never break the app:
 * when SHEET_WEBHOOK_URL / SHEET_WEBHOOK_SECRET are unset it is a no-op,
 * and network or script errors are reported as `false`, never thrown.
 */
export type SheetKind = "report" | "view";

const TIMEOUT_MS = 8000;

/** Spreadsheet formula-injection guard: a leading = + - @ tab or CR is kept as plain text. */
export function neutralizeFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

export function sheetLogEnabled(): boolean {
  return Boolean(process.env.SHEET_WEBHOOK_URL && process.env.SHEET_WEBHOOK_SECRET);
}

export async function appendSheetRow(kind: SheetKind, row: string[]): Promise<boolean> {
  const url = process.env.SHEET_WEBHOOK_URL;
  const secret = process.env.SHEET_WEBHOOK_SECRET;
  if (!url || !secret) return false;
  try {
    // Apps Script answers with a 302 to googleusercontent.com; fetch follows it.
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ secret, kind, row: row.map(neutralizeFormula) }),
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(`[sheet-log] ${kind}: HTTP ${res.status}`);
      return false;
    }
    const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    if (!data?.ok) {
      console.error(`[sheet-log] ${kind}: ${data?.error ?? "unexpected response"}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[sheet-log] ${kind}:`, err instanceof Error ? err.message : err);
    return false;
  }
}
