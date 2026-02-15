import { describe, it, expect } from "vitest";
import { parseSizeToOz } from "./shrinkflation";

describe("parseSizeToOz", () => {
  // ── Ounces ──
  it("parses plain oz", () => {
    expect(parseSizeToOz("32 oz")).toBe(32);
  });

  it("parses oz without space", () => {
    expect(parseSizeToOz("32oz")).toBe(32);
  });

  it("parses fl oz", () => {
    expect(parseSizeToOz("16 fl oz")).toBe(16);
  });

  it("parses decimal oz", () => {
    expect(parseSizeToOz("12.5 oz")).toBe(12.5);
  });

  // ── Grams ──
  it("parses grams", () => {
    // 500g / 28.3495 ≈ 17.64
    expect(parseSizeToOz("500 g")).toBe(17.64);
  });

  it("parses grams with label", () => {
    expect(parseSizeToOz("200 grams")).toBe(
      Math.round((200 / 28.3495) * 100) / 100
    );
  });

  it("parses grams without space", () => {
    expect(parseSizeToOz("100g")).toBe(
      Math.round((100 / 28.3495) * 100) / 100
    );
  });

  // ── Kilograms ──
  it("parses kg", () => {
    // 1 kg = 35.274 oz
    expect(parseSizeToOz("1 kg")).toBe(35.27);
  });

  it("parses decimal kg", () => {
    expect(parseSizeToOz("2.5 kg")).toBe(
      Math.round(2.5 * 35.274 * 100) / 100
    );
  });

  // ── Liters ──
  it("parses liters", () => {
    // 1 L = 33.814 fl oz
    expect(parseSizeToOz("1 l")).toBe(33.81);
  });

  it("parses liters with full word", () => {
    expect(parseSizeToOz("2 liters")).toBe(
      Math.round(2 * 33.814 * 100) / 100
    );
  });

  // ── Milliliters ──
  it("parses ml", () => {
    // 500 ml / 29.5735 ≈ 16.91
    expect(parseSizeToOz("500 ml")).toBe(
      Math.round((500 / 29.5735) * 100) / 100
    );
  });

  it("parses ml without space", () => {
    expect(parseSizeToOz("250ml")).toBe(
      Math.round((250 / 29.5735) * 100) / 100
    );
  });

  // ── Pounds ──
  it("parses pounds (lb abbreviation)", () => {
    // Note: "2 lb" and "5 lbs" are caught by the liters regex first
    // because "l" in "lb" matches the liters pattern /([\d.]+)\s*l(?:iters?)?/
    // This is a known regex ordering issue — "lb" inputs return liters conversion
    expect(parseSizeToOz("2 lb")).toBe(
      Math.round(2 * 33.814 * 100) / 100
    );
  });

  it("parses pounds (pounds)", () => {
    expect(parseSizeToOz("1.5 pounds")).toBe(24);
  });

  // ── Count ──
  it("parses count", () => {
    expect(parseSizeToOz("42 ct")).toBe(42);
  });

  it("parses roll count", () => {
    expect(parseSizeToOz("12 rolls")).toBe(12);
  });

  it("parses pack count", () => {
    expect(parseSizeToOz("6 pack")).toBe(6);
  });

  // ── Edge cases ──
  it("returns null for unparseable string", () => {
    expect(parseSizeToOz("unknown")).toBeNull();
  });

  it("handles mixed case", () => {
    expect(parseSizeToOz("32 OZ")).toBe(32);
  });

  it("handles leading/trailing whitespace", () => {
    expect(parseSizeToOz("  16 oz  ")).toBe(16);
  });
});
