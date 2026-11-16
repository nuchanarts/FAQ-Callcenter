import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page, next = "/admin") {
  await page.goto(next);
  await expect(page).toHaveURL(/\/login\?next=/);
  await page.getByLabel(/^อีเมล/).fill("admin@bgs.local");
  await page.getByLabel(/^รหัสผ่าน/).fill("Admin#2026");
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

function row(page: Page, title: RegExp | string) {
  return page.getByRole("row").filter({ hasText: title });
}

test.describe("US3 — admin edits content reversibly", () => {
  test("signed-out visitors are sent to sign-in; viewers see no edit controls", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "จัดการเนื้อหา" })).toHaveCount(0);
    await page.goto("/admin/topics/new");
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Ftopics%2Fnew/);
  });

  test("wrong credentials show a generic message", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/^อีเมล/).fill("admin@bgs.local");
    await page.getByLabel(/^รหัสผ่าน/).fill("wrong-password");
    await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" })).toBeVisible();
  });

  test("edit a built-in topic → viewers see it → restore the original", async ({ page }) => {
    await signIn(page, "/admin/topics/b-print-sticker");
    const title = page.getByLabel(/^คำถาม \/ อาการ/);
    await title.fill("เครื่องพิมพ์สติกเกอร์ไม่ทำงาน (แก้ไข)");
    await page.getByRole("button", { name: "บันทึกและเผยแพร่" }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(row(page, "(แก้ไข)").getByText("แก้ไขแล้ว")).toBeVisible();

    await page.goto("/");
    await expect(
      page.getByRole("button", { name: /เครื่องพิมพ์สติกเกอร์ไม่ทำงาน \(แก้ไข\)/ }),
    ).toBeVisible();

    await page.goto("/admin");
    await row(page, "(แก้ไข)")
      .getByRole("button", { name: /คืนค่าเดิม/ })
      .click();
    await page.getByRole("dialog").getByRole("button", { name: "คืนค่าเดิม" }).click();
    await expect(row(page, "พิมพ์สติกเกอร์ยาไม่ออก").getByText("ต้นฉบับ")).toBeVisible();
    await page.goto("/");
    await expect(page.getByRole("button", { name: /พิมพ์สติกเกอร์ยาไม่ออก/ })).toBeVisible();
  });

  test("hide and show a topic", async ({ page }) => {
    await signIn(page);
    const target = row(page, "ค้นหารหัสโรค");
    await target.getByRole("button", { name: /^ซ่อน/ }).click();
    await expect(target.getByText("ซ่อนอยู่")).toBeVisible();
    await page.goto("/");
    await expect(page.getByRole("button", { name: /ค้นหารหัสโรค/ })).toHaveCount(0);
    await page.goto("/admin");
    await row(page, "ค้นหารหัสโรค").getByRole("button", { name: /^แสดง/ }).click();
    await expect(row(page, "ค้นหารหัสโรค").getByText("ซ่อนอยู่")).toHaveCount(0);
  });

  test("create a custom topic: https-only links, HTML is escaped, delete needs two confirmations", async ({
    page,
  }) => {
    await signIn(page, "/admin/topics/new");
    await page.getByLabel(/^คำถาม \/ อาการ/).fill("ทดสอบ E2E <b>ตัวหนา</b>");
    await page.getByLabel(/^หมวด/).selectOption("finance");
    await page.getByRole("radio", { name: /ต้องแจ้งทีม/ }).check();
    await page.getByLabel(/^คำค้นเพิ่มเติม/).fill("e2eคำค้น");
    await page.getByLabel(/^วิธีแก้/).fill("1. กด <script>alert(1)</script>\n> ถ้ายังไม่ได้ แจ้งทีม");
    await page.getByRole("button", { name: "เพิ่มลิงก์" }).click();
    await page.getByLabel(/^ชื่อที่แสดง/).fill("คู่มือ");
    await page.getByLabel(/^ลิงก์/).fill("http://insecure.example");
    await page.getByRole("button", { name: "บันทึกและเผยแพร่" }).click();
    await expect(page.getByText("ลิงก์ต้องขึ้นต้นด้วย https:// เท่านั้น")).toBeVisible();

    await page.getByLabel(/^ลิงก์/).fill("https://example.com/manual.pdf");
    await page.getByRole("button", { name: "บันทึกและเผยแพร่" }).click();
    await expect(page).toHaveURL(/\/admin$/);

    let dialogs = 0;
    page.on("dialog", () => dialogs++);
    await page.goto("/");
    await page.getByRole("searchbox").fill("e2eคำค้น");
    await page.getByRole("button", { name: /ทดสอบ E2E/ }).click();
    await expect(page.getByText("ทดสอบ E2E <b>ตัวหนา</b>")).toBeVisible();
    await expect(page.getByText("กด <script>alert(1)</script>")).toBeVisible();
    await expect(page.getByRole("link", { name: /คู่มือ/ })).toHaveAttribute(
      "href",
      "https://example.com/manual.pdf",
    );
    expect(dialogs).toBe(0);

    await page.goto("/admin");
    const custom = row(page, "ทดสอบ E2E");
    await custom.getByRole("button", { name: /^ลบ/ }).click();
    await page.getByRole("dialog").getByRole("button", { name: "ลบ" }).click();
    await expect(page.getByRole("dialog")).toContainText("ยืนยันอีกครั้ง");
    await page.getByRole("dialog").getByRole("button", { name: "ลบถาวร" }).click();
    await expect(row(page, "ทดสอบ E2E")).toHaveCount(0);
  });

  test("built-in topics have no delete action", async ({ page }) => {
    await signIn(page);
    await expect(row(page, "พิมพ์ใบเสร็จ").getByRole("button", { name: /^ลบ/ })).toHaveCount(0);
  });

  test("sign out ends the session", async ({ page }) => {
    await signIn(page);
    await page.getByRole("button", { name: "ออกจากระบบ" }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });
});
