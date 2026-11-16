// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReportForm, REPORTER_STORAGE_KEY } from "@/components/features/report/report-form";
import { ToastProvider } from "@/components/ui/toast";

const writeText = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
});
afterEach(() => {
  localStorage.clear();
  writeText.mockClear();
});

function setup(props: { topicTitle?: string } = {}) {
  render(
    <ToastProvider>
      <ReportForm {...props} />
    </ToastProvider>,
  );
}

async function fillReporter() {
  await userEvent.type(screen.getByLabelText(/ชื่อ - สกุล ผู้แจ้ง/), "สมใจ ใจดี");
  await userEvent.type(screen.getByLabelText(/ตำแหน่งงาน/), "พยาบาล");
  await userEvent.type(screen.getByLabelText(/รหัสหน่วยงาน 5 หลัก/), "03562");
  await userEvent.type(screen.getByLabelText(/ชื่อหน่วยงาน/), "รพ.สต.ตัวอย่าง");
  await userEvent.type(screen.getByLabelText(/เบอร์ติดต่อ/), "0812345678");
}

describe("ReportForm", () => {
  it("prefills details from the topic", () => {
    setup({ topicTitle: "ขอ Authen Code ไม่ได้" });
    expect(screen.getByLabelText(/^รายละเอียดปัญหา/)).toHaveValue("[หัวข้อ] ขอ Authen Code ไม่ได้\n");
  });

  it("shows field errors without losing typed input", async () => {
    setup();
    await userEvent.type(screen.getByLabelText(/รหัสหน่วยงาน 5 หลัก/), "123");
    await userEvent.click(screen.getByRole("button", { name: "สร้างข้อความ" }));
    const unit = screen.getByLabelText(/รหัสหน่วยงาน 5 หลัก/);
    expect(unit).toHaveValue("123");
    expect(unit).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("รหัสหน่วยงานต้องเป็นตัวเลข 5 หลัก")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("กรุณาตรวจสอบ");
    expect(screen.getByLabelText(/ชื่อ - สกุล ผู้แจ้ง/)).toHaveFocus();
  });

  it("generates the standard message and copies it", async () => {
    setup({ topicTitle: "พิมพ์สติกเกอร์ยาไม่ออก" });
    await fillReporter();
    await userEvent.type(screen.getByLabelText(/^รายละเอียดปัญหา/), "เครื่องไม่ตอบสนอง");
    await userEvent.click(screen.getByRole("button", { name: "สร้างข้อความ" }));
    const preview = screen.getByTestId("report-message");
    expect(preview).toHaveTextContent("ชื่อ - สกุล ผู้แจ้ง: สมใจ ใจดี");
    expect(preview).toHaveTextContent("รหัสหน่วยงาน 5 หลัก : 03562");
    expect(preview).toHaveTextContent("อีเมล : -");
    await userEvent.click(screen.getByRole("button", { name: "คัดลอกข้อความ" }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("[หัวข้อ] พิมพ์สติกเกอร์ยาไม่ออก"));
    expect(await screen.findByText("คัดลอกแล้ว")).toBeInTheDocument();
  });

  it("remembers reporter fields (not details) only when ticked", async () => {
    setup();
    await fillReporter();
    await userEvent.type(screen.getByLabelText(/^รายละเอียดปัญหา/), "ลับ");
    await userEvent.click(screen.getByLabelText(/จำข้อมูลผู้แจ้งไว้ในเครื่องนี้/));
    await userEvent.click(screen.getByRole("button", { name: "สร้างข้อความ" }));
    const saved = JSON.parse(localStorage.getItem(REPORTER_STORAGE_KEY)!);
    expect(saved).toMatchObject({ fullName: "สมใจ ใจดี", unitCode: "03562" });
    expect(saved.details).toBeUndefined();
  });

  it("restores remembered reporter fields and forgets them when unticked", async () => {
    localStorage.setItem(
      REPORTER_STORAGE_KEY,
      JSON.stringify({
        fullName: "จำไว้",
        position: "",
        unitCode: "",
        unitName: "",
        phone: "",
        email: "",
        anydesk: "",
      }),
    );
    setup();
    expect(screen.getByLabelText(/ชื่อ - สกุล ผู้แจ้ง/)).toHaveValue("จำไว้");
    const remember = screen.getByLabelText(/จำข้อมูลผู้แจ้งไว้ในเครื่องนี้/);
    expect(remember).toBeChecked();
    await userEvent.click(remember);
    expect(localStorage.getItem(REPORTER_STORAGE_KEY)).toBeNull();
  });

  it("selects the message for manual copy when the clipboard is blocked", async () => {
    writeText.mockRejectedValueOnce(new Error("denied"));
    setup();
    await fillReporter();
    await userEvent.type(screen.getByLabelText(/^รายละเอียดปัญหา/), "x");
    await userEvent.click(screen.getByRole("button", { name: "สร้างข้อความ" }));
    await userEvent.click(screen.getByRole("button", { name: "คัดลอกข้อความ" }));
    expect(await screen.findByText(/เลือกข้อความไว้ให้แล้ว/)).toBeInTheDocument();
    expect(window.getSelection()?.toString()).toContain("ชื่อ - สกุล ผู้แจ้ง");
  });
});
