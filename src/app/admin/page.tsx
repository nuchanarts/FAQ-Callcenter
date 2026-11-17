import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Tags, UsersRound } from "lucide-react";
import { requireAdmin } from "@/auth/current-admin";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { TopicTable } from "@/components/features/admin/topic-table";
import { canManageUsers, canPublish } from "@/domain/permissions";
import { th } from "@/i18n/th";
import { topicService } from "@/services";

export const metadata: Metadata = { title: th.admin.title };

export default async function AdminPage() {
  const admin = await requireAdmin();
  const topics = await topicService().listForAdmin(admin);
  const pending = topics.filter((t) => t.draft?.status === "pending").length;
  const publisher = canPublish(admin);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold">{th.admin.title}</h1>
            <Badge tone="herb">{th.roles[admin.role]}</Badge>
          </div>
          <p className="mt-1 text-ink-muted">
            {publisher ? th.admin.subtitle : th.admin.review.authorNotice}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {publisher && (
            <Link href="/admin/taxonomy" className={buttonClass("secondary", "md")}>
              <Tags aria-hidden className="size-5" />
              {th.taxonomy.nav}
            </Link>
          )}
          {canManageUsers(admin) && (
            <Link href="/admin/users" className={buttonClass("secondary", "md")}>
              <UsersRound aria-hidden className="size-5" />
              {th.users.title}
            </Link>
          )}
          <Link href="/admin/topics/new" className={buttonClass("primary", "md")}>
            <Plus aria-hidden className="size-5" />
            {th.admin.newTopic}
          </Link>
        </div>
      </header>
      {pending > 0 && (
        <p
          role="status"
          className="rounded-soft border border-level-partial/30 bg-level-partial-soft px-4 py-3 font-semibold text-level-partial"
        >
          {th.admin.review.pendingCount(pending)}
          {publisher && ` — ${th.admin.review.showPending}: เลือกสถานะ “${th.admin.status.pending}”`}
        </p>
      )}
      <TopicTable topics={topics} canPublish={publisher} />
    </div>
  );
}
