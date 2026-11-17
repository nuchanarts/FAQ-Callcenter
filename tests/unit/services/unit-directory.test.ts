import { describe, expect, it } from "vitest";
import { findUnit } from "@/services/unit-directory";

describe("unit directory (MOPH registry)", () => {
  it("finds a unit by its 5-digit code with its location", () => {
    expect(findUnit("06157")).toEqual({
      code: "06157",
      name: "โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านดอนธรรม ตำบลใหม่พัฒนา",
      tambon: "ใหม่พัฒนา",
      amphoe: "เกาะคา",
      province: "ลำปาง",
      active: true,
    });
  });

  it("returns null for unknown or malformed codes", () => {
    expect(findUnit("00000")).toBeNull();
    expect(findUnit("6157")).toBeNull();
    expect(findUnit("06157x")).toBeNull();
  });
});
