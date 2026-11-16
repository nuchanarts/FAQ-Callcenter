import Link from "next/link";
import { ExternalLink, FileText, MessageSquareWarning, PlayCircle } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { ContentRenderer } from "@/components/features/topic/content-renderer";
import type { EffectiveTopic } from "@/domain/topics";
import { th } from "@/i18n/th";

const ATTACHMENT_ICONS = { clip: PlayCircle, manual: FileText, link: ExternalLink } as const;

export function reportHref(topicId: string): string {
  return `/report?topic=${encodeURIComponent(topicId)}`;
}

/**
 * The answer for one topic: steps, clips/manuals, and the "ยังไม่ได้" path to the report form
 * (Constitution I). Shared by the phone accordion and the wide-screen answer pane.
 */
export function TopicDetail({ topic }: { topic: EffectiveTopic }) {
  return (
    <div className="flex flex-col gap-5">
      <ContentRenderer source={topic.solution} />

      {topic.attachments.length > 0 && (
        <div>
          <p className="mb-2 font-semibold text-ink">{th.topic.attachments}</p>
          <ul className="flex flex-wrap gap-2">
            {topic.attachments.map((a, i) => {
              const Icon = ATTACHMENT_ICONS[a.kind];
              return (
                <li key={i}>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClass("secondary", "sm")}
                  >
                    <Icon aria-hidden className="size-4" />
                    {a.label}
                    <span className="sr-only"> {th.topic.opensNewTab}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-soft border border-dashed border-line-strong p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-ink-muted">{th.topic.notSolvedHint}</p>
        <Link href={reportHref(topic.id)} className={buttonClass("secondary", "md")}>
          <MessageSquareWarning aria-hidden className="size-5" />
          {th.topic.notSolved}
        </Link>
      </div>
    </div>
  );
}
