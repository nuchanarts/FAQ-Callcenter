// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { EffectiveTopic } from "@/domain/topics";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
const actions = vi.hoisted(() => ({ createTopicAction: vi.fn(), saveTopicAction: vi.fn() }));
vi.mock("@/app/actions/topic-actions", () => actions);
const blob = vi.hoisted(() => ({ upload: vi.fn() }));
vi.mock("@vercel/blob/client", () => blob);

const { SymptomImageEditor } = await import("@/components/features/admin/symptom-image-editor");
const { TopicForm } = await import("@/components/features/admin/topic-form");
const { ToastProvider } = await import("@/components/ui/toast");

const IMG = "https://x.public.blob.vercel-storage.com/error.png";

beforeEach(() => vi.clearAllMocks());

describe("SymptomImageEditor", () => {
  it("shows the upload button when images are enabled", () => {
    render(<SymptomImageEditor value={null} onChange={() => {}} imagesEnabled />);
    expect(screen.getByRole("button", { name: "แนบรูปอาการ" })).toBeInTheDocument();
  });

  it("shows a hint instead of the button when images are not enabled", () => {
    render(<SymptomImageEditor value={null} onChange={() => {}} imagesEnabled={false} />);
    expect(screen.queryByRole("button", { name: "แนบรูปอาการ" })).toBeNull();
    expect(screen.getByText(/ยังไม่ได้เปิดที่เก็บรูป/)).toBeInTheDocument();
  });

  it("uploads a picked file and reports it with an empty caption", async () => {
    blob.upload.mockResolvedValue({ url: IMG });
    const onChange = vi.fn();
    const { container } = render(
      <SymptomImageEditor value={null} onChange={onChange} imagesEnabled />,
    );
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, new File(["x"], "error.png", { type: "image/png" }));
    expect(onChange).toHaveBeenCalledWith({ url: IMG, caption: "" });
  });

  it("refuses a file over 5 MB without uploading", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <SymptomImageEditor value={null} onChange={onChange} imagesEnabled />,
    );
    const big = new File(["x"], "big.png", { type: "image/png" });
    Object.defineProperty(big, "size", { value: 6 * 1024 * 1024 });
    await userEvent.upload(container.querySelector('input[type="file"]')!, big);
    expect(blob.upload).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("big.png");
  });

  it("with an image: shows it, edits the caption, and removes it", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <SymptomImageEditor value={{ url: IMG, caption: "" }} onChange={onChange} imagesEnabled />,
    );
    expect(container.querySelector(`img[src="${IMG}"]`)).not.toBeNull();
    await userEvent.type(screen.getByLabelText("คำบรรยายรูป"), "ก");
    expect(onChange).toHaveBeenLastCalledWith({ url: IMG, caption: "ก" });
    await userEvent.click(screen.getByRole("button", { name: "เอารูปออก" }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});

describe("TopicForm symptom image", () => {
  const topic: EffectiveTopic = {
    id: "c-1",
    origin: "custom",
    status: "custom",
    hidden: false,
    order: 0,
    version: 3,
    published: true,
    draft: null,
    deleted: false,
    title: "หน้าจอขาว",
    categoryId: "login",
    level: "self",
    keywords: [],
    solution: "1. ก",
    attachments: [],
    symptomImage: { url: IMG, caption: "หน้าจอขาวทั้งจอ" },
  };

  it("shows the symptom image in the preview and saves it with the content", async () => {
    actions.saveTopicAction.mockResolvedValue({ ok: true, data: topic });
    render(
      <ToastProvider>
        <TopicForm topic={topic} imagesEnabled />
      </ToastProvider>,
    );
    const preview = screen.getByRole("region", { name: "ตัวอย่างที่ผู้ใช้จะเห็น" });
    expect(within(preview).getByRole("img", { name: "หน้าจอขาวทั้งจอ" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /บันทึก/ }));
    expect(actions.saveTopicAction.mock.calls[0]![0].content.symptomImage).toEqual(
      topic.symptomImage,
    );
  });
});
