// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { StatsView } from "@/components/features/admin/stats-table";
import { DEFAULT_TAXONOMY } from "@/domain/taxonomy";
import type { AdminStats } from "@/services/stats-service";

const topics = [
  { id: "a", title: "หัวข้อเอ", categoryId: "login", deleted: false },
  { id: "b", title: "หัวข้อบี", categoryId: "print", deleted: false },
  { id: "c", title: "หัวข้อซี", categoryId: "login", deleted: false },
];

const stats: AdminStats = {
  visits: 57,
  views: 230,
  reports: 19,
  degraded: false,
  byTopic: {
    a: { views: 30, reports: 3, helpful: 40, unhelpful: 6 },
    b: { views: 200, reports: 14, helpful: 5, unhelpful: 21 },
    gone: { views: 0, reports: 2, helpful: 0, unhelpful: 0 },
  },
};

const rows = () => screen.getAllByRole("row").slice(1); // skip header
const cells = (row: HTMLElement) =>
  within(row)
    .getAllByRole("cell")
    .map((c) => c.textContent);

describe("StatsView", () => {
  it("shows the totals", () => {
    render(<StatsView stats={stats} topics={topics} taxonomy={DEFAULT_TAXONOMY} range="30d" />);
    const totals = screen.getByRole("list", { name: "สรุป" });
    expect(totals).toHaveTextContent("เข้าเว็บ57");
    expect(totals).toHaveTextContent("ยอดดูรวม230");
    expect(totals).toHaveTextContent("แจ้งปัญหารวม19");
  });

  it("lists topics by views, most first, with zeros last and deleted ones named", () => {
    render(<StatsView stats={stats} topics={topics} taxonomy={DEFAULT_TAXONOMY} range="30d" />);
    expect(rows().map((r) => cells(r)[0])).toEqual(["หัวข้อบี", "หัวข้อเอ", "(หัวข้อถูกลบ)", "หัวข้อซี"]);
  });

  it("shows views, reports, report rate, helpful votes and helpful rate", () => {
    render(<StatsView stats={stats} topics={topics} taxonomy={DEFAULT_TAXONOMY} range="30d" />);
    // หัวข้อ, หมวด, ดู, แจ้งทีม, % แจ้ง/ดู, ได้ผล, ยังไม่ได้, % ได้ผล
    expect(cells(rows()[0]!)).toEqual([
      "หัวข้อบี",
      "การพิมพ์ / เครื่องพิมพ์",
      "200",
      "14",
      "7%",
      "5",
      "21",
      "19%",
    ]);
  });

  it("shows — when a rate has no base", () => {
    render(<StatsView stats={stats} topics={topics} taxonomy={DEFAULT_TAXONOMY} range="30d" />);
    const zero = rows().find((r) => cells(r)[0] === "หัวข้อซี")!;
    expect(cells(zero)[4]).toBe("—");
    expect(cells(zero)[7]).toBe("—");
  });

  it("offers the three ranges as links and marks the current one", () => {
    render(<StatsView stats={stats} topics={topics} taxonomy={DEFAULT_TAXONOMY} range="7d" />);
    const nav = screen.getByRole("navigation", { name: "ช่วงเวลา" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual([
      "/admin/stats?range=7d",
      "/admin/stats?range=30d",
      "/admin/stats?range=all",
    ]);
    expect(links[0]).toHaveAttribute("aria-current", "page");
    expect(links[1]).not.toHaveAttribute("aria-current");
  });

  it("says so when the counters cannot be read", () => {
    render(
      <StatsView
        stats={{ ...stats, byTopic: {}, degraded: true }}
        topics={topics}
        taxonomy={DEFAULT_TAXONOMY}
        range="30d"
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("อ่านสถิติไม่ได้");
  });
});
