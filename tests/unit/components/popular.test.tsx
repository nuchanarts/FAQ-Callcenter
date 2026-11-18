// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HomeScreen } from "@/components/features/home/home-screen";
import type { EffectiveTopic } from "@/domain/topics";

const sendBeacon = vi.fn().mockReturnValue(true);
beforeEach(() => {
  sendBeacon.mockClear();
  Object.defineProperty(navigator, "sendBeacon", { value: sendBeacon, configurable: true });
});

function topic(id: string, title: string, categoryId = "login"): EffectiveTopic {
  return {
    id,
    origin: "base",
    status: "original",
    hidden: false,
    order: 0,
    version: 0,
    published: true,
    draft: null,
    deleted: false,
    title,
    categoryId,
    level: "self",
    keywords: [],
    solution: `1. วิธีของ ${title}`,
    attachments: [],
  };
}

const topics = [
  topic("p1", "หัวข้อหนึ่ง"),
  topic("p2", "หัวข้อสอง"),
  topic("p3", "หัวข้อสาม", "print"),
  topic("p4", "หัวข้อสี่"),
  topic("p5", "หัวข้อห้า"),
  topic("p6", "หัวข้อหก"),
  topic("p7", "หัวข้อเจ็ด"),
];
const counts = { p1: 4, p2: 128, p3: 64, p4: 97, p5: 10, p6: 9, p7: 8, gone: 999 };

const card = (title: string) =>
  screen.getAllByRole("article").find((a) => a.textContent?.includes(title))!;
const strip = () => screen.queryByRole("region", { name: "ปัญหาที่พบบ่อย" });

describe("view counts and popularity on the home page", () => {
  it("shows ดู N ครั้ง from 5 views up, and nothing below", () => {
    render(<HomeScreen topics={topics} viewCounts={counts} />);
    expect(within(card("หัวข้อสอง")).getByText("ดู 128 ครั้ง")).toBeInTheDocument();
    expect(within(card("หัวข้อหนึ่ง")).queryByText(/ดู \d+ ครั้ง/)).toBeNull();
  });

  it("marks the top 5 as ยอดนิยม", () => {
    render(<HomeScreen topics={topics} viewCounts={counts} />);
    const popular = screen
      .getAllByRole("article")
      .filter((a) => within(a).queryByText("ยอดนิยม"))
      .map((a) => a.querySelector("h3")!.textContent);
    expect(popular).toHaveLength(5);
    expect(popular.join()).not.toMatch(/หัวข้อหนึ่ง|หัวข้อเจ็ด/);
  });

  it("shows the ปัญหาที่พบบ่อย strip with the 3 most viewed, in order", () => {
    render(<HomeScreen topics={topics} viewCounts={counts} />);
    const items = within(strip()!).getAllByRole("button");
    expect(items.map((b) => b.textContent)).toEqual([
      expect.stringContaining("หัวข้อสอง"),
      expect.stringContaining("หัวข้อสี่"),
      expect.stringContaining("หัวข้อสาม"),
    ]);
  });

  it("hides the strip while searching", async () => {
    render(<HomeScreen topics={topics} viewCounts={counts} />);
    await userEvent.type(screen.getByRole("searchbox"), "หก");
    await screen.findByText("พบ 1 หัวข้อ");
    expect(strip()).toBeNull();
  });

  it("hides the strip while a category is chosen", () => {
    render(<HomeScreen topics={topics} viewCounts={counts} initialCategory="print" />);
    expect(strip()).toBeNull();
  });

  it("hides the strip when no topic has 5 views", () => {
    render(<HomeScreen topics={topics} viewCounts={{ p1: 4 }} />);
    expect(strip()).toBeNull();
    expect(screen.queryByText("ยอดนิยม")).toBeNull();
  });

  it("clicking a strip item opens that topic and logs a view", async () => {
    render(<HomeScreen topics={topics} viewCounts={counts} />);
    await userEvent.click(within(strip()!).getByRole("button", { name: /หัวข้อสี่/ }));
    expect(within(card("หัวข้อสี่")).getByText("วิธีของ หัวข้อสี่")).toBeInTheDocument();
    const sent = sendBeacon.mock.calls.map((c) => JSON.parse(c[1] as string));
    expect(sent).toContainEqual({ kind: "view", topicId: "p4" });
  });

  it("never shows report or helpful counts", () => {
    render(<HomeScreen topics={topics} viewCounts={counts} />);
    expect(screen.queryByText(/แจ้ง(ทีม)? \d+ ครั้ง|ได้ผล \d+/)).toBeNull();
  });
});
