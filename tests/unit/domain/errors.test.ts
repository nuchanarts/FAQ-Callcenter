import { describe, expect, it } from "vitest";
import {
  ConflictError,
  ForbiddenError,
  NotDeletableError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  toActionError,
} from "@/domain/errors";
import { fail, ok, runAction } from "@/lib/action-result";

describe("domain errors", () => {
  it.each([
    [new ValidationError("bad", { title: ["required"] }), "validation"],
    [new NotFoundError("x"), "not_found"],
    [new ConflictError(), "conflict"],
    [new ForbiddenError(), "forbidden"],
    [new UnauthorizedError(), "unauthorized"],
    [new NotDeletableError(), "not_deletable"],
  ])("maps %o to code %s", (err, code) => {
    expect(toActionError(err).code).toBe(code);
  });

  it("keeps field errors for validation errors", () => {
    const e = toActionError(new ValidationError("bad", { title: ["required"] }));
    expect(e.fieldErrors).toEqual({ title: ["required"] });
  });

  it("maps unknown errors to unexpected without leaking details", () => {
    const e = toActionError(new Error("db password is hunter2"));
    expect(e.code).toBe("unexpected");
    expect(e.message).not.toContain("hunter2");
  });
});

describe("action-result", () => {
  it("builds ok and fail results", () => {
    expect(ok(1)).toEqual({ ok: true, data: 1 });
    expect(fail(new ConflictError())).toMatchObject({ ok: false, error: { code: "conflict" } });
  });

  it("runAction wraps success and thrown errors", async () => {
    await expect(runAction(async () => 5)).resolves.toEqual({ ok: true, data: 5 });
    await expect(
      runAction(async () => {
        throw new ForbiddenError();
      }),
    ).resolves.toMatchObject({ ok: false, error: { code: "forbidden" } });
  });

  it("runAction rethrows Next.js control-flow errors (redirect)", async () => {
    const redirectErr = Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;replace;/;307;",
    });
    await expect(
      runAction(async () => {
        throw redirectErr;
      }),
    ).rejects.toBe(redirectErr);
  });
});
