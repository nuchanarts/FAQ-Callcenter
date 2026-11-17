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
  await userEvent.type(screen.getByLabelText(/เลข AnyDesk/), "123456789");
}

describe("ReportForm", () => {
  it("suggests public-health positions but accepts any typed title", async () => {
    setup();
    const position = screen.getByLabelText(/ตำแหน่งงาน/);
    expect(position).toHaveAttribute("list", "position-options");
    expect(document.querySelectorAll("#position-options option").length).toBeGreaterThan(10);
    await userEvent.type(position, "ตำแหน่งอื่น");
    expect(position).toHaveValue("ตำแหน่งอื่น");
  });

  it("prefills details from the topic", () => {
    setup({ topicTitle: "ขอ Authen Code ไม่ได้" });
    expect(screen.getByLabelText(/^รายละเอียดปัญหา/)).toHaveValue("[หัวข้อ] ขอ Authen Code ไม่ได้\n");
  });

  it("shows a live draft of the message while typing, without a copy button", async () => {
    setup({ topicTitle: "พิมพ์สติกเกอร์ยาไม่ออก" });
    const draft = screen.getByTestId("report-draft");
    expect(draft).toHaveTextContent("ชื่อ - สกุล ผู้แจ้ง: …");
    await userEvent.type(screen.getByLabelText(/ชื่อ - สกุล ผู้แจ้ง/), "สมใจ");
    expect(screen.getByTestId("report-draft")).toHaveTextContent("ชื่อ - สกุล ผู้แจ้ง: สมใจ");
    expect(screen.queryByRole("button", { name: "คัดลอกข้อความ" })).toBeNull();
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

  async function generateForLine() {
    setup();
    await fillReporter();
    await userEvent.type(screen.getByLabelText(/^รายละเอียดปัญหา/), "เครื่องไม่ตอบสนอง");
    await userEvent.click(screen.getByRole("button", { name: "สร้างข้อความ" }));
    return screen.getByRole("link", { name: /เปิด LINE พร้อมข้อความ/ });
  }

  it("on a PC opens the LINE app (line://) with the message, copies it, and shows the steps", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const link = await generateForLine();
    expect(screen.queryByText("เปิด LINE พร้อมข้อความแล้ว ✓")).toBeNull();

    await userEvent.click(link);
    const [url, target] = open.mock.calls[0]!;
    expect(target).toBe("_self");
    expect(String(url).startsWith("line://oaMessage/%40977tcqko/?")).toBe(true);
    expect(decodeURIComponent(String(url).split("?")[1]!)).toContain("เครื่องไม่ตอบสนอง");
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("เครื่องไม่ตอบสนอง"));
    expect(await screen.findByText("เปิด LINE พร้อมข้อความแล้ว ✓")).toBeInTheDocument();
    expect(screen.getByText(/กด Ctrl \+ V/)).toBeInTheDocument();
    expect(screen.queryByText("เปิดผ่านเว็บ LINE แทน")).toBeNull();
    expect(screen.getByRole("link", { name: "หรือกดเพิ่มเพื่อนที่นี่" })).toHaveAttribute(
      "href",
      "https://line.me/R/ti/p/%40977tcqko",
    );
    open.mockRestore();
  });

  it("on a phone opens the line.me link (which hands off to the LINE app)", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const ua = vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (iPhone)");
    await userEvent.click(await generateForLine());
    expect(String(open.mock.calls[0]![0]).startsWith("https://line.me/R/oaMessage/")).toBe(true);
    expect(open.mock.calls[0]![1]).toBe("_blank");
    open.mockRestore();
    ua.mockRestore();
  });

  it("fills the unit name from a 5-digit unit code, keeping it editable", async () => {
    const unit = {
      code: "06157",
      name: "รพ.สต.บ้านดอนธรรม",
      tambon: "ใหม่พัฒนา",
      amphoe: "เกาะคา",
      province: "ลำปาง",
      active: true,
    };
    const fetchMock = vi.fn(async (url: string) =>
      url.endsWith("/06157")
        ? Response.json(unit)
        : Response.json({ error: "not_found" }, { status: 404 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    setup();
    await userEvent.type(screen.getByLabelText(/รหัสหน่วยงาน 5 หลัก/), "06157");
    expect(await screen.findByText(/พบหน่วยงาน/)).toBeInTheDocument();
    expect(screen.getByText(/อ.เกาะคา จ.ลำปาง/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^ชื่อหน่วยงาน/)).toHaveValue("รพ.สต.บ้านดอนธรรม");
    expect(fetchMock).toHaveBeenCalledWith("/api/units/06157");

    const code = screen.getByLabelText(/รหัสหน่วยงาน 5 หลัก/);
    // Removing the code removes the name we filled in.
    await userEvent.clear(code);
    expect(screen.getByLabelText(/^ชื่อหน่วยงาน/)).toHaveValue("");

    await userEvent.type(code, "99998");
    expect(await screen.findByText(/ไม่พบรหัสนี้/)).toBeInTheDocument();

    // A name the caller typed is never cleared.
    await userEvent.type(screen.getByLabelText(/^ชื่อหน่วยงาน/), "พิมพ์เอง");
    await userEvent.clear(code);
    expect(screen.getByLabelText(/^ชื่อหน่วยงาน/)).toHaveValue("พิมพ์เอง");
    vi.unstubAllGlobals();
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
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
