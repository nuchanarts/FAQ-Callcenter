"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, signSession } from "@/auth/session";
import { getConfig } from "@/lib/config";
import { runAction, type ActionResult } from "@/lib/action-result";
import { authService } from "@/services";
import { safeNextPath } from "@/services/auth-service";

export type SignInState = ActionResult<null> | null;

const field = (form: FormData, name: string) => String(form.get(name) ?? "");

/** Thin entry point: parse → service → cookie → redirect (Constitution XIV). */
export async function signInAction(_prev: SignInState, form: FormData): Promise<SignInState> {
  const result = await runAction(() =>
    authService().signIn({ email: field(form, "email"), password: field(form, "password") }),
  );
  if (!result.ok) return result;

  const store = await cookies();
  store.set(SESSION_COOKIE, await signSession(result.data), {
    httpOnly: true,
    sameSite: "lax",
    secure: getConfig().isProduction && process.env.INSECURE_COOKIES !== "true",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  redirect(safeNextPath(field(form, "next")));
}

export async function signOutAction(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/");
}
