import type { Metadata } from "next";
import { ReportForm } from "@/components/features/report/report-form";
import { SiteHeader } from "@/components/features/layout/site-header";
import { th } from "@/i18n/th";
import { topicService } from "@/services";

export const metadata: Metadata = { title: th.nav.report };
export const dynamic = "force-dynamic";

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
      <main id="main" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <header className="mb-8 max-w-2xl">
          <h1 className="text-3xl font-bold sm:text-4xl">{th.report.title}</h1>
          <p className="mt-2 text-ink-muted">{th.report.subtitle}</p>
        </header>
        <ReportForm key={found?.id ?? "none"} topicTitle={found?.title} />
      </main>
    </>
  );
}
