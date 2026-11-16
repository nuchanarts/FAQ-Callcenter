import { expect, test } from "@playwright/test";

// Runs against the server started with DATA_BACKEND=failing (port 3101): every store call throws.
test.describe("US4 — works without a database (Constitution VII)", () => {
  test("home shows built-in topics and a notice", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("status").filter({ hasText: "กำลังแสดงเนื้อหาพื้นฐาน" })).toBeVisible();
    await expect(page.getByRole("region", { name: "3 ขั้นก่อนแจ้งปัญหา" })).toBeVisible();
    await page.getByRole("searchbox").fill("ออเทน");
    await page.getByRole("button", { name: /ขอ Authen Code ไม่ได้/ }).click();
    await expect(page.getByRole("link", { name: /ยังไม่ได้ — แจ้งทีม/ })).toBeVisible();
  });

  test("the topics API degrades instead of failing", async ({ request }) => {
    const res = await request.get("/api/topics");
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { degraded: boolean; topics: unknown[] };
    expect(body.degraded).toBe(true);
    expect(body.topics.length).toBeGreaterThan(0);
  });

  test("the report form still generates and copies the message", async ({ page }) => {
    await page.goto("/report?topic=b-login-agent");
    await expect(page.getByLabel(/^รายละเอียดปัญหา/)).toHaveValue(/ไม่พบ EHP Agent/);
    await page.getByLabel(/^ชื่อ - สกุล ผู้แจ้ง/).fill("ทดสอบ");
    await page.getByLabel(/^ตำแหน่งงาน/).fill("จพ.สาธารณสุข");
    await page.getByLabel(/^รหัสหน่วยงาน 5 หลัก/).fill("12345");
    await page.getByLabel(/^ชื่อหน่วยงาน/).fill("รพ.สต.ทดสอบ");
    await page.getByLabel(/^เบอร์ติดต่อ/).fill("0899999999");
    await page.getByRole("button", { name: "สร้างข้อความ" }).click();
    await expect(page.getByTestId("report-message")).toContainText("รหัสหน่วยงาน 5 หลัก : 12345");
    await page.getByRole("button", { name: "คัดลอกข้อความ" }).click();
    await expect(page.getByText("คัดลอกแล้ว", { exact: true })).toBeVisible();
  });
});
