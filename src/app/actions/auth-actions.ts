"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  signSession,
  type SessionUser,
} from "@/auth/session";
import { ForbiddenError } from "@/domain/errors";
import { getConfig } from "@/lib/config";
import { runAction, type ActionResult } from "@/lib/action-result";
import { authService } from "@/services";
import { safeNextPath } from "@/services/auth-service";

export type SignInState = ActionResult<null> | null;

const field = (form: FormData, name: string) => String(form.get(name) ?? "");

async function startSession(user: SessionUser): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, await signSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: getConfig().isProduction && process.env.INSECURE_COOKIES !== "true",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/** Email + password: local development / E2E only (disabled on the live site). */
export async function signInAction(_prev: SignInState, form: FormData): Promise<SignInState> {
  const result = await runAction(async () => {
    if (!getConfig().passwordLogin) throw new ForbiddenError();
    return authService().signIn({ email: field(form, "email"), password: field(form, "password") });
  });
  if (!result.ok) return result;
  await startSession(result.data);
  redirect(safeNextPath(field(form, "next")));
}

/** Staff sign-in with Google: only granted, active Gmail accounts get a session. */
export async function googleSignInAction(input: {
  credential: string;
  next: string;
}): Promise<SignInState> {
  const result = await runAction(() =>
    authService().signInWithGoogle(String(input?.credential ?? "").slice(0, 5000)),
  );
  if (!result.ok) return result;
  await startSession(result.data);
  redirect(safeNextPath(input.next));
}

export async function signOutAction(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/");
}
