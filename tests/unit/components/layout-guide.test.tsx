// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Search } from "lucide-react";

let pathname = "/report";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

const { NavLinks } = await import("@/components/features/layout/nav-links");
const { GuideSteps } = await import("@/components/features/guide/guide-steps");

describe("NavLinks", () => {
  it("marks the current page and hides admin for viewers", () => {
    render(<NavLinks isAdmin={false} />);
    expect(screen.getByRole("link", { name: "แจ้งปัญหา" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "หน้าหลัก" })).not.toHaveAttribute("aria-current");
    expect(screen.queryByRole("link", { name: "จัดการเนื้อหา" })).toBeNull();
  });

  it("shows the admin link for admins and matches nested admin paths", () => {
    pathname = "/admin/topics/new";
    render(<NavLinks isAdmin />);
    expect(screen.getByRole("link", { name: "จัดการเนื้อหา" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});

describe("GuideSteps", () => {
  it("renders numbered steps", () => {
    render(
      <GuideSteps
        steps={[
          { title: "ค้นหา", body: "พิมพ์" },
          { title: "อ่าน", body: "ทำตาม" },
        ]}
        icons={[Search]}
      />,
    );
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("1ค้นหาพิมพ์");
  });
});
