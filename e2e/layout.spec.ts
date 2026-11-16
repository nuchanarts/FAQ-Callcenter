import { expect, test, type Page } from "@playwright/test";

async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

test.describe("Every screen fits the viewport (FR-021, 360 px+)", () => {
  for (const path of ["/", "/report", "/guide", "/login"]) {
    test(`${path} has no horizontal scroll`, async ({ page }) => {
      await page.goto(path);
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    });
  }

  test("expanded topics with long menu paths still fit", async ({ page }) => {
    await page.goto("/?q=sso");
    await page.getByRole("button", { name: /ไม่มีสิทธิ์ใช้งานหน่วยบริการนี้/ }).click();
    await expect(page.getByText("Setting › Organization › ผู้ใช้งาน")).toBeVisible();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });

  test("signed-in admin screens have no horizontal scroll", async ({ page }) => {
    await page.goto("/login?next=/admin");
    await page.getByLabel(/^อีเมล/).fill("admin@bgs.local");
    await page.getByLabel(/^รหัสผ่าน/).fill("Admin#2026");
    await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "จัดการเนื้อหา" })).toBeVisible();
    for (const path of [
      "/admin",
      "/admin/topics/new",
      "/admin/topics/b-login-sso",
      "/",
      "/guide",
    ]) {
      await page.goto(path);
      expect(await horizontalOverflow(page), path).toBeLessThanOrEqual(0);
    }
  });
});
