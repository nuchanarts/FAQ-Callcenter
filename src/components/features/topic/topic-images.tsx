import type { Attachment } from "@/domain/topic";
import { th } from "@/i18n/th";

/** Screenshots/pictures attached to a topic, shown inline with captions (click = full size). */
export function TopicImages({ images }: { images: Attachment[] }) {
  if (images.length === 0) return null;
  return (
    <div>
      <p className="mb-2 font-semibold text-ink">{th.topic.images}</p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {images.map((img) => (
          <li key={img.url}>
            <figure className="overflow-hidden rounded-soft border border-line bg-surface">
              <a
                href={img.url}
                target="_blank"
                rel="noopener noreferrer"
                title={th.topic.openImage}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- admin-uploaded images of any size, opened full size on click */}
                <img
                  src={img.url}
                  alt={img.label}
                  loading="lazy"
                  className="max-h-80 w-full bg-surface-muted object-contain"
                />
              </a>
              {img.label && (
                <figcaption className="border-t border-line px-3 py-2 text-[0.93rem] text-ink-muted">
                  {img.label}
                </figcaption>
              )}
            </figure>
          </li>
        ))}
      </ul>
    </div>
  );
}
