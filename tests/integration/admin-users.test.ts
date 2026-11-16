import { describe, expect, it } from "vitest";
import { createMemoryRepositories } from "@/repositories/memory";

describe("admin user repository", () => {
  it("finds admins by email case-insensitively", async () => {
    const repo = createMemoryRepositories({
      admins: [
        { id: "1", email: "admin@bgs.local", displayName: "A", role: "owner", passwordHash: "h" },
      ],
    }).admins;
    expect((await repo.findByEmail(" ADMIN@bgs.local "))?.id).toBe("1");
    expect(await repo.findByEmail("x@y.z")).toBeNull();
  });
});
