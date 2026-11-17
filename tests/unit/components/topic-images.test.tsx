// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TopicImages } from "@/components/features/topic/topic-images";
import { parseTopicContent } from "@/domain/topic";

describe("topic images", () => {
  it("accepts https image attachments in topic content", () => {
    const c = parseTopicContent({
      title: "จอขาว",
      categoryId: "login",
      level: "self",
      keywords: [],
      solution: "1. ก",
      attachments: [
        { kind: "image", label: "หน้าจอ", url: "https://x.public.blob.vercel-storage.com/a.png" },
      ],
    });
    expect(c.attachments[0]!.kind).toBe("image");
  });

  it("renders images with captions, linking to the full-size file", () => {
    render(
      <TopicImages
        images={[{ kind: "image", label: "ข้อความแจ้งเตือน", url: "https://img.example/a.png" }]}
      />,
    );
    const img = screen.getByRole("img", { name: "ข้อความแจ้งเตือน" });
    expect(img).toHaveAttribute("src", "https://img.example/a.png");
    expect(img.closest("a")).toHaveAttribute("href", "https://img.example/a.png");
    expect(screen.getByText("ข้อความแจ้งเตือน", { selector: "figcaption" })).toBeInTheDocument();
  });

  it("renders nothing without images", () => {
    const { container } = render(<TopicImages images={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
