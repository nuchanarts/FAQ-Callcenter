import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/auth/current-admin";
import { buttonClass } from "@/components/ui/button";
import { TaxonomyEditor } from "@/components/features/admin/taxonomy-editor";
import { canPublish } from "@/domain/permissions";
import { th } from "@/i18n/th";
import { taxonomyService } from "@/services";

export const metadata: Metadata = { title: th.taxonomy.title };

export default async function TaxonomyPage() {
  const admin = await requireAdmin();
  if (!canPublish(admin)) notFound();
  const state = await taxonomyService().getForAdmin(admin);
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{th.taxonomy.title}</h1>
          <p className="mt-1 text-ink-muted">{th.taxonomy.subtitle}</p>
        </div>
        <Link href="/admin" className={buttonClass("ghost", "md")}>
          <ArrowLeft aria-hidden className="size-5" />
          {th.admin.title}
        </Link>
      </header>
      <TaxonomyEditor key={state.version} initial={state} />
    </div>
  );
}
