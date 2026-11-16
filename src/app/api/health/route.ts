import { getRepositories } from "@/repositories";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return Response.json(
    { ok: true, backend: getRepositories().backend },
    { headers: { "Cache-Control": "no-store" } },
  );
}
