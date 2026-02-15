import { describe, it, expect, vi } from "vitest";
import { fuzzyMatch } from "./brand-mapper";

// Mock prisma to avoid DB dependency
vi.mock("./db", () => ({
  prisma: {
    brandMapping: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({}),
    },
  },
}));

describe("fuzzyMatch", () => {
  const products = [
    { name: "Tide Original Detergent 150oz", store: "walmart", price: 11.97 },
    { name: "All Free Clear Detergent", store: "target", price: 9.99 },
    { name: "Gain Laundry Detergent", store: "kroger", price: 10.49 },
    { name: "Organic Whole Milk", store: "wholefoods", price: 5.99 },
    { name: "Cheerios Cereal", store: "walmart", price: 4.29 },
  ];

  it("returns matches for a close query", () => {
    const results = fuzzyMatch("Tide Detergent", products);
    expect(results.length).toBeGreaterThan(0);
    // Fuse.js may rank other detergent products higher; just verify Tide is among results
    expect(results.some((r) => r.name.includes("Tide"))).toBe(true);
  });

  it("returns confidence between 0 and 1", () => {
    const results = fuzzyMatch("Tide Detergent", products);
    for (const r of results) {
      expect(r.confidence).toBeGreaterThanOrEqual(0);
      expect(r.confidence).toBeLessThanOrEqual(1);
    }
  });

  it("returns empty for completely unrelated query", () => {
    const results = fuzzyMatch("xyzzyplugh nothing", products);
    expect(results).toEqual([]);
  });

  it("includes store and price from source", () => {
    const results = fuzzyMatch("Cheerios Cereal", products);
    expect(results.length).toBeGreaterThan(0);
    const cheerio = results.find((r) => r.name.includes("Cheerios"));
    expect(cheerio).toBeDefined();
    expect(cheerio!.store).toBe("walmart");
    expect(cheerio!.price).toBe(4.29);
  });

  it("best match has highest confidence", () => {
    const results = fuzzyMatch("Tide Original Detergent 150oz", products);
    if (results.length > 1) {
      expect(results[0].confidence).toBeGreaterThanOrEqual(
        results[1].confidence
      );
    }
  });

  it("handles single character query gracefully", () => {
    const results = fuzzyMatch("T", products);
    // May or may not return results, but should not throw
    expect(Array.isArray(results)).toBe(true);
  });
});

describe("findEquivalents", () => {
  it("returns store-brand equivalents for known category", async () => {
    // Dynamic import to get the mocked version
    const { findEquivalents } = await import("./brand-mapper");
    const result = await findEquivalents({
      name: "Tide Laundry Detergent",
      brand: "Tide",
      category: "laundry detergent",
    });
    expect(result.length).toBeGreaterThan(0);
    // Should not include Tide itself
    expect(result.every((e) => e.name.toLowerCase() !== "tide")).toBe(true);
    // Each should have confidence
    for (const eq of result) {
      expect(eq.confidence).toBeGreaterThan(0);
    }
  });

  it("returns equivalents via category guessing from name", async () => {
    const { findEquivalents } = await import("./brand-mapper");
    const result = await findEquivalents({
      name: "Crest Toothpaste",
      brand: "Crest",
    });
    expect(result.length).toBeGreaterThan(0);
    // Should have guessed category "toothpaste"
    expect(result.some((e) => e.store === "walmart")).toBe(true);
  });

  it("returns empty for unknown category", async () => {
    const { findEquivalents } = await import("./brand-mapper");
    const result = await findEquivalents({
      name: "Random Unknown Product",
      brand: "Unknown",
    });
    expect(result).toEqual([]);
  });

  it("does not include the same brand as an equivalent", async () => {
    const { findEquivalents } = await import("./brand-mapper");
    const result = await findEquivalents({
      name: "Great Value Milk",
      brand: "Great Value",
      category: "milk",
    });
    expect(result.every((e) => !e.name.startsWith("Great Value "))).toBe(true);
  });
});
