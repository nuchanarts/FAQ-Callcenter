import type { Metadata } from "next";
import { TopicForm } from "@/components/features/admin/topic-form";
import { th } from "@/i18n/th";

export const metadata: Metadata = { title: th.admin.newTopic };

export default function NewTopicPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">{th.admin.newTopic}</h1>
      <TopicForm />
    </div>
  );
}
