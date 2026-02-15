import { describe, it, expect } from "vitest";
import { cn, formatPrice, formatUnitPrice } from "./utils";

describe("formatPrice", () => {
  it("formats a whole dollar amount", () => {
    expect(formatPrice(5)).toBe("$5.00");
  });

  it("formats cents correctly", () => {
    expect(formatPrice(3.5)).toBe("$3.50");
  });

  it("formats zero", () => {
    expect(formatPrice(0)).toBe("$0.00");
  });

  it("rounds to two decimals", () => {
    expect(formatPrice(1.999)).toBe("$2.00");
  });

  it("handles large prices", () => {
    expect(formatPrice(1234.56)).toBe("$1,234.56");
  });

  it("handles negative prices", () => {
    expect(formatPrice(-3.5)).toBe("-$3.50");
  });
});

describe("formatUnitPrice", () => {
  it("appends /oz suffix", () => {
    expect(formatUnitPrice(0.08)).toBe("$0.08/oz");
  });

  it("formats zero unit price", () => {
    expect(formatUnitPrice(0)).toBe("$0.00/oz");
  });

  it("formats larger unit price", () => {
    expect(formatUnitPrice(1.25)).toBe("$1.25/oz");
  });
});

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles tailwind conflicts by keeping last", () => {
    expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
  });

  it("handles falsy values", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });
});
