import { describe, expect, it } from "vitest";
import {
  assertAdmin,
  assertCanManageUsers,
  assertCanPublish,
  canManageContent,
  canManageUsers,
  canPublish,
  toRole,
} from "@/domain/permissions";
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

describe("3-level roles", () => {
  it("maps the legacy editor role to approver", () => {
    expect(toRole("editor")).toBe("approver");
    expect(toRole("author")).toBe("author");
    expect(toRole("viewer")).toBeNull();
  });
  it("only owners and approvers publish; only owners manage users", () => {
    expect([canPublish({ role: "owner" }), canPublish({ role: "approver" })]).toEqual([true, true]);
    expect(canPublish({ role: "author" })).toBe(false);
    expect(canManageUsers({ role: "owner" })).toBe(true);
    expect(canManageUsers({ role: "approver" })).toBe(false);
    expect(() => assertCanPublish({ role: "author" })).toThrow(ForbiddenError);
    expect(() => assertCanManageUsers({ role: "editor" })).toThrow(ForbiddenError);
  });
});
