import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const EXPECTED = [
  "ชื่อ - สกุล ผู้แจ้ง: สมใจ ใจดี",
  "ตำแหน่งงาน : พยาบาลวิชาชีพ",
  "รหัสหน่วยงาน 5 หลัก : 03562",
  "ชื่อหน่วยงาน : รพ.สต.บ้านตัวอย่าง",
  "เบอร์ติดต่อ : 081-234-5678",
  "อีเมล : -",
  "เลข AnyDesk : 123 456 789",
  "รายละเอียดปัญหา : [หัวข้อ] ขอ Authen Code ไม่ได้ / อ่านบัตรประชาชนไม่ได้\nเสียบบัตรแล้วไม่มีไฟ",
].join("\n");

async function fillReporter(page: Page) {
  await page.getByLabel(/^ชื่อ - สกุล ผู้แจ้ง/).fill("สมใจ ใจดี");
  await page.getByLabel(/^ตำแหน่งงาน/).fill("พยาบาลวิชาชีพ");
  await page.getByLabel(/^รหัสหน่วยงาน 5 หลัก/).fill("03562");
  await page.getByLabel(/^ชื่อหน่วยงาน/).fill("รพ.สต.บ้านตัวอย่าง");
  await page.getByLabel(/^เบอร์ติดต่อ/).fill("081-234-5678");
  await page.getByLabel(/^เลข AnyDesk/).fill("123 456 789");
}

test.describe("US2 — report with complete information", () => {
  test("'ยังไม่ได้' opens the prefilled form and produces the exact standard message", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("searchbox").fill("ออเทน");
    await page.getByRole("button", { name: /ขอ Authen Code ไม่ได้/ }).click();
    await page.getByRole("link", { name: /ยังไม่ได้ — แจ้งทีม/ }).click();
    await expect(page).toHaveURL(/\/report\?topic=b-authen-card/);

    const details = page.getByLabel(/^รายละเอียดปัญหา/);
    await expect(details).toHaveValue(/^\[หัวข้อ\] ขอ Authen Code ไม่ได้/);
    await fillReporter(page);
    await details.press("Control+End");
    await details.pressSequentially("เสียบบัตรแล้วไม่มีไฟ");
    await page.getByRole("button", { name: "สร้างข้อความ" }).click();

    await expect(page.getByTestId("report-message")).toBeVisible();
    expect(await page.getByTestId("report-message").innerText()).toBe(EXPECTED);
    await page.getByRole("button", { name: "คัดลอกข้อความ" }).click();
    await expect(page.getByText("คัดลอกแล้ว", { exact: true })).toBeVisible();
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    // Windows clipboard returns CRLF line endings; the app writes LF.
    expect(clipboard.replace(/\r\n/g, "\n")).toBe(EXPECTED);
  });

  test("validates required fields and keeps what was typed", async ({ page }) => {
    await page.goto("/report");
    await page.getByLabel(/^รหัสหน่วยงาน 5 หลัก/).fill("123");
    await page.getByRole("button", { name: "สร้างข้อความ" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "กรุณาตรวจสอบ" })).toBeVisible();
    await expect(page.getByText("รหัสหน่วยงานต้องเป็นตัวเลข 5 หลัก")).toBeVisible();
    await expect(page.getByLabel(/^รหัสหน่วยงาน 5 หลัก/)).toHaveValue("123");
    await expect(page.getByLabel(/^ชื่อ - สกุล ผู้แจ้ง/)).toBeFocused();
    await expect(page.getByTestId("report-message")).toHaveCount(0);
  });

  test("remembers reporter details on this device across reloads (not the problem)", async ({
    page,
  }) => {
    await page.goto("/report");
    await fillReporter(page);
    await page.getByLabel(/^รายละเอียดปัญหา/).fill("ข้อความลับ");
    await page.getByLabel(/จำข้อมูลผู้แจ้งไว้ในเครื่องนี้/).check();
    await page.getByRole("button", { name: "สร้างข้อความ" }).click();
    await expect(page.getByTestId("report-message")).toBeVisible();

    await page.reload();
    await expect(page.getByLabel(/^ชื่อ - สกุล ผู้แจ้ง/)).toHaveValue("สมใจ ใจดี");
    await expect(page.getByLabel(/^รายละเอียดปัญหา/)).toHaveValue("");
    await page.getByLabel(/จำข้อมูลผู้แจ้งไว้ในเครื่องนี้/).uncheck();
    await page.reload();
    await expect(page.getByLabel(/^ชื่อ - สกุล ผู้แจ้ง/)).toHaveValue("");
  });

  test("works from the header without a topic and passes accessibility checks", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "แจ้งปัญหา" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("แจ้งปัญหาถึงทีม Call Center");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = results.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? ""),
    );
    expect(serious.map((v) => [v.id, v.nodes[0]?.target])).toEqual([]);
  });
});
