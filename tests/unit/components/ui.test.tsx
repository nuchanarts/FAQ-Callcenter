// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { Kbd } from "@/components/ui/kbd";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ToastProvider, useToast } from "@/components/ui/toast";

describe("Button", () => {
  it("renders variants and forwards clicks", async () => {
    const onClick = vi.fn();
    render(
      <Button variant="secondary" onClick={onClick}>
        บันทึก
      </Button>,
    );
    const btn = screen.getByRole("button", { name: "บันทึก" });
    expect(btn).toHaveAttribute("type", "button");
    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });
  it("disables and marks busy while pending", () => {
    render(<Button pending>บันทึก</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
  });
});

describe("Field", () => {
  it("links label, hint and error to the control", () => {
    render(
      <Field label="อีเมล" hint="ไม่บังคับ" error="รูปแบบอีเมลไม่ถูกต้อง">
        {(props) => <Input {...props} />}
      </Field>,
    );
    const input = screen.getByLabelText("อีเมล");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(/ไม่บังคับ/);
    expect(input).toHaveAccessibleDescription(/รูปแบบอีเมลไม่ถูกต้อง/);
  });
  it("marks required fields", () => {
    render(
      <Field label="ชื่อ" required>
        {(p) => <Input {...p} />}
      </Field>,
    );
    expect(screen.getByLabelText(/ชื่อ/)).toBeRequired();
  });
});

describe("display primitives", () => {
  it("renders badge, notice, kbd, empty state", async () => {
    const onAction = vi.fn();
    render(
      <>
        <Badge tone="self">ทำเองได้</Badge>
        <Notice title="แจ้ง">เนื้อหา</Notice>
        <Kbd>/</Kbd>
        <EmptyState title="ไม่พบ" body="ลองใหม่" actionLabel="ล้าง" onAction={onAction} />
      </>,
    );
    expect(screen.getByText("ทำเองได้")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("แจ้ง");
    expect(screen.getByText("/").tagName).toBe("KBD");
    await userEvent.click(screen.getByRole("button", { name: "ล้าง" }));
    expect(onAction).toHaveBeenCalled();
  });
});

describe("PageSkeleton", () => {
  it("announces loading politely and hides placeholder shapes from assistive tech", async () => {
    const { PageSkeleton } = await import("@/components/ui/skeleton");
    render(<PageSkeleton rows={3} />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveTextContent("กำลังโหลด…");
    expect(status.querySelectorAll("[aria-hidden='true'] > div")).toHaveLength(3);
  });
});

describe("ConfirmDialog", () => {
  it("calls onConfirm or onCancel", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open
        title="ลบ?"
        body="ย้อนกลับไม่ได้"
        confirmLabel="ลบ"
        tone="danger"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    expect(screen.getByRole("dialog", { name: "ลบ?" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "ลบ" }));
    expect(onConfirm).toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "ยกเลิก" }));
    expect(onCancel).toHaveBeenCalled();
  });
  it("renders nothing when closed", () => {
    render(
      <ConfirmDialog
        open={false}
        title="x"
        body="y"
        confirmLabel="ok"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("Toast", () => {
  function Trigger() {
    const toast = useToast();
    return <button onClick={() => toast.show("คัดลอกแล้ว")}>go</button>;
  }
  it("announces messages politely", async () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    await userEvent.click(screen.getByText("go"));
    expect(await screen.findByText("คัดลอกแล้ว")).toBeInTheDocument();
    expect(screen.getByText("คัดลอกแล้ว").closest("[aria-live]")).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });
  it("throws outside provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Trigger />)).toThrow(/ToastProvider/);
    spy.mockRestore();
  });
});
