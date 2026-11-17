import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getManualLibrary, resetManualCacheForTests } from "@/services/manual-service";

const csv = (body: string) =>
  new Response(body, { headers: { "content-type": "text/csv; charset=utf-8" } });

const fetchMock = vi.fn();

beforeEach(() => {
  resetManualCacheForTests();
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  fetchMock.mockReset();
});

describe("getManualLibrary", () => {
  it("uses the built-in copy when no Sheet is configured", async () => {
    vi.stubEnv("MANUALS_SHEET_ID", "");
    const { library, source } = await getManualLibrary();
    expect(source).toBe("builtin");
    expect(library.videos).toHaveLength(37);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reads every tab from the Sheet and caches the result", async () => {
    vi.stubEnv("MANUALS_SHEET_ID", "SHEET");
    fetchMock.mockImplementation(async (url: string) => {
      const tab = new URL(url).searchParams.get("sheet");
      if (tab === "videos")
        return csv('"order","category","title","url"\n"1","ใหม่","คลิปใหม่","https://youtu.be/new"');
      return csv('"title","url","region"\n"x","https://x","1"');
    });
    const first = await getManualLibrary();
    expect(first.source).toBe("sheet");
    expect(first.library.videos.map((v) => v.title)).toEqual(["คลิปใหม่"]);
    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(String(fetchMock.mock.calls[0]![0])).toContain("/spreadsheets/d/SHEET/gviz/tq");

    await getManualLibrary();
    expect(fetchMock).toHaveBeenCalledTimes(5); // served from cache
  });

  it("falls back per tab when the Sheet is private (HTML login page) or down", async () => {
    vi.stubEnv("MANUALS_SHEET_ID", "SHEET");
    fetchMock.mockImplementation(async (url: string) => {
      const tab = new URL(url).searchParams.get("sheet");
      if (tab === "links") throw new Error("network");
      if (tab === "videos")
        return new Response("<html>login</html>", { headers: { "content-type": "text/html" } });
      return csv('"title","url","region"\n"x","https://x","1"');
    });
    const { library, source } = await getManualLibrary();
    expect(source).toBe("mixed");
    expect(library.videos).toHaveLength(37); // built-in
    expect(library.links).toHaveLength(3); // built-in
    expect(library.onepage.map((o) => o.title)).toEqual(["x"]); // from Sheet
  });
});
