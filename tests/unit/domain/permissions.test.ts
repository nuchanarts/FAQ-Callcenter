import { describe, expect, it } from "vitest";
import { assertAdmin, canManageContent } from "@/domain/permissions";
import { ForbiddenError, UnauthorizedError } from "@/domain/errors";

describe("permissions", () => {
  it("owner and editor can manage content", () => {
    expect(canManageContent({ role: "owner" })).toBe(true);
    expect(canManageContent({ role: "editor" })).toBe(true);
  });
  it("anonymous cannot", () => {
    expect(canManageContent(null)).toBe(false);
  });
  it("assertAdmin throws Unauthorized without a user and Forbidden for unknown roles", () => {
    expect(() => assertAdmin(null)).toThrow(UnauthorizedError);
    expect(() => assertAdmin({ role: "viewer" as never })).toThrow(ForbiddenError);
    expect(assertAdmin({ role: "owner", id: "1" })).toEqual({ role: "owner", id: "1" });
  });
});
