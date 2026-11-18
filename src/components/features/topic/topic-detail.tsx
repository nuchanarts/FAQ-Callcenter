import { ExternalLink, FileText, PlayCircle } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { HelpfulFeedback } from "@/components/features/topic/helpful-feedback";
import { ContentRenderer } from "@/components/features/topic/content-renderer";
import { SymptomImage } from "@/components/features/topic/symptom-image";
import { TopicImages } from "@/components/features/topic/topic-images";
import type { EffectiveTopic } from "@/domain/topics";
import { th } from "@/i18n/th";

const ATTACHMENT_ICONS = { clip: PlayCircle, manual: FileText, link: ExternalLink } as const;
type LinkKind = keyof typeof ATTACHMENT_ICONS;

export { reportHref } from "@/components/features/topic/helpful-feedback";

/**
 * The answer for one topic: steps, clips/manuals, and the "ยังไม่ได้" path to the report form
 * (Constitution I). Shared by the phone accordion and the wide-screen answer pane.
 */
export function TopicDetail({ topic }: { topic: EffectiveTopic }) {
  const images = topic.attachments.filter((a) => a.kind === "image");
  const links = topic.attachments.filter((a) => a.kind !== "image");
  return (
    <div className="flex flex-col gap-5">
      {topic.symptomImage && <SymptomImage image={topic.symptomImage} title={topic.title} />}
      <ContentRenderer source={topic.solution} />

      <TopicImages images={images} />

      {links.length > 0 && (
        <div>
          <p className="mb-2 font-semibold text-ink">{th.topic.attachments}</p>
          <ul className="flex flex-wrap gap-2">
            {links.map((a, i) => {
              const Icon = ATTACHMENT_ICONS[a.kind as LinkKind];
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

      <HelpfulFeedback topicId={topic.id} />
    </div>
  );
}
