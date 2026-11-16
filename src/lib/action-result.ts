import { toActionError, type ActionError } from "@/domain/errors";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ActionError };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail<T = never>(err: unknown): ActionResult<T> {
  return { ok: false, error: toActionError(err) };
}

/** Next.js signals redirect()/notFound() by throwing errors with a NEXT_ digest. */
function isNextControlFlow(err: unknown): boolean {
  if (typeof err !== "object" || err === null || !("digest" in err)) return false;
  const digest = (err as { digest: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_");
}

/** Run a server-side operation and convert failures into an ActionResult. */
export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return ok(await fn());
  } catch (err) {
    if (isNextControlFlow(err)) throw err;
    return fail(err);
  }
}
