import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createContext, runInContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

/** A tiny in-memory stand-in for one Google Sheet tab (1-based rows/cols like Apps Script). */
function fakeSheet(rows: unknown[][]) {
  const data = rows.map((r) => [...r]);
  const range = (r: number, c: number, nr: number, nc: number) => {
    const self = {
      getValues: () =>
        Array.from({ length: nr }, (_, i) =>
          Array.from({ length: nc }, (_, j) => data[r - 1 + i]?.[c - 1 + j] ?? ""),
        ),
      setValues: (vals: unknown[][]) => {
        vals.forEach((row, i) => {
          data[r - 1 + i] ??= [];
          row.forEach((v, j) => (data[r - 1 + i]![c - 1 + j] = v));
        });
        return self;
      },
      setNumberFormat: () => self,
      setFontWeight: () => self,
      setBackground: () => self,
    };
    return self;
  };
  const sheet = {
    data,
    getLastRow: () => data.length,
    getMaxRows: () => Math.max(1000, data.length),
    appendRow: (row: unknown[]) => data.push([...row]),
    setFrozenRows: () => {},
    getRange: vi.fn(range),
    getDataRange: vi.fn(() => range(1, 1, data.length, Math.max(...data.map((r) => r.length)))),
  };
  return sheet;
}

function loadScript(sheet: ReturnType<typeof fakeSheet>) {
  const ctx = createContext({
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => sheet }) },
  });
  runInContext(readFileSync(join(process.cwd(), "scripts/google-sheet-webhook.gs"), "utf8"), ctx);
  return ctx as unknown as { incrementUsage: (b: Record<string, string>) => { ok: boolean } };
}

const HEADER = ["day", "kind", "topic_id", "count"];
/** Many past days of counters, then today's. */
function history(pastRows: number, today: unknown[][]) {
  const past = Array.from({ length: pastRows }, (_, i) => [
    `2026-10-${String((i % 28) + 1).padStart(2, "0")}`,
    "view",
    `t-${i}`,
    "3",
  ]);
  past.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  return [HEADER, ...past, ...today];
}

describe("Apps Script usage.increment", () => {
  it("adds one to today's row without reading the whole tab", () => {
    const sheet = fakeSheet(history(20_000, [["2026-11-18", "view", "b-1", "7"]]));
    const script = loadScript(sheet);
    expect(script.incrementUsage({ day: "2026-11-18", kind: "view", topicId: "b-1" })).toEqual({
      ok: true,
    });
    expect(sheet.data.at(-1)).toEqual(["2026-11-18", "view", "b-1", "8"]);
    expect(sheet.getDataRange).not.toHaveBeenCalled();
    const rowsRead = sheet.getRange.mock.calls.reduce((n, c) => n + (c[2] as number), 0);
    expect(rowsRead).toBeLessThan(1000);
  });

  it("appends a new row for a counter not seen today", () => {
    const sheet = fakeSheet(history(50, [["2026-11-18", "view", "b-1", "7"]]));
    loadScript(sheet).incrementUsage({ day: "2026-11-18", kind: "report", topicId: "b-1" });
    expect(sheet.data.at(-1)).toEqual(["2026-11-18", "report", "b-1", "1"]);
    expect(sheet.data.at(-2)).toEqual(["2026-11-18", "view", "b-1", "7"]);
  });

  it("treats an empty or broken count cell as 0", () => {
    const sheet = fakeSheet(history(5, [["2026-11-18", "view", "b-1", ""]]));
    loadScript(sheet).incrementUsage({ day: "2026-11-18", kind: "view", topicId: "b-1" });
    expect(sheet.data.at(-1)).toEqual(["2026-11-18", "view", "b-1", "1"]);
  });

  it("rejects unknown kinds and malformed days", () => {
    const sheet = fakeSheet(history(5, []));
    const script = loadScript(sheet);
    expect(script.incrementUsage({ day: "2026-11-18", kind: "nope", topicId: "" }).ok).toBe(false);
    expect(script.incrementUsage({ day: "yesterday", kind: "view", topicId: "" }).ok).toBe(false);
  });
});
