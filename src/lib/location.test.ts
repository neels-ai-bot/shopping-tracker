import { describe, it, expect } from "vitest";
import { getRegionalMultiplier, applyRegionalPricing } from "./location";

describe("getRegionalMultiplier", () => {
  it("returns correct multiplier for expensive state (NY)", () => {
    expect(getRegionalMultiplier("NY")).toBe(1.15);
  });

  it("returns correct multiplier for cheap state (MS)", () => {
    expect(getRegionalMultiplier("MS")).toBe(0.92);
  });

  it("returns 1.0 for unknown state", () => {
    expect(getRegionalMultiplier("ZZ")).toBe(1.0);
  });

  it("is case insensitive", () => {
    expect(getRegionalMultiplier("ca")).toBe(1.12);
    expect(getRegionalMultiplier("Ca")).toBe(1.12);
  });
});

describe("applyRegionalPricing", () => {
  it("increases price in expensive state", () => {
    // 10.00 * 1.15 = 11.50
    expect(applyRegionalPricing(10.0, "NY")).toBe(11.5);
  });

  it("decreases price in cheap state", () => {
    // 10.00 * 0.92 = 9.20
    expect(applyRegionalPricing(10.0, "MS")).toBe(9.2);
  });

  it("rounds to nearest cent", () => {
    // 9.99 * 1.15 = 11.4885 -> 11.49
    expect(applyRegionalPricing(9.99, "NY")).toBe(11.49);
  });

  it("returns base price for unknown state", () => {
    expect(applyRegionalPricing(10.0, "ZZ")).toBe(10.0);
  });
});
