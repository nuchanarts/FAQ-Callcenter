// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, renderHook } from "@testing-library/react";
import { useDebounce } from "@/hooks/use-debounce";
import { useClipboard } from "@/hooks/use-clipboard";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useHotkey } from "@/hooks/use-hotkey";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("useDebounce", () => {
  it("updates only after the delay", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ v }) => useDebounce(v, 150), {
      initialProps: { v: "a" },
    });
    rerender({ v: "ab" });
    expect(result.current).toBe("a");
    act(() => vi.advanceTimersByTime(150));
    expect(result.current).toBe("ab");
  });
});

describe("useClipboard", () => {
  it("returns copied when the clipboard API works", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const { result } = renderHook(() => useClipboard());
    await expect(result.current.copy("hello")).resolves.toBe("copied");
    expect(writeText).toHaveBeenCalledWith("hello");
  });
  it("returns blocked when the clipboard API rejects", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const { result } = renderHook(() => useClipboard());
    await expect(result.current.copy("hello")).resolves.toBe("blocked");
  });
  it("returns blocked when there is no clipboard API", async () => {
    Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
    const { result } = renderHook(() => useClipboard());
    await expect(result.current.copy("x")).resolves.toBe("blocked");
  });
});

describe("useLocalStorage", () => {
  it("reads, writes and clears JSON values", () => {
    localStorage.setItem("k", JSON.stringify({ a: 1 }));
    const { result } = renderHook(() => useLocalStorage<{ a: number } | null>("k", null));
    expect(result.current.value).toEqual({ a: 1 });
    act(() => result.current.set({ a: 2 }));
    expect(JSON.parse(localStorage.getItem("k")!)).toEqual({ a: 2 });
    act(() => result.current.remove());
    expect(localStorage.getItem("k")).toBeNull();
    expect(result.current.value).toBeNull();
  });
  it("falls back to the initial value on corrupt data or storage errors", () => {
    localStorage.setItem("k", "{not json");
    const { result } = renderHook(() => useLocalStorage("k", "init"));
    expect(result.current.value).toBe("init");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => act(() => result.current.set("x"))).not.toThrow();
  });
});

describe("useUnsavedChanges", () => {
  it("blocks unload only while dirty", () => {
    const { rerender, unmount } = renderHook(({ dirty }) => useUnsavedChanges(dirty), {
      initialProps: { dirty: false },
    });
    const fire = () => {
      const e = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(e);
      return e.defaultPrevented;
    };
    expect(fire()).toBe(false);
    rerender({ dirty: true });
    expect(fire()).toBe(true);
    unmount();
    expect(fire()).toBe(false);
  });
});

describe("useHotkey", () => {
  function Probe({ onHit }: { onHit: () => void }) {
    useHotkey("/", onHit);
    return <input aria-label="field" />;
  }
  it("fires on the key outside text fields only", () => {
    const onHit = vi.fn();
    const { getByLabelText } = render(<Probe onHit={onHit} />);
    fireEvent.keyDown(document.body, { key: "/" });
    expect(onHit).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(getByLabelText("field"), { key: "/" });
    expect(onHit).toHaveBeenCalledTimes(1);
  });
  it("ignores modified keys", () => {
    const onHit = vi.fn();
    render(<Probe onHit={onHit} />);
    fireEvent.keyDown(document.body, { key: "/", ctrlKey: true });
    expect(onHit).not.toHaveBeenCalled();
  });
});
