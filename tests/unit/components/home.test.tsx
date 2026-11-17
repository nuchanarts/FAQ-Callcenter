// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HomeScreen } from "@/components/features/home/home-screen";
import { ContentRenderer } from "@/components/features/topic/content-renderer";
import { TopicCard } from "@/components/features/topic/topic-card";
import type { EffectiveTopic } from "@/domain/topics";

function topic(p: Partial<EffectiveTopic> & { id: string; title: string }): EffectiveTopic {
  return {
    origin: "base",
    status: "original",
    hidden: false,
    order: 0,
    version: 0,
    published: true,
    draft: null,
    categoryId: "login",
    level: "self",
    keywords: [],
    solution: "1. ขั้นแรก\n> ถ้ายังไม่ได้ แจ้งทีม",
    attachments: [],
    ...p,
  };
}

const topics = [
  topic({
    id: "b-a",
    order: 1,
    title: "ขอ Authen Code ไม่ได้",
    categoryId: "authen",
    level: "partial",
    keywords: ["ออเทน"],
  }),
  topic({ id: "b-b", order: 2, title: "พิมพ์สติกเกอร์ยาไม่ออก", categoryId: "print" }),
  topic({ id: "b-c", order: 3, title: "เข้าระบบไม่ได้", categoryId: "login", level: "team" }),
];

describe("ContentRenderer", () => {
  it("renders steps, notes and https links; HTML stays text", () => {
    const { container } = render(
      <ContentRenderer
        source={"1. กด **บันทึก**\n> ดู [คู่มือ](https://x.com)\n<img src=x onerror=alert(1)>"}
      />,
    );
    expect(screen.getByRole("list")).toHaveTextContent("กด บันทึก");
    const link = screen.getByRole("link", { name: /คู่มือ/ });
    expect(link).toHaveAttribute("href", "https://x.com");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeInTheDocument();
  });
});

describe("TopicCard", () => {
  it("expands and collapses, and links 'ยังไม่ได้' to the prefilled report form", async () => {
    render(<TopicCard topic={topics[0]!} />);
    const toggle = screen.getByRole("button", { name: /ขอ Authen Code ไม่ได้/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("ขั้นแรก")).toBeNull();
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("ขั้นแรก")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ยังไม่ได้/ })).toHaveAttribute(
      "href",
      "/report?topic=b-a",
    );
    await userEvent.click(toggle);
    expect(screen.queryByText("ขั้นแรก")).toBeNull();
  });

  it("shows the level badge", () => {
    render(<TopicCard topic={topics[0]!} />);
    expect(screen.getByText("ทำเองได้บางส่วน")).toBeInTheDocument();
  });
});

describe("HomeScreen", () => {
  it("shows all topics and filters by typed keyword", async () => {
    render(<HomeScreen topics={topics} />);
    expect(screen.getAllByRole("article")).toHaveLength(3);
    await userEvent.type(screen.getByRole("searchbox"), "ออเทน");
    expect(await screen.findByText("พบ 1 หัวข้อ")).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(1);
  });

  it("filters by category with per-category counts", async () => {
    render(<HomeScreen topics={topics} />);
    const tabs = screen.getByRole("group", { name: "หมวดปัญหา" });
    const print = within(tabs).getByRole("button", { name: /การพิมพ์/ });
    expect(print).toHaveTextContent("1");
    await userEvent.click(print);
    expect(print).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByRole("article")).toHaveLength(1);
    await userEvent.click(within(tabs).getByRole("button", { name: /ทั้งหมด/ }));
    expect(screen.getAllByRole("article")).toHaveLength(3);
  });

  it("shows an empty state that can clear the search", async () => {
    render(<HomeScreen topics={topics} />);
    await userEvent.type(screen.getByRole("searchbox"), "ไม่มีคำนี้แน่นอน");
    expect(await screen.findByText("ไม่พบหัวข้อที่ตรงกับคำค้น")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ไปที่แบบฟอร์มแจ้งปัญหา" })).toHaveAttribute(
      "href",
      "/report",
    );
    const [, emptyStateClear] = screen.getAllByRole("button", { name: "ล้างคำค้น" });
    await userEvent.click(emptyStateClear!);
    expect(screen.getAllByRole("article")).toHaveLength(3);
  });

  it("focuses search with '/' and clears with Esc", async () => {
    render(<HomeScreen topics={topics} />);
    fireEvent.keyDown(document.body, { key: "/" });
    const box = screen.getByRole("searchbox");
    expect(box).toHaveFocus();
    await userEvent.type(box, "abc");
    await userEvent.keyboard("{Escape}");
    expect(box).toHaveValue("");
  });

  it("starts from the query and category in the URL", () => {
    render(<HomeScreen topics={topics} initialQuery="ออเทน" initialCategory="authen" />);
    expect(screen.getByRole("searchbox")).toHaveValue("ออเทน");
    expect(screen.getAllByRole("article")).toHaveLength(1);
  });

  it("keeps the URL in sync so searches can be shared", async () => {
    window.history.replaceState(null, "", "/");
    render(<HomeScreen topics={topics} />);
    await userEvent.type(screen.getByRole("searchbox"), "ออเทน");
    const chips = screen.getByRole("group", { name: "หมวดปัญหา" });
    await userEvent.click(within(chips).getByRole("button", { name: /ตรวจสอบสิทธิ/ }));
    await vi.waitFor(() => {
      const params = new URLSearchParams(window.location.search);
      expect(params.get("q")).toBe("ออเทน");
      expect(params.get("category")).toBe("authen");
    });
    await userEvent.clear(screen.getByRole("searchbox"));
    await vi.waitFor(() =>
      expect(new URLSearchParams(window.location.search).has("q")).toBe(false),
    );
  });

  describe("wide screens (≥ 1280 px): list + answer side by side", () => {
    function wide() {
      window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: true,
        addEventListener: () => {},
        removeEventListener: () => {},
      }));
    }

    it("shows the first result's answer immediately", () => {
      wide();
      render(<HomeScreen topics={topics} />);
      const detail = screen.getByRole("region", { name: "ขอ Authen Code ไม่ได้" });
      expect(within(detail).getByText("ขั้นแรก")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /ขอ Authen Code ไม่ได้/ })).toHaveAttribute(
        "aria-current",
        "true",
      );
    });

    it("switches the answer when another topic is chosen and follows the search", async () => {
      wide();
      render(<HomeScreen topics={topics} />);
      await userEvent.click(screen.getByRole("button", { name: /เข้าระบบไม่ได้/ }));
      expect(screen.getByRole("region", { name: "เข้าระบบไม่ได้" })).toBeInTheDocument();
      await userEvent.type(screen.getByRole("searchbox"), "สติกเกอร์");
      expect(await screen.findByRole("region", { name: "พิมพ์สติกเกอร์ยาไม่ออก" })).toBeInTheDocument();
    });
  });

  it("shows the degraded notice when only built-in content is available", () => {
    render(<HomeScreen topics={topics} degraded />);
    expect(screen.getByRole("status")).toHaveTextContent("กำลังแสดงเนื้อหาพื้นฐาน");
  });
});
