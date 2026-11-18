// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TopicCard } from "@/components/features/topic/topic-card";
import { TopicDetail } from "@/components/features/topic/topic-detail";
import type { EffectiveTopic } from "@/domain/topics";

const IMG = "https://x.public.blob.vercel-storage.com/white.png";

function topic(p: Partial<EffectiveTopic> = {}): EffectiveTopic {
  return {
    id: "c-1",
    origin: "custom",
    status: "custom",
    hidden: false,
    order: 0,
    version: 1,
    published: true,
    draft: null,
    deleted: false,
    title: "เข้าระบบแล้วหน้าจอขาว",
    categoryId: "login",
    level: "self",
    keywords: [],
    solution: "1. กด F5",
    attachments: [],
    ...p,
  };
}

describe("symptom image for viewers", () => {
  it("topic card shows a thumbnail when the topic has a symptom image", () => {
    const { container } = render(
      <TopicCard topic={topic({ symptomImage: { url: IMG, caption: "" } })} />,
    );
    expect(container.querySelector(`button img[src="${IMG}"]`)).not.toBeNull();
  });

  it("topic card has no thumbnail without one", () => {
    const { container } = render(<TopicCard topic={topic()} />);
    expect(container.querySelector("button img")).toBeNull();
  });

  it("topic detail shows หน้าจอที่พบ before the solution", () => {
    render(<TopicDetail topic={topic({ symptomImage: { url: IMG, caption: "จอขาว" } })} />);
    const heading = screen.getByText("หน้าจอที่พบ");
    const step = screen.getByText("กด F5");
    expect(heading.compareDocumentPosition(step) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole("img", { name: "จอขาว" })).toHaveAttribute("src", IMG);
  });

  it("symptom image alt falls back to the topic title when caption is empty", () => {
    render(<TopicDetail topic={topic({ symptomImage: { url: IMG, caption: "" } })} />);
    expect(screen.getByRole("img", { name: "เข้าระบบแล้วหน้าจอขาว" })).toBeInTheDocument();
  });

  it("an expanded accordion card shows the full image too", async () => {
    render(<TopicCard topic={topic({ symptomImage: { url: IMG, caption: "จอขาว" } })} />);
    await userEvent.click(screen.getByRole("button", { name: /เข้าระบบแล้วหน้าจอขาว/ }));
    expect(screen.getByRole("img", { name: "จอขาว" })).toBeInTheDocument();
  });
});
