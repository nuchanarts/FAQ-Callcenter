import { describe, expect, it } from "vitest";
import { BASE_MANUAL_ROWS } from "@/content/base-manuals";
import {
  csvToRows,
  groupVideos,
  parseCsv,
  parseDatacheck,
  parseLinks,
  parseNews,
  parseOnePages,
  parseVideos,
  youtubeId,
  type Row,
} from "@/domain/manuals";

describe("parseCsv", () => {
  it("handles quotes, escaped quotes, commas and newlines inside cells", () => {
    expect(parseCsv('"a","b ""x""","c,d"\r\n"1","line1\nline2",""\n')).toEqual([
      ["a", 'b "x"', "c,d"],
      ["1", "line1\nline2", ""],
    ]);
  });

  it("maps rows by lower-cased header and drops blank rows", () => {
    expect(csvToRows('"Title","URL"\n"x","https://a"\n"",""\n')).toEqual([
      { title: "x", url: "https://a" },
    ]);
  });
});

describe("row parsers", () => {
  it("hides rows marked ไม่/no, drops non-https links, sorts by order", () => {
    const rows: Row[] = [
      { order: "2", title: "B", url: "https://b" },
      { order: "1", title: "A", url: "https://a" },
      { order: "3", title: "Hidden", url: "https://h", show: "ไม่" },
      { order: "4", title: "Insecure", url: "http://x" },
      { order: "5", title: "", url: "https://no-title" },
    ];
    expect(parseOnePages(rows).map((o) => o.title)).toEqual(["A", "B"]);
    expect(parseLinks(rows.map((r) => ({ ...r, show: r.show ?? "NO" }))).length).toBe(0);
  });

  it("news: splits body into paragraphs and keeps only valid links", () => {
    const [n] = parseNews([
      {
        title: "ประกาศ",
        body: "ย่อหน้า 1\n\nย่อหน้า 2",
        link1_label: "วิดีโอ",
        link1_url: "https://youtu.be/abc",
        link2_url: "javascript:alert(1)",
        link3_url: "https://x.example",
      },
    ]);
    expect(n!.body).toEqual(["ย่อหน้า 1", "ย่อหน้า 2"]);
    expect(n!.links).toEqual([
      { label: "วิดีโอ", url: "https://youtu.be/abc" },
      { label: "https://x.example", url: "https://x.example" },
    ]);
  });

  it("datacheck: splits provinces on · and orders by region", () => {
    const d = parseDatacheck([
      { region: "2", url: "https://pcu2", provinces: "ตาก · สุโขทัย" },
      { region: "1", url: "https://pcu1", provinces: "เชียงใหม่·น่าน" },
    ]);
    expect(d.map((x) => x.region)).toEqual([1, 2]);
    expect(d[0]!.provinces).toEqual(["เชียงใหม่", "น่าน"]);
  });

  it("videos: extracts YouTube ids and groups by category in first-seen order", () => {
    const v = parseVideos([
      {
        order: "1",
        category: "A",
        title: "v1",
        url: "https://www.youtube.com/watch?v=RKje_mDM9SE",
      },
      { order: "2", category: "B", title: "v2", url: "https://youtu.be/xyz" },
      { order: "3", category: "A", title: "v3", url: "https://drive.google.com/file/d/1/view" },
    ]);
    expect(v.map((x) => x.youtubeId)).toEqual(["RKje_mDM9SE", "xyz", null]);
    expect(groupVideos(v).map((g) => [g.category, g.videos.length])).toEqual([
      ["A", 2],
      ["B", 1],
    ]);
  });

  it("youtubeId handles embed/shorts and rejects other hosts", () => {
    expect(youtubeId("https://www.youtube.com/embed/abc")).toBe("abc");
    expect(youtubeId("https://youtube.com/shorts/def")).toBe("def");
    expect(youtubeId("https://evil.example/watch?v=abc")).toBeNull();
  });
});

describe("built-in manual content", () => {
  it("parses completely (nothing silently dropped)", () => {
    expect(parseNews(BASE_MANUAL_ROWS.news)).toHaveLength(BASE_MANUAL_ROWS.news.length);
    expect(parseDatacheck(BASE_MANUAL_ROWS.datacheck)).toHaveLength(12);
    expect(parseOnePages(BASE_MANUAL_ROWS.onepage)).toHaveLength(12);
    expect(parseVideos(BASE_MANUAL_ROWS.videos)).toHaveLength(37);
    expect(parseLinks(BASE_MANUAL_ROWS.links)).toHaveLength(3);
  });
});
