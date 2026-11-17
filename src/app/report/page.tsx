import type { Metadata } from "next";
import { ClipboardPen, Copy, Heart, MessageCircle, type LucideIcon } from "lucide-react";
import { ReportForm } from "@/components/features/report/report-form";
import { SiteHeader } from "@/components/features/layout/site-header";
import { SlaCard } from "@/components/features/report/sla-card";
import { SupportArt } from "@/components/features/report/support-art";
import { th } from "@/i18n/th";
import { topicService } from "@/services";

export const metadata: Metadata = { title: th.nav.report };
export const dynamic = "force-dynamic";

const FLOW_ICONS: LucideIcon[] = [ClipboardPen, Copy, MessageCircle];

interface ReportPageProps {
  searchParams: Promise<{ topic?: string | string[] }>;
}

export default async function ReportPage({ searchParams }: ReportPageProps) {
  const { topic } = await searchParams;
  const topicId = typeof topic === "string" ? topic : undefined;
  // Works without a database too: findPublicTopic falls back to built-in topics.
  const found = topicId ? await topicService().findPublicTopic(topicId) : null;

  return (
    <>
      <SiteHeader />
      <section className="hero-bg overflow-hidden border-b-4 border-hero-edge text-hero-ink">
        <div className="page-width grid items-center gap-6 pt-8 pb-16 lg:grid-cols-[minmax(0,1fr)_20rem] lg:pb-14 2xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="flex min-w-0 flex-col gap-4">
            <p className="flex items-center gap-2 font-semibold text-hero-ink/90">
              <Heart aria-hidden className="size-5 fill-current text-art-3" />
              {th.report.greeting}
            </p>
            <div>
              <h1 className="text-3xl font-bold sm:text-4xl">{th.report.title}</h1>
              <p className="mt-2 max-w-2xl text-hero-ink/85">{th.report.subtitle}</p>
            </div>
            <ol className="flex flex-wrap items-center gap-2">
              {th.report.flow.map((label, i) => {
                const Icon = FLOW_ICONS[i]!;
                return (
                  <li key={label} className="flex items-center gap-2">
                    <span className="flex items-center gap-2 rounded-pill bg-surface py-1.5 pr-4 pl-1.5 font-semibold text-ink shadow-raise">
                      <span className="flex size-7 items-center justify-center rounded-full bg-herb text-[0.85rem] text-on-herb">
                        {i + 1}
                      </span>
                      <Icon aria-hidden className="size-4 text-herb" />
                      {label}
                    </span>
                    {i < th.report.flow.length - 1 && (
                      <span aria-hidden className="text-xl text-hero-ink/70">
                        →
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
            <div className="max-w-4xl">
              <SlaCard />
            </div>
          </div>
          <SupportArt className="hidden w-full lg:block" />
        </div>
      </section>
      <main id="main" className="page-width py-10 sm:py-12">
        <ReportForm key={found?.id ?? "none"} topicTitle={found?.title} />
      </main>
    </>
  );
}
