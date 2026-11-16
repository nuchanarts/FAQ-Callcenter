import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  EyeOff,
  ListOrdered,
  MessageSquareWarning,
  Pencil,
  PlusCircle,
  Search,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { getAdmin } from "@/auth/current-admin";
import { buttonClass } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { GuideSteps } from "@/components/features/guide/guide-steps";
import { SiteHeader } from "@/components/features/layout/site-header";
import { LevelBadge } from "@/components/features/topic/level-badge";
import { LEVELS } from "@/domain/levels";
import { th } from "@/i18n/th";

export const metadata: Metadata = { title: th.guide.title };
export const dynamic = "force-dynamic";

const g = th.guide;

export default async function GuidePage() {
  const isAdmin = !!(await getAdmin());
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold sm:text-4xl">{g.title}</h1>
          <p className="mt-2 text-ink-muted">{g.subtitle}</p>
        </header>

        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="flex flex-col gap-10">
            <section aria-labelledby="viewer-guide" className="flex flex-col gap-4">
              <h2 id="viewer-guide" className="text-2xl font-semibold">
                {g.viewerTitle}
              </h2>
              <GuideSteps
                steps={g.viewerSteps}
                icons={[Sparkles, Search, BadgeCheck, ListOrdered, MessageSquareWarning]}
              />
            </section>

            {isAdmin && (
              <section aria-labelledby="admin-guide" className="flex flex-col gap-4">
                <h2 id="admin-guide" className="text-2xl font-semibold">
                  {g.adminTitle}
                </h2>
                <GuideSteps
                  steps={g.adminSteps}
                  icons={[Pencil, EyeOff, PlusCircle, ShieldAlert]}
                />
              </section>
            )}
          </div>

          <aside className="flex flex-col gap-6 lg:sticky lg:top-24">
            <div className="flex flex-wrap gap-2 rounded-soft bg-surface-muted p-4">
              {LEVELS.map((l) => (
                <LevelBadge key={l} level={l} />
              ))}
            </div>

            <section aria-labelledby="shortcuts" className="flex flex-col gap-3">
              <h2 id="shortcuts" className="text-2xl font-semibold">
                {g.shortcutsTitle}
              </h2>
              <table className="w-full overflow-hidden rounded-soft border border-line bg-surface text-left">
                <tbody>
                  {g.shortcuts.map((s) => (
                    <tr key={s.action} className="border-b border-line last:border-b-0">
                      <td className="w-32 px-4 py-3">
                        <span className="flex gap-1">
                          {s.keys.map((k) => (
                            <Kbd key={k}>{k}</Kbd>
                          ))}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{s.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <Link href="/" className={`${buttonClass("primary", "lg")} w-full`}>
              <Search aria-hidden className="size-5" />
              {g.cta}
            </Link>
          </aside>
        </div>
      </main>
    </>
  );
}
