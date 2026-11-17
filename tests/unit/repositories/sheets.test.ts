import { describe, expect, it, vi } from "vitest";
import { ConflictError } from "@/domain/errors";
import type { StoredTopic } from "@/domain/topics";
import { createSheetsRepositories, toStored, toTopicRow } from "@/repositories/sheets";

const topic: StoredTopic = {
  id: "c-1",
  origin: "custom",
  content: null,
  hidden: false,
  version: 1,
  createdAt: "2026-11-17T00:00:00.000Z",
  updatedAt: "2026-11-17T00:00:00.000Z",
  updatedBy: "=ผู้เขียน",
  draft: {
    content: {
      title: "ร่าง",
      categoryId: "login",
      level: "self",
      keywords: [],
      solution: "1. ก",
      attachments: [],
    },
    by: "ผู้เขียน",
    at: "2026-11-17T00:00:00.000Z",
    status: "pending",
    note: null,
  },
};

function script(handler: (body: Record<string, unknown>) => unknown) {
  const fetch = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) =>
    Response.json(handler(JSON.parse(String(init?.body)))),
  );
  return fetch;
}

describe("sheets repository", () => {
  it("round-trips a topic (JSON content/draft, strings for numbers/booleans)", () => {
    expect(toStored(toTopicRow(topic))).toEqual(topic);
  });

  it("sends the secret and action, and caches reads", async () => {
    let t = 0;
    const fetch = script((b) => ({
      ok: true,
      data: b.action === "topics.list" ? [toTopicRow(topic)] : [],
    }));
    const repo = createSheetsRepositories({
      url: "https://script",
      secret: "S",
      fetch,
      now: () => t,
    });
    expect(await repo.topics.list()).toEqual([topic]);
    expect(JSON.parse(String(fetch.mock.calls[0]![1]!.body))).toEqual({
      secret: "S",
      action: "topics.list",
    });
    await repo.topics.get("c-1");
    expect(fetch).toHaveBeenCalledTimes(1);
    t = 60_000; // past the cache window
    await repo.topics.list();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("maps the script's version conflict to ConflictError", async () => {
    const fetch = script(() => ({ ok: false, conflict: true }));
    const repo = createSheetsRepositories({ url: "https://script", secret: "S", fetch });
    await expect(repo.topics.upsert(topic, 1)).rejects.toBeInstanceOf(ConflictError);
  });

  it("surfaces script errors (e.g. wrong secret) as failures", async () => {
    const fetch = script(() => ({ ok: false, error: "unauthorized" }));
    const repo = createSheetsRepositories({ url: "https://script", secret: "bad", fetch });
    await expect(repo.admins.list()).rejects.toThrow(/unauthorized/);
  });

  it("reads admin accounts, lower-casing email and mapping legacy roles", async () => {
    const fetch = script(() => ({
      ok: true,
      data: [
        {
          id: "1",
          email: "Admin@X.y",
          display_name: "A",
          role: "editor",
          password_hash: "scrypt$a$b",
          active: "false",
        },
      ],
    }));
    const repo = createSheetsRepositories({ url: "https://script", secret: "S", fetch });
    expect(await repo.admins.findByEmail("admin@x.y")).toEqual({
      id: "1",
      email: "admin@x.y",
      displayName: "A",
      role: "approver",
      passwordHash: "scrypt$a$b",
      active: false,
    });
  });
});
