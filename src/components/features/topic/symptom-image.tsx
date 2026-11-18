/* eslint-disable @next/next/no-img-element -- admin-uploaded images of any size (Vercel Blob), opened full size on click */
import type { SymptomImage as SymptomImageValue } from "@/domain/topic";
import { th } from "@/i18n/th";

/** Small screenshot beside a topic's title in the list, so callers recognise their screen. */
export function SymptomThumb({ image }: { image: SymptomImageValue }) {
  return (
    <img
      src={image.url}
      alt=""
      loading="lazy"
      className="mt-0.5 h-12 w-16 shrink-0 rounded-[0.4rem] border border-line bg-surface-muted object-cover"
    />
  );
}

/** "หน้าจอที่พบ": the full screenshot above the solution (click = full size in a new tab). */
export function SymptomImage({ image, title }: { image: SymptomImageValue; title: string }) {
  return (
    <figure className="overflow-hidden rounded-soft border border-line bg-surface">
      <p className="border-b border-line px-3 py-2 font-semibold text-ink">
        {th.topic.symptomHeading}
      </p>
      <a href={image.url} target="_blank" rel="noopener noreferrer" title={th.topic.openImage}>
        <img
          src={image.url}
          alt={image.caption || title}
          loading="lazy"
          className="max-h-80 w-full bg-surface-muted object-contain"
        />
      </a>
      {image.caption && (
        <figcaption className="border-t border-line px-3 py-2 text-[0.93rem] text-ink-muted">
          {image.caption}
        </figcaption>
      )}
    </figure>
  );
}
