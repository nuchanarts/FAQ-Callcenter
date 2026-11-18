import { describe, expect, it } from "vitest";
import { rankPopular, VIEW_COUNT_MIN } from "@/domain/popularity";
import type { EffectiveTopic } from "@/domain/topics";

const t = (id: string) => ({ id }) as EffectiveTopic;
const topics = [t("a"), t("b"), t("c"), t("d")];

describe("rankPopular", () => {
  it("needs at least 5 views", () => {
    expect(VIEW_COUNT_MIN).toBe(5);
    expect(rankPopular(topics, { a: 4, b: 5 }, 5).map((x) => x.id)).toEqual(["b"]);
  });
  it("orders by views, most first, and respects the limit", () => {
    expect(rankPopular(topics, { a: 5, b: 50, c: 20, d: 9 }, 3).map((x) => x.id)).toEqual([
      "b",
      "c",
      "d",
    ]);
  });
  it("ignores counts for topics that are not listed (deleted or hidden)", () => {
    expect(rankPopular(topics, { gone: 999, a: 6 }, 5).map((x) => x.id)).toEqual(["a"]);
  });
  it("keeps the original order on ties", () => {
    expect(rankPopular(topics, { c: 7, a: 7 }, 5).map((x) => x.id)).toEqual(["a", "c"]);
  });
});
