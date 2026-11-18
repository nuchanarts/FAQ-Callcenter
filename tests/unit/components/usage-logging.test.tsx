// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { EffectiveTopic } from "@/domain/topics";

const nav = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));

const { TopicCard } = await import("@/components/features/topic/topic-card");
const { VisitTracker, VISIT_KEY } = await import("@/components/features/layout/visit-tracker");

const sendBeacon = vi.fn().mockReturnValue(true);
const sent = () => sendBeacon.mock.calls.map((c) => JSON.parse(c[1] as string));

beforeEach(() => {
  sendBeacon.mockClear();
  sessionStorage.clear();
  Object.defineProperty(navigator, "sendBeacon", { value: sendBeacon, configurable: true });
});

function topic(id: string): EffectiveTopic {
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
    title: `หัวข้อ ${id}`,
    categoryId: "login",
    level: "self",
    keywords: [],
    solution: "1. ก",
    attachments: [],
  };
}

describe("view counting in accordion mode", () => {
  it("expanding a card logs one view; expanding it again in the same visit does not", async () => {
    render(<TopicCard topic={topic("acc-1")} />);
    const button = screen.getByRole("button", { name: /หัวข้อ acc-1/ });
    await userEvent.click(button); // open
    await userEvent.click(button); // close
    await userEvent.click(button); // open again
    expect(sent()).toEqual([{ kind: "view", topicId: "acc-1" }]);
  });

  it("collapsing does not log", async () => {
    render(<TopicCard topic={topic("acc-2")} defaultOpen />);
    await userEvent.click(screen.getByRole("button", { name: /หัวข้อ acc-2/ }));
    expect(sent()).toEqual([]);
  });
});

describe("VisitTracker", () => {
  it("logs one visit per browser session", () => {
    const { rerender } = render(<VisitTracker />);
    rerender(<VisitTracker />);
    render(<VisitTracker />);
    expect(sent()).toEqual([{ kind: "visit" }]);
    expect(sessionStorage.getItem(VISIT_KEY)).toBe("1");
  });

  it("does not count staff pages", () => {
    nav.pathname = "/admin/stats";
    render(<VisitTracker />);
    nav.pathname = "/login";
    render(<VisitTracker />);
    nav.pathname = "/";
    expect(sent()).toEqual([]);
  });
});
