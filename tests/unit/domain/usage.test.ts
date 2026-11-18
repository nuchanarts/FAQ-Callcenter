import { describe, expect, it } from "vitest";
import { bangkokDay, sinceDay, USAGE_KINDS } from "@/domain/usage";

describe("usage domain", () => {
  it("bangkokDay uses Thai time (UTC+7)", () => {
    expect(bangkokDay(new Date("2026-11-17T18:30:00Z"))).toBe("2026-11-18");
    expect(bangkokDay(new Date("2026-11-17T16:59:00Z"))).toBe("2026-11-17");
  });
  it("sinceDay: 7d covers today and the 6 days before", () => {
    expect(sinceDay("7d", "2026-11-18")).toBe("2026-11-12");
    expect(sinceDay("30d", "2026-11-18")).toBe("2026-10-20");
    expect(sinceDay("7d", "2026-03-02")).toBe("2026-02-24");
  });
  it("sinceDay: all has no lower bound", () => {
    expect(sinceDay("all", "2026-11-18")).toBeNull();
  });
  it("knows the five kinds", () => {
    expect(USAGE_KINDS).toEqual(["view", "report", "visit", "helpful", "unhelpful"]);
  });
});
