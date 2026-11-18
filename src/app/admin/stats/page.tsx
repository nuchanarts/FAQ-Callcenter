import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/auth/current-admin";
import { buttonClass } from "@/components/ui/button";
import { StatsView } from "@/components/features/admin/stats-table";
import { STATS_RANGES, type StatsRange } from "@/domain/usage";
import { th } from "@/i18n/th";
import { statsService, taxonomyService, topicService } from "@/services";

export const metadata: Metadata = { title: th.stats.admin.title };

interface StatsPageProps {
  searchParams: Promise<{ range?: string | string[] }>;
}

/** Usage statistics for every staff role (read-only). */
export default async function StatsPage({ searchParams }: StatsPageProps) {
  const admin = await requireAdmin();
  const { range: requested } = await searchParams;
  const range: StatsRange = STATS_RANGES.find((r) => r === requested) ?? "30d";
  const [stats, topics, taxonomy] = await Promise.all([
    statsService().getAdminStats(range),
    topicService().listForAdmin(admin),
    taxonomyService().getTaxonomy(),
  ]);
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{th.stats.admin.title}</h1>
          <p className="mt-1 text-ink-muted">{th.stats.admin.subtitle}</p>
        </div>
        <Link href="/admin" className={buttonClass("ghost", "md")}>
          <ArrowLeft aria-hidden className="size-5" />
          {th.admin.title}
        </Link>
      </header>
      <StatsView stats={stats} topics={topics} taxonomy={taxonomy} range={range} />
    </div>
  );
}
