import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getAdmin } from "@/auth/current-admin";
import { GoogleSignIn } from "@/components/features/admin/google-sign-in";
import { LoginForm } from "@/components/features/admin/login-form";
import { SiteHeader } from "@/components/features/layout/site-header";
import { th } from "@/i18n/th";
import { getConfig } from "@/lib/config";
import { safeNextPath } from "@/services/auth-service";

export const metadata: Metadata = { title: th.auth.title };

interface LoginPageProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  const nextPath = safeNextPath(typeof next === "string" ? next : undefined);
  if (await getAdmin()) redirect(nextPath);
  const { googleClientId, passwordLogin } = getConfig();
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12">
        <header>
          <h1 className="text-3xl font-bold">{th.auth.title}</h1>
          <p className="mt-2 text-ink-muted">{th.auth.subtitle}</p>
        </header>
        <div className="flex flex-col gap-4 rounded-soft border border-line bg-surface p-6 shadow-raise">
          <div className="flex items-start gap-3">
            <ShieldCheck aria-hidden className="mt-0.5 size-6 shrink-0 text-herb" />
            <div>
              <p className="font-semibold">{th.auth.googleTitle}</p>
              <p className="text-[0.95rem] text-ink-muted">{th.auth.googleHint}</p>
            </div>
          </div>
          {googleClientId ? (
            <GoogleSignIn clientId={googleClientId} next={nextPath} />
          ) : (
            <p
              role="status"
              className="rounded-soft bg-level-partial-soft px-4 py-3 text-level-partial"
            >
              {th.auth.googleNotConfigured}
            </p>
          )}
        </div>
        {passwordLogin && (
          <details className="rounded-soft border border-dashed border-line-strong bg-surface p-4">
            <summary className="cursor-pointer text-[0.95rem] font-semibold text-ink-muted">
              {th.auth.devOnly}
            </summary>
            <div className="mt-4">
              <LoginForm next={nextPath} />
            </div>
          </details>
        )}
      </main>
    </>
  );
}
