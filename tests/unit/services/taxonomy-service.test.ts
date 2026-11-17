import { beforeEach, describe, expect, it } from "vitest";
import type { SessionUser } from "@/auth/session";
import { ForbiddenError, ValidationError } from "@/domain/errors";
import { DEFAULT_TAXONOMY, type Taxonomy } from "@/domain/taxonomy";
import type { BaseTopic } from "@/domain/topics";
import { createMemoryRepositories } from "@/repositories/memory";
import { createTaxonomyService, type TaxonomyService } from "@/services/taxonomy-service";
import { createTopicService } from "@/services/topic-service";

const approver: SessionUser = { id: "p", email: "p@x.y", displayName: "อนุมัติ", role: "approver" };
const author: SessionUser = { id: "w", email: "w@x.y", displayName: "เขียน", role: "author" };
const base: BaseTopic[] = [
  {
    id: "b-1",
    order: 1,
    title: "ต้นฉบับ",
    categoryId: "login",
    level: "self",
    keywords: [],
    solution: "1. ก",
    attachments: [],
  },
];

let svc: TaxonomyService;
let repos: ReturnType<typeof createMemoryRepositories>;
let n = 0;
beforeEach(() => {
  n = 0;
  repos = createMemoryRepositories({ admins: [] });
  svc = createTaxonomyService({
    taxonomy: repos.taxonomy,
    topics: repos.topics,
    base,
    newId: () => String(++n),
  });
});

const withCategory = (t: Taxonomy, name: string): Taxonomy => ({
  ...t,
  categories: [...t.categories, { id: "", name, icon: "monitor" }],
});

describe("taxonomy service", () => {
  it("starts from the built-in default", async () => {
    expect(await svc.getState()).toEqual({ taxonomy: DEFAULT_TAXONOMY, version: 0 });
  });

  it("approvers add categories (server assigns ids) and topics can then use them", async () => {
    const saved = await svc.saveTaxonomy(approver, {
      taxonomy: withCategory(DEFAULT_TAXONOMY, "ระบบเครือข่าย"),
      expectedVersion: 0,
    });
    const added = saved.taxonomy.categories.at(-1)!;
    expect(added).toEqual({ id: "cat-1", name: "ระบบเครือข่าย", icon: "monitor" });
    expect(saved.version).toBe(1);

    const topics = createTopicService({
      topics: repos.topics,
      base,
      now: () => new Date(),
      taxonomy: () => svc.getTaxonomy(),
    });
    const created = await topics.createTopic(approver, {
      title: "เน็ตหลุด",
      categoryId: "cat-1",
      level: "self",
      keywords: [],
      solution: "1. ก",
      attachments: [],
    });
    expect(created.categoryId).toBe("cat-1");
    await expect(
      topics.createTopic(approver, {
        title: "x",
        categoryId: "missing",
        level: "self",
        keywords: [],
        solution: "1. ก",
        attachments: [],
      }),
    ).rejects.toMatchObject({ fieldErrors: { categoryId: [expect.any(String)] } });
  });

  it("refuses to remove a category or level a topic still uses", async () => {
    const noLogin = {
      ...DEFAULT_TAXONOMY,
      categories: DEFAULT_TAXONOMY.categories.filter((c) => c.id !== "login"),
    };
    await expect(
      svc.saveTaxonomy(approver, { taxonomy: noLogin, expectedVersion: 0 }),
    ).rejects.toBeInstanceOf(ValidationError);
    // An unused one can go.
    const noDrug = {
      ...DEFAULT_TAXONOMY,
      categories: DEFAULT_TAXONOMY.categories.filter((c) => c.id !== "drug"),
    };
    const saved = await svc.saveTaxonomy(approver, { taxonomy: noDrug, expectedVersion: 0 });
    expect(saved.taxonomy.categories.map((c) => c.id)).not.toContain("drug");
  });

  it("requires at least one category and level, and publisher rights", async () => {
    await expect(
      svc.saveTaxonomy(approver, {
        taxonomy: { ...DEFAULT_TAXONOMY, levels: [] },
        expectedVersion: 0,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      svc.saveTaxonomy(author, { taxonomy: DEFAULT_TAXONOMY, expectedVersion: 0 }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("detects concurrent edits by version", async () => {
    await svc.saveTaxonomy(approver, { taxonomy: DEFAULT_TAXONOMY, expectedVersion: 0 });
    await expect(
      svc.saveTaxonomy(approver, { taxonomy: DEFAULT_TAXONOMY, expectedVersion: 0 }),
    ).rejects.toMatchObject({ code: "conflict" });
  });
});
