import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/auth/current-admin";
import { TopicForm } from "@/components/features/admin/topic-form";
import { NotFoundError } from "@/domain/errors";
import { th } from "@/i18n/th";
import { topicService } from "@/services";

export const metadata: Metadata = { title: th.admin.editTopic };

export default async function EditTopicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const topic = await topicService()
    .getForAdmin(await requireAdmin(), decodeURIComponent(id))
    .catch((err: unknown) => {
      if (err instanceof NotFoundError) notFound();
      throw err;
    });
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">{th.admin.editTopic}</h1>
      <TopicForm key={`${topic.id}-${topic.version}`} topic={topic} />
    </div>
  );
}
