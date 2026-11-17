import { describe, expect, it } from "vitest";
import { getRepositories, resetRepositoriesForTests } from "@/repositories";

describe("repository factory", () => {
  it("uses the configured backend (memory in tests) and seeds demo admins", async () => {
    resetRepositoriesForTests();
    const repos = getRepositories();
    expect(repos.backend).toBe("memory");
    expect(getRepositories()).toBe(repos);
    expect(await repos.admins.findByEmail("admin@bgs.local")).toMatchObject({ role: "owner" });
    expect(await repos.admins.findByEmail("editor@bgs.local")).toMatchObject({ role: "approver" });
    expect(await repos.admins.findByEmail("author@bgs.local")).toMatchObject({ role: "author" });
  });
});
