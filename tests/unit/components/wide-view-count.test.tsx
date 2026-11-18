// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { HomeScreen } from "@/components/features/home/home-screen";
import type { EffectiveTopic } from "@/domain/topics";

const sendBeacon = vi.fn().mockReturnValue(true);
const views = () =>
  sendBeacon.mock.calls.map((c) => JSON.parse(c[1] as string)).filter((e) => e.kind === "view");

function topic(id: string, title: string): EffectiveTopic {
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
    categoryId: "login",
    level: "self",
    keywords: [],
    solution: "1. ก",
    attachments: [],
  };
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  sendBeacon.mockClear();
  Object.defineProperty(navigator, "sendBeacon", { value: sendBeacon, configurable: true });
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: true,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});
afterEach(() => vi.useRealTimers());

describe("wide screens count the answer shown automatically", () => {
  it("counts the auto-shown first topic once it has stayed on screen", async () => {
    render(<HomeScreen topics={[topic("wv-1", "หัวข้อแรก"), topic("wv-2", "หัวข้อสอง")]} />);
    expect(screen.getByRole("region", { name: "หัวข้อแรก" })).toBeInTheDocument();
    expect(views()).toEqual([]);
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(views()).toEqual([{ kind: "view", topicId: "wv-1" }]);
  });

  it("does not count when the answer is shown only briefly", async () => {
    const { unmount } = render(<HomeScreen topics={[topic("wv-3", "หัวข้อสาม")]} />);
    await act(() => vi.advanceTimersByTimeAsync(300));
    unmount();
    await act(() => vi.advanceTimersByTimeAsync(3000));
    expect(views()).toEqual([]);
  });
});
