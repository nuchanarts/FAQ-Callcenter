import { z } from "zod";
import { parseOrThrow } from "@/domain/validation";
import { th } from "@/i18n/th";

export const TOPIC_LIMITS = {
  title: 150,
  keywords: 20,
  keyword: 40,
  solution: 5000,
  attachments: 10,
  attachmentLabel: 80,
  symptomCaption: 80,
  url: 2000,
} as const;

export const ATTACHMENT_KINDS = ["clip", "manual", "link", "image"] as const;
export type AttachmentKind = (typeof ATTACHMENT_KINDS)[number];

const v = th.validation;

const requiredText = (max: number) =>
  z.string({ error: v.required }).trim().min(1, v.required).max(max, v.tooLong(max));

/** Only https:// URLs are allowed anywhere in content (Constitution V). */
export function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

const attachmentSchema = z.object({
  kind: z.enum(ATTACHMENT_KINDS, { error: v.required }),
  label: requiredText(TOPIC_LIMITS.attachmentLabel),
  url: requiredText(TOPIC_LIMITS.url).refine(isHttpsUrl, v.https),
});

/** One screenshot of the problem, shown next to the question in search results. */
const symptomImageSchema = z.object({
  url: requiredText(TOPIC_LIMITS.url).refine(isHttpsUrl, v.https),
  caption: z
    .string()
    .trim()
    .max(TOPIC_LIMITS.symptomCaption, v.tooLong(TOPIC_LIMITS.symptomCaption))
    .default(""),
});

export type SymptomImage = z.output<typeof symptomImageSchema>;

function dedupeKeywords(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const k = raw.trim();
    const key = k.toLocaleLowerCase("th");
    if (k && !seen.has(key)) {
      seen.add(key);
      out.push(k);
    }
  }
  return out;
}

const keywordsSchema = z
  .array(z.string())
  .default([])
  .transform(dedupeKeywords)
  .pipe(
    z
      .array(z.string())
      .max(TOPIC_LIMITS.keywords, v.tooMany(TOPIC_LIMITS.keywords))
      .refine(
        (items) => items.every((k) => k.length <= TOPIC_LIMITS.keyword),
        v.tooLong(TOPIC_LIMITS.keyword),
      ),
  );

export const topicContentSchema = z.object({
  title: requiredText(TOPIC_LIMITS.title),
  // Checked against the current categories/levels by the topic service (they are editable).
  categoryId: z.string({ error: v.category }).trim().min(1, v.category).max(40),
  level: z.string({ error: v.level }).trim().min(1, v.level).max(40),
  keywords: keywordsSchema,
  solution: requiredText(TOPIC_LIMITS.solution),
  attachments: z
    .array(attachmentSchema)
    .max(TOPIC_LIMITS.attachments, v.tooMany(TOPIC_LIMITS.attachments))
    .default([]),
  symptomImage: symptomImageSchema.nullable().default(null),
});

/**
 * Parsed content always has `symptomImage` (null when none), but records saved before the field
 * existed (file, Supabase, Sheet, built-ins) don't — so readers treat it as optional.
 */
export type TopicContent = Omit<z.output<typeof topicContentSchema>, "symptomImage"> & {
  symptomImage?: SymptomImage | null;
};
export type TopicContentInput = z.input<typeof topicContentSchema>;
export type Attachment = TopicContent["attachments"][number];

export function parseTopicContent(input: unknown): TopicContent {
  return parseOrThrow(topicContentSchema, input);
}

/** Split a comma separated keyword string typed by an admin. */
export function parseKeywords(text: string): string[] {
  return dedupeKeywords(text.split(","));
}
