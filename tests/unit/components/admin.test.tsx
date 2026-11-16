// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { EffectiveTopic } from "@/domain/topics";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));

const actions = vi.hoisted(() => ({
  createTopicAction: vi.fn(),
  saveTopicAction: vi.fn(),
  setTopicHiddenAction: vi.fn(),
  restoreTopicAction: vi.fn(),
  deleteTopicAction: vi.fn(),
}));
vi.mock("@/app/actions/topic-actions", () => actions);

const { TopicForm } = await import("@/components/features/admin/topic-form");
const { TopicTable } = await import("@/components/features/admin/topic-table");
const { ToastProvider } = await import("@/components/ui/toast");

function topic(p: Partial<EffectiveTopic> & { id: string; title: string }): EffectiveTopic {
  return {
    origin: "base",
    status: "original",
    hidden: false,
    order: 0,
    version: 0,
    categoryId: "login",
    level: "self",
    keywords: [],
    solution: "1. ก",
    attachments: [],
    ...p,
  };
}

const wrap = (ui: React.ReactNode) => render(<ToastProvider>{ui}</ToastProvider>);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TopicForm", () => {
  it("shows a live, escaped preview of the solution", async () => {
    wrap(<TopicForm />);
    await userEvent.type(screen.getByLabelText(/^วิธีแก้/), "1. กด <b>x</b>");
    const preview = screen.getByRole("region", { name: "ตัวอย่างที่ผู้ใช้จะเห็น" });
    expect(within(preview).getByText("กด <b>x</b>")).toBeInTheDocument();
    expect(preview.querySelector("b")).toBeNull();
  });

  it("creates a topic and returns to the list", async () => {
    actions.createTopicAction.mockResolvedValue({
      ok: true,
      data: topic({ id: "c-1", title: "ใหม่" }),
    });
    wrap(<TopicForm />);
    await userEvent.type(screen.getByLabelText(/^คำถาม \/ อาการ/), "ใหม่");
    await userEvent.selectOptions(screen.getByLabelText(/^หมวด/), "print");
    await userEvent.click(screen.getByRole("radio", { name: /ต้องแจ้งทีม/ }));
    await userEvent.type(screen.getByLabelText(/^คำค้นเพิ่มเติม/), "ปริ้น, พิมพ์");
    await userEvent.type(screen.getByLabelText(/^วิธีแก้/), "1. ทำ");
    await userEvent.click(screen.getByRole("button", { name: "บันทึกและเผยแพร่" }));
    expect(actions.createTopicAction).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "ใหม่",
        categoryId: "print",
        level: "team",
        keywords: ["ปริ้น", "พิมพ์"],
      }),
    );
    expect(push).toHaveBeenCalledWith("/admin");
  });

  it("shows field errors from the server and keeps input", async () => {
    actions.createTopicAction.mockResolvedValue({
      ok: false,
      error: {
        code: "validation",
        message: "ข้อมูลไม่ถูกต้อง",
        fieldErrors: { "attachments.0.url": ["ลิงก์ต้องขึ้นต้นด้วย https:// เท่านั้น"] },
      },
    });
    wrap(<TopicForm />);
    await userEvent.click(screen.getByRole("button", { name: "เพิ่มลิงก์" }));
    await userEvent.type(screen.getByLabelText(/^ลิงก์/), "http://x");
    await userEvent.click(screen.getByRole("button", { name: "บันทึกและเผยแพร่" }));
    expect(await screen.findByText("ลิงก์ต้องขึ้นต้นด้วย https:// เท่านั้น")).toBeInTheDocument();
    expect(screen.getByLabelText(/^ลิงก์/)).toHaveValue("http://x");
  });

  it("explains edit conflicts", async () => {
    actions.saveTopicAction.mockResolvedValue({
      ok: false,
      error: { code: "conflict", message: "มีคนแก้ไขหัวข้อนี้ไปแล้ว กรุณาโหลดใหม่" },
    });
    wrap(<TopicForm topic={topic({ id: "b-1", title: "เดิม", version: 2 })} />);
    await userEvent.click(screen.getByRole("button", { name: "บันทึกและเผยแพร่" }));
    expect(actions.saveTopicAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: "b-1", expectedVersion: 2 }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("มีคนแก้ไขหัวข้อนี้ไปแล้ว");
  });
});

describe("TopicTable", () => {
  const topics = [
    topic({ id: "b-1", title: "ต้นฉบับ", status: "original" }),
    topic({
      id: "b-2",
      title: "แก้แล้ว",
      status: "edited",
      version: 3,
      updatedBy: "ก",
      updatedAt: "2026-11-16T05:00:00.000Z",
      categoryId: "print",
    }),
    topic({
      id: "c-1",
      title: "เพิ่มเอง",
      origin: "custom",
      status: "custom",
      version: 1,
      hidden: true,
    }),
  ];

  it("filters by status and text", async () => {
    wrap(<TopicTable topics={topics} />);
    expect(screen.getAllByRole("row")).toHaveLength(4);
    await userEvent.selectOptions(screen.getByLabelText("สถานะ"), "hidden");
    expect(screen.getAllByRole("row")).toHaveLength(2);
    await userEvent.selectOptions(screen.getByLabelText("สถานะ"), "all");
    await userEvent.type(screen.getByLabelText("ค้นหาหัวข้อ"), "แก้แล้ว");
    expect(screen.getAllByRole("row")).toHaveLength(2);
  });

  it("offers restore only for edited built-ins and delete only for custom topics", () => {
    wrap(<TopicTable topics={topics} />);
    const rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]!).queryByRole("button", { name: /คืนค่าเดิม/ })).toBeNull();
    expect(within(rows[0]!).queryByRole("button", { name: /ลบ/ })).toBeNull();
    expect(within(rows[1]!).getByRole("button", { name: /คืนค่าเดิม/ })).toBeInTheDocument();
    expect(within(rows[2]!).getByRole("button", { name: /ลบ/ })).toBeInTheDocument();
    expect(within(rows[2]!).getByRole("button", { name: /แสดง/ })).toBeInTheDocument();
  });

  it("requires two confirmations to delete", async () => {
    actions.deleteTopicAction.mockResolvedValue({ ok: true, data: { id: "c-1" } });
    wrap(<TopicTable topics={topics} />);
    await userEvent.click(screen.getByRole("button", { name: /ลบ เพิ่มเอง/ }));
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "ลบ" }));
    expect(actions.deleteTopicAction).not.toHaveBeenCalled();
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "ลบถาวร" }),
    );
    expect(actions.deleteTopicAction).toHaveBeenCalledWith({ id: "c-1" });
    expect(refresh).toHaveBeenCalled();
  });

  it("hides a topic with its current version", async () => {
    actions.setTopicHiddenAction.mockResolvedValue({ ok: true, data: topics[1] });
    wrap(<TopicTable topics={topics} />);
    await userEvent.click(screen.getByRole("button", { name: /ซ่อน แก้แล้ว/ }));
    expect(actions.setTopicHiddenAction).toHaveBeenCalledWith({
      id: "b-2",
      hidden: true,
      expectedVersion: 3,
    });
  });
});
