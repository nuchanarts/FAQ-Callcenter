import { z } from "zod";
import { categoryName } from "@/domain/taxonomy";
import { parseReport, validateReport, type ReportInput } from "@/domain/report";
import { statsService, taxonomyService, topicService } from "@/services";
import { appendSheetRow } from "@/services/sheet-log";

export const dynamic = "force-dynamic";

const MAX_BODY = 16_000;

const topicId = z.string().min(1).max(100);
const viewSchema = z.object({ kind: z.literal("view"), topicId });
const helpfulSchema = z.object({ kind: z.literal("helpful"), topicId });
const unhelpfulSchema = z.object({ kind: z.literal("unhelpful"), topicId });
const visitSchema = z.object({ kind: z.literal("visit") });
const reportSchema = z.object({
  kind: z.literal("report"),
  channel: z.enum(["line", "copy"]),
  report: z.record(z.string(), z.string()),
  /** The topic the caller opened before reporting (/report?topic=…), when any. */
  topicId: topicId.optional(),
});
const bodySchema = z.discriminatedUnion("kind", [
  viewSchema,
  helpfulSchema,
  unhelpfulSchema,
  visitSchema,
  reportSchema,
]);

/**
 * Usage logging → Google Sheet (topic views, submitted reports) and the usage counters
 * (views, reports, helpful votes, visits).
 * Validates everything server-side; the Sheet secret never reaches the browser.
 * Always answers 202/400 quickly — logging is best-effort and never blocks the user.
 */
export async function POST(request: Request): Promise<Response> {
  // Same-origin only: browsers always send Origin on cross-site POSTs (incl. sendBeacon).
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return new Response(null, { status: 403 });

  const text = await request.text();
  if (text.length > MAX_BODY) return new Response(null, { status: 413 });

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(JSON.parse(text));
  } catch {
    return new Response(null, { status: 400 });
  }

  if (parsed.kind === "visit") {
    await statsService().record("visit");
    return new Response(null, { status: 202 });
  }

  if (parsed.kind === "helpful" || parsed.kind === "unhelpful") {
    const topic = await topicService().findPublicTopic(parsed.topicId);
    if (!topic) return new Response(null, { status: 400 });
    await statsService().record(parsed.kind, topic.id);
    return new Response(null, { status: 202 });
  }

  if (parsed.kind === "view") {
    // Only real, visible topics are logged (no free-text junk in the Sheet).
    const topic = await topicService().findPublicTopic(parsed.topicId);
    if (!topic) return new Response(null, { status: 400 });
    await statsService().record("view", topic.id);
    const taxonomy = await taxonomyService().getTaxonomy();
    await appendSheetRow("view", [topic.id, topic.title, categoryName(taxonomy, topic.categoryId)]);
    return new Response(null, { status: 202 });
  }

  const input = parsed.report as ReportInput;
  if (Object.keys(validateReport(input)).length > 0) return new Response(null, { status: 400 });
  const r = parseReport(input);
  // An unknown or hidden topic never rejects a report: it just counts without a topic.
  const topic = parsed.topicId ? await topicService().findPublicTopic(parsed.topicId) : null;
  await statsService().record("report", topic?.id ?? "");
  await appendSheetRow(
    "report",
    [
      parsed.channel === "line" ? "LINE" : "คัดลอก",
      r.fullName,
      r.position,
      r.unitCode,
      r.unitName,
      r.phone,
      r.email ?? "",
      r.anydesk ?? "",
      r.details,
    ],
    [topic?.title ?? ""],
  );
  return new Response(null, { status: 202 });
}
