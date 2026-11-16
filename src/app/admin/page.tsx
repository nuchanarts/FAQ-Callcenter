import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/auth/current-admin";
import { buttonClass } from "@/components/ui/button";
import { TopicTable } from "@/components/features/admin/topic-table";
import { th } from "@/i18n/th";
import { topicService } from "@/services";

export const metadata: Metadata = { title: th.admin.title };

export default async function AdminPage() {
  const topics = await topicService().listForAdmin(await requireAdmin());
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{th.admin.title}</h1>
          <p className="mt-1 text-ink-muted">{th.admin.subtitle}</p>
        </div>
        <Link href="/admin/topics/new" className={buttonClass("primary", "md")}>
          <Plus aria-hidden className="size-5" />
          {th.admin.newTopic}
        </Link>
      </header>
      <TopicTable topics={topics} />
    </div>
  );
}
