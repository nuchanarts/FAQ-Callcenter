import type { Metadata } from "next";
import { requireAdmin } from "@/auth/current-admin";
import { TopicForm } from "@/components/features/admin/topic-form";
import { canPublish } from "@/domain/permissions";
import { th } from "@/i18n/th";

export const metadata: Metadata = { title: th.admin.newTopic };

export default async function NewTopicPage() {
  const admin = await requireAdmin();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">{th.admin.newTopic}</h1>
      <TopicForm canPublish={canPublish(admin)} />
    </div>
  );
}
