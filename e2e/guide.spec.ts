import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("US5 — วิธีใช้งาน guide", () => {
  test("viewers reach the guide from the header and see the viewer section only", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "วิธีใช้งาน" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("วิธีใช้งาน");
    await expect(page.getByRole("heading", { name: "สำหรับเจ้าหน้าที่ รพ.สต." })).toBeVisible();
    await expect(
      page.getByRole("region", { name: "สำหรับเจ้าหน้าที่ รพ.สต." }).getByRole("listitem"),
    ).toHaveCount(5);
    await expect(page.getByRole("heading", { name: "สำหรับผู้ดูแลเนื้อหา" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "ปุ่มลัด" })).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = results.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? ""),
    );
    expect(serious.map((v) => [v.id, v.nodes[0]?.target])).toEqual([]);
  });

  test("signed-in admins also see the admin section", async ({ page }) => {
    await page.goto("/login?next=/guide");
    await page.getByLabel(/^อีเมล/).fill("editor@bgs.local");
    await page.getByLabel(/^รหัสผ่าน/).fill("Editor#2026");
    await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
    await expect(page).toHaveURL(/\/guide$/);
    await expect(page.getByRole("heading", { name: "สำหรับผู้ดูแลเนื้อหา" })).toBeVisible();
  });

  test("the call to action returns to search", async ({ page }) => {
    await page.goto("/guide");
    await page.getByRole("link", { name: "เริ่มค้นหาปัญหา" }).click();
    await expect(page.getByRole("searchbox")).toBeVisible();
  });
});
