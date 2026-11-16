import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("US1 — viewer searches and solves a problem (no sign-in)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("shows the 3 basic steps above the topics without scrolling", async ({ page }) => {
    const steps = page.getByRole("region", { name: "3 ขั้นก่อนแจ้งปัญหา" });
    await expect(steps).toBeVisible();
    await expect(steps.getByRole("listitem")).toHaveCount(3);
    const box = await steps.boundingBox();
    expect(box!.y).toBeLessThan(page.viewportSize()!.height);
  });

  test("finds a topic by colloquial keyword and shows its steps", async ({ page }) => {
    const wide = page.viewportSize()!.width >= 1280;
    const search = page.getByRole("searchbox");
    await search.fill("ออเทน");
    await expect(page.getByText("พบ 1 หัวข้อ")).toBeVisible();
    const toggle = page.getByRole("button", { name: /ขอ Authen Code ไม่ได้/ });
    await expect(page.getByText("ทำเองได้บางส่วน").first()).toBeVisible();
    await toggle.click();
    if (wide) {
      // Wide screens: the topic is selected and its answer shows beside the list.
      await expect(toggle).toHaveAttribute("aria-current", "true");
      await expect(page.getByRole("region", { name: /ขอ Authen Code ไม่ได้/ })).toBeVisible();
    } else {
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
    }
    await expect(page.getByRole("list").filter({ hasText: "ถอดบัตรออก" })).toBeVisible();
    await expect(page.locator("aside:visible").filter({ hasText: "ถ้ายังไม่ได้" })).toBeVisible();
    await expect(page.getByRole("link", { name: /ยังไม่ได้ — แจ้งทีม/ })).toHaveAttribute(
      "href",
      /\/report\?topic=b-authen-card/,
    );
    if (!wide) {
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
    }
  });

  test("wide screens show the first answer without clicking", async ({ page }) => {
    test.skip(page.viewportSize()!.width < 1280, "side-by-side layout is for ≥ 1280 px");
    await expect(page.getByRole("button", { name: /เข้าระบบแล้วหน้าจอขาว/ })).toHaveAttribute(
      "aria-current",
      "true",
    );
    await expect(page.getByRole("region", { name: /เข้าระบบแล้วหน้าจอขาว/ })).toBeVisible();
  });

  test("filters by category and shows counts", async ({ page }) => {
    const chip = page
      .getByRole("group", { name: "หมวดปัญหา" })
      .getByRole("button", { name: /การพิมพ์/ });
    await chip.click();
    await expect(chip).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("พบ 2 หัวข้อ")).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(2);
  });

  test("shows a helpful empty state", async ({ page }) => {
    await page.getByRole("searchbox").fill("คำที่ไม่มีอยู่จริงแน่นอน");
    await expect(page.getByText("ไม่พบหัวข้อที่ตรงกับคำค้น")).toBeVisible();
    await expect(page.getByRole("link", { name: "ไปที่แบบฟอร์มแจ้งปัญหา" })).toBeVisible();
  });

  test("supports '/' to focus search", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "keyboard shortcut is a desktop feature");
    await page.locator("body").press("/");
    await expect(page.getByRole("searchbox")).toBeFocused();
  });

  test("has no horizontal scroll and no serious accessibility violations", async ({ page }) => {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = results.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? ""),
    );
    expect(
      serious,
      JSON.stringify(
        serious.map((v) => [v.id, v.nodes[0]?.target]),
        null,
        2,
      ),
    ).toEqual([]);
  });

  test("search results update quickly (Constitution XI)", async ({ page }) => {
    const search = page.getByRole("searchbox");
    const start = Date.now();
    await search.fill("สติกเกอร์ยา");
    await expect(page.getByText("พบ 2 หัวข้อ")).toBeVisible();
    expect(Date.now() - start).toBeLessThan(500);
  });
});
