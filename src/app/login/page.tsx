import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdmin } from "@/auth/current-admin";
import { LoginForm } from "@/components/features/admin/login-form";
import { SiteHeader } from "@/components/features/layout/site-header";
import { th } from "@/i18n/th";
import { safeNextPath } from "@/services/auth-service";

export const metadata: Metadata = { title: th.auth.title };

interface LoginPageProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  const nextPath = safeNextPath(typeof next === "string" ? next : undefined);
  if (await getAdmin()) redirect(nextPath);
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12">
        <header>
          <h1 className="text-3xl font-bold">{th.auth.title}</h1>
          <p className="mt-2 text-ink-muted">{th.auth.subtitle}</p>
        </header>
        <div className="rounded-soft border border-line bg-surface p-6 shadow-raise">
          <LoginForm next={nextPath} />
        </div>
      </main>
    </>
  );
}
