import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/log/route";
import { getRepositories, resetRepositoriesForTests } from "@/repositories";
import { BASE_TOPICS } from "@/content/base-topics";

const fetchMock = vi.fn();

beforeEach(() => {
  resetRepositoriesForTests();
  vi.stubEnv("SHEET_WEBHOOK_URL", "https://script.example/exec");
  vi.stubEnv("SHEET_WEBHOOK_SECRET", "s3cret");
  fetchMock.mockResolvedValue(Response.json({ ok: true }));
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

const post = (body: unknown) =>
  POST(new Request("http://localhost/api/log", { method: "POST", body: JSON.stringify(body) }));

const sentPayload = () => JSON.parse(fetchMock.mock.calls[0]![1].body as string);

const validReport = {
  fullName: "สมใจ ใจดี",
  position: "พยาบาล",
  unitCode: "03562",
  unitName: "รพ.สต.ตัวอย่าง",
  phone: "0812345678",
  email: "",
  anydesk: "123456789",
  details: "เครื่องไม่ตอบสนอง",
};

describe("POST /api/log", () => {
  it("logs a view of a real topic with its title and category", async () => {
    const topic = BASE_TOPICS[0]!;
    const res = await post({ kind: "view", topicId: topic.id });
    expect(res.status).toBe(202);
    const payload = sentPayload();
    expect(payload).toMatchObject({ secret: "s3cret", kind: "view" });
    expect(payload.row.slice(0, 2)).toEqual([topic.id, topic.title]);
  });

  it("rejects unknown topics without calling the Sheet", async () => {
    expect((await post({ kind: "view", topicId: "nope" })).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("logs a valid report with its channel", async () => {
    const res = await post({ kind: "report", channel: "line", report: validReport });
    expect(res.status).toBe(202);
    expect(sentPayload().row).toEqual([
      "LINE",
      "สมใจ ใจดี",
      "พยาบาล",
      "03562",
      "รพ.สต.ตัวอย่าง",
      "0812345678",
      "",
      "123456789",
      "เครื่องไม่ตอบสนอง",
    ]);
  });

  it("rejects invalid reports and malformed bodies", async () => {
    expect(
      (await post({ kind: "report", channel: "copy", report: { ...validReport, unitCode: "1" } }))
        .status,
    ).toBe(400);
    expect((await post({ kind: "nope" })).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("stores formula-looking input as plain text", async () => {
    await post({
      kind: "report",
      channel: "copy",
      report: { ...validReport, details: '=HYPERLINK("http://evil","x")' },
    });
    expect(sentPayload().row.at(-1)).toBe(`'=HYPERLINK("http://evil","x")`);
  });

  it("rejects cross-site posts", async () => {
    const res = await POST(
      new Request("http://localhost/api/log", {
        method: "POST",
        headers: { origin: "https://evil.example" },
        body: JSON.stringify({ kind: "view", topicId: "x" }),
      }),
    );
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("is a silent no-op when the Sheet is not configured", async () => {
    vi.stubEnv("SHEET_WEBHOOK_URL", "");
    const res = await post({ kind: "report", channel: "copy", report: validReport });
    expect(res.status).toBe(202);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never fails the request when the Sheet is down", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await post({ kind: "report", channel: "copy", report: validReport });
    expect(res.status).toBe(202);
  });

  describe("usage counters", () => {
    const counts = () => getRepositories().stats.list(null);
    const sheetUnset = () => vi.stubEnv("SHEET_WEBHOOK_URL", "");

    it("view increments the counter for that topic", async () => {
      sheetUnset();
      const topic = BASE_TOPICS[0]!;
      await post({ kind: "view", topicId: topic.id });
      expect(await counts()).toMatchObject([{ kind: "view", topicId: topic.id, count: 1 }]);
    });

    it("visit increments visit with an empty topicId and never calls the Sheet", async () => {
      const res = await post({ kind: "visit" });
      expect(res.status).toBe(202);
      expect(await counts()).toMatchObject([{ kind: "visit", topicId: "", count: 1 }]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("helpful / unhelpful count for real topics only, without the Sheet", async () => {
      const topic = BASE_TOPICS[0]!;
      expect((await post({ kind: "helpful", topicId: topic.id })).status).toBe(202);
      expect((await post({ kind: "unhelpful", topicId: topic.id })).status).toBe(202);
      expect((await post({ kind: "helpful", topicId: "nope" })).status).toBe(400);
      expect((await counts()).map((r) => r.kind).sort()).toEqual(["helpful", "unhelpful"]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("report from a real topic counts for that topic and sends its title to the Sheet", async () => {
      const topic = BASE_TOPICS[0]!;
      await post({ kind: "report", channel: "copy", report: validReport, topicId: topic.id });
      expect(await counts()).toMatchObject([{ kind: "report", topicId: topic.id, count: 1 }]);
      expect(sentPayload().tail).toEqual([topic.title]);
    });

    it("report with an unknown topicId still logs and counts without a topic", async () => {
      const res = await post({
        kind: "report",
        channel: "copy",
        report: validReport,
        topicId: "nope",
      });
      expect(res.status).toBe(202);
      expect(await counts()).toMatchObject([{ kind: "report", topicId: "", count: 1 }]);
      expect(sentPayload().tail).toEqual([""]);
    });

    it("stats failure never breaks logging", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      vi.spyOn(getRepositories().stats, "increment").mockRejectedValue(new Error("down"));
      const res = await post({ kind: "report", channel: "copy", report: validReport });
      expect(res.status).toBe(202);
      expect(fetchMock).toHaveBeenCalled();
    });
  });
});
