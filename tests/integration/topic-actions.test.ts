import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieJar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined),
    set: (name: string, value: string) => cookieJar.set(name, value),
    delete: (name: string) => cookieJar.delete(name),
  }),
}));

const { signSession, SESSION_COOKIE } = await import("@/auth/session");
const { resetRepositoriesForTests } = await import("@/repositories");
const actions = await import("@/app/actions/topic-actions");

const content = {
  title: "หัวข้อจากแอดมิน",
  categoryId: "drug",
  level: "self",
  keywords: [],
  solution: "1. ทำ",
  attachments: [],
};

async function signInAsAdmin() {
  cookieJar.set(
    SESSION_COOKIE,
    await signSession({
      id: "a-owner",
      email: "admin@bgs.local",
      displayName: "ผู้ดูแลระบบ",
      role: "owner",
    }),
  );
}

beforeEach(() => {
  cookieJar.clear();
  resetRepositoriesForTests();
});

describe("topic server actions", () => {
  it("refuse every call without an admin session (SC-005)", async () => {
    const results = await Promise.all([
      actions.createTopicAction(content),
      actions.saveTopicAction({ id: "b-login-blank", expectedVersion: 0, content }),
      actions.setTopicHiddenAction({ id: "b-login-blank", hidden: true, expectedVersion: 0 }),
      actions.restoreTopicAction({ id: "b-login-blank", expectedVersion: 0 }),
      actions.deleteTopicAction({ id: "c-1", expectedVersion: 1 }),
    ]);
    for (const r of results)
      expect(r).toMatchObject({ ok: false, error: { code: "unauthorized" } });
  });

  it("refuse a tampered session", async () => {
    cookieJar.set(SESSION_COOKIE, "not-a-real-token");
    expect(await actions.createTopicAction(content)).toMatchObject({
      ok: false,
      error: { code: "unauthorized" },
    });
  });

  it("create, save, hide, restore and delete as admin", async () => {
    await signInAsAdmin();
    const created = await actions.createTopicAction(content);
    expect(created).toMatchObject({ ok: true, data: { status: "custom", version: 1 } });
    const id = created.ok ? created.data.id : "";

    const saved = await actions.saveTopicAction({
      id,
      expectedVersion: 1,
      content: { ...content, title: "แก้" },
    });
    expect(saved).toMatchObject({ ok: true, data: { title: "แก้", version: 2 } });

    const edited = await actions.saveTopicAction({
      id: "b-login-blank",
      expectedVersion: 0,
      content,
    });
    expect(edited).toMatchObject({ ok: true, data: { status: "edited" } });
    expect(
      await actions.restoreTopicAction({ id: "b-login-blank", expectedVersion: 1 }),
    ).toMatchObject({
      ok: true,
      data: { status: "original" },
    });
    expect(
      await actions.setTopicHiddenAction({ id, hidden: true, expectedVersion: 2 }),
    ).toMatchObject({
      ok: true,
      data: { hidden: true },
    });
    expect(await actions.deleteTopicAction({ id, expectedVersion: 3 })).toEqual({
      ok: true,
      data: { id },
    });
  });

  it("return field errors, conflict and not_deletable codes", async () => {
    await signInAsAdmin();
    const invalid = await actions.createTopicAction({
      ...content,
      title: "",
      attachments: [{ kind: "link", label: "x", url: "http://x" }],
    });
    expect(invalid).toMatchObject({
      ok: false,
      error: {
        code: "validation",
        fieldErrors: { title: expect.any(Array), "attachments.0.url": expect.any(Array) },
      },
    });
    await actions.saveTopicAction({ id: "b-login-blank", expectedVersion: 0, content });
    expect(
      await actions.saveTopicAction({ id: "b-login-blank", expectedVersion: 0, content }),
    ).toMatchObject({
      ok: false,
      error: { code: "conflict", message: "มีคนแก้ไขหัวข้อนี้ไปแล้ว กรุณาโหลดใหม่" },
    });
    expect(
      await actions.deleteTopicAction({ id: "b-login-blank", expectedVersion: 0 }),
    ).toMatchObject({
      ok: false,
      error: { code: "not_deletable" },
    });
  });

  it("reject malformed arguments", async () => {
    await signInAsAdmin();
    expect(await actions.setTopicHiddenAction({ id: 5, hidden: "yes" } as never)).toMatchObject({
      ok: false,
      error: { code: "validation" },
    });
  });
});
