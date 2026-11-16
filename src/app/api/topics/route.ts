import { topicService } from "@/services";

export const dynamic = "force-dynamic";

/** Public, read-only list of visible topics (contracts §1). Never 5xx: falls back to built-ins. */
export async function GET(): Promise<Response> {
  const result = await topicService().getPublicTopics();
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
