import { describe, it, expect } from "vitest";
import {
  getAvailableRetailers,
  retailerDisplayName,
  retailerColor,
  retailerTextColor,
} from "./retailer-config";

describe("getAvailableRetailers", () => {
  it("returns only national retailers when no state given", () => {
    const retailers = getAvailableRetailers();
    expect(retailers).toContain("walmart");
    expect(retailers).toContain("target");
    expect(retailers).toContain("amazon");
    expect(retailers).toContain("costco");
    expect(retailers).toContain("kroger");
    expect(retailers).toContain("wholefoods");
    expect(retailers).toContain("traderjoes");
    // Should not include regional retailers
    expect(retailers).not.toContain("heb");
    expect(retailers).not.toContain("publix");
  });

  it("includes H-E-B for Texas", () => {
    const retailers = getAvailableRetailers("TX");
    expect(retailers).toContain("heb");
    expect(retailers).toContain("walmart"); // still has national
  });

  it("excludes H-E-B for non-Texas state", () => {
    const retailers = getAvailableRetailers("NY");
    expect(retailers).not.toContain("heb");
  });

  it("includes Publix for Florida", () => {
    const retailers = getAvailableRetailers("FL");
    expect(retailers).toContain("publix");
  });

  it("includes Wegmans for New York", () => {
    const retailers = getAvailableRetailers("NY");
    expect(retailers).toContain("wegmans");
  });

  it("includes Aldi for Illinois", () => {
    const retailers = getAvailableRetailers("IL");
    expect(retailers).toContain("aldi");
  });

  it("is case insensitive", () => {
    const retailers = getAvailableRetailers("tx");
    expect(retailers).toContain("heb");
  });
});

describe("retailerDisplayName", () => {
  it("returns display name for known retailer", () => {
    expect(retailerDisplayName("walmart")).toBe("Walmart");
    expect(retailerDisplayName("wholefoods")).toBe("Whole Foods");
    expect(retailerDisplayName("heb")).toBe("H-E-B");
    expect(retailerDisplayName("traderjoes")).toBe("Trader Joe's");
  });

  it("returns raw string for unknown retailer", () => {
    expect(retailerDisplayName("unknown")).toBe("unknown");
  });
});

describe("retailerColor", () => {
  it("returns color class for known retailer", () => {
    expect(retailerColor("walmart")).toBe("bg-blue-600");
    expect(retailerColor("target")).toBe("bg-red-600");
  });

  it("returns fallback for unknown retailer", () => {
    expect(retailerColor("unknown")).toBe("bg-gray-500");
  });
});

describe("retailerTextColor", () => {
  it("returns text color class for known retailer", () => {
    expect(retailerTextColor("walmart")).toBe("text-blue-600");
  });

  it("returns fallback for unknown retailer", () => {
    expect(retailerTextColor("unknown")).toBe("text-gray-500");
  });
});
