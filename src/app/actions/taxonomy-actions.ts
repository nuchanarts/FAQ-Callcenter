"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdmin } from "@/auth/current-admin";
import { parseOrThrow } from "@/domain/validation";
import { runAction, type ActionResult } from "@/lib/action-result";
import { taxonomyService } from "@/services";
import type { TaxonomyState } from "@/services/taxonomy-service";

/** Save categories + levels (the service re-checks the role, validates and refuses orphaning). */
export async function saveTaxonomyAction(input: {
  taxonomy: unknown;
  expectedVersion: number;
}): Promise<ActionResult<TaxonomyState>> {
  return runAction(async () => {
    const { expectedVersion } = parseOrThrow(
      z.object({ expectedVersion: z.number().int().min(0) }),
      input,
    );
    const saved = await taxonomyService().saveTaxonomy(await getAdmin(), {
      taxonomy: input.taxonomy,
      expectedVersion,
    });
    // Categories/levels appear on every page (root layout).
    revalidatePath("/", "layout");
    return saved;
  });
}
