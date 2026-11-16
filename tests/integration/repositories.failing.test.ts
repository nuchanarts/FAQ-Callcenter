import { describe, expect, it } from "vitest";
import { createFailingRepositories } from "@/repositories/failing";

describe("failing adapter", () => {
  it("rejects every topic call", async () => {
    const { topics } = createFailingRepositories({ admins: [] });
    await expect(topics.list()).rejects.toThrow(/unavailable/);
    await expect(topics.get("x")).rejects.toThrow();
  });
});
