import { findUnit, UNIT_CODE } from "@/services/unit-directory";

/** Unit lookup for the report form: 5-digit code → name, tambon/amphoe/province. */
export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  if (!UNIT_CODE.test(code)) return Response.json({ error: "invalid" }, { status: 400 });
  const unit = findUnit(code);
  if (!unit) return Response.json({ error: "not_found" }, { status: 404 });
  // The registry changes rarely: let browsers/CDN cache answers for a day.
  return Response.json(unit, { headers: { "Cache-Control": "public, max-age=86400" } });
}
