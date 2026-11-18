// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HelpfulFeedback } from "@/components/features/topic/helpful-feedback";

const sendBeacon = vi.fn().mockReturnValue(true);
const sent = () => sendBeacon.mock.calls.map((c) => JSON.parse(c[1] as string));

beforeEach(() => {
  sendBeacon.mockClear();
  Object.defineProperty(navigator, "sendBeacon", { value: sendBeacon, configurable: true });
});

describe("HelpfulFeedback", () => {
  it("asks whether the steps worked", () => {
    render(<HelpfulFeedback topicId="hf-0" />);
    expect(screen.getByText("วิธีนี้แก้ปัญหาได้ไหม?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ได้ผล" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ยังไม่ได้/ })).toHaveAttribute(
      "href",
      "/report?topic=hf-0",
    );
  });

  it("ได้ผล logs helpful once and thanks the user", async () => {
    render(<HelpfulFeedback topicId="hf-1" />);
    await userEvent.click(screen.getByRole("button", { name: "ได้ผล" }));
    expect(sent()).toEqual([{ kind: "helpful", topicId: "hf-1" }]);
    expect(screen.getByRole("status")).toHaveTextContent("ขอบคุณที่ช่วยบอก");
    expect(screen.queryByRole("button", { name: "ได้ผล" })).toBeNull();
  });

  it("ยังไม่ได้ logs unhelpful on its way to the prefilled report form", async () => {
    render(<HelpfulFeedback topicId="hf-2" />);
    const link = screen.getByRole("link", { name: /ยังไม่ได้/ });
    link.addEventListener("click", (e) => e.preventDefault()); // jsdom: no navigation
    await userEvent.click(link);
    expect(sent()).toEqual([{ kind: "unhelpful", topicId: "hf-2" }]);
  });

  it("re-opening an already rated topic in the same visit shows the thanks, not the question", async () => {
    const first = render(<HelpfulFeedback topicId="hf-3" />);
    await userEvent.click(screen.getByRole("button", { name: "ได้ผล" }));
    first.unmount();
    render(<HelpfulFeedback topicId="hf-3" />);
    expect(screen.queryByRole("button", { name: "ได้ผล" })).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("ขอบคุณที่ช่วยบอก");
    expect(sent()).toHaveLength(1);
  });
});
