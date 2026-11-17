import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/auth/current-admin";
import { DraftReviewPanel } from "@/components/features/admin/draft-review-panel";
import { TopicForm } from "@/components/features/admin/topic-form";
import { NotFoundError } from "@/domain/errors";
import { canPublish } from "@/domain/permissions";
import { th } from "@/i18n/th";
import { topicService } from "@/services";

export const metadata: Metadata = { title: th.admin.editTopic };

export default async function EditTopicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireAdmin();
  const topic = await topicService()
    .getForAdmin(admin, decodeURIComponent(id))
    .catch((err: unknown) => {
      if (err instanceof NotFoundError) notFound();
      throw err;
    });
  const publisher = canPublish(admin);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">{th.admin.editTopic}</h1>
      <DraftReviewPanel key={`r-${topic.version}`} topic={topic} canPublish={publisher} />
      <TopicForm key={`${topic.id}-${topic.version}`} topic={topic} canPublish={publisher} />
    </div>
  );
}
