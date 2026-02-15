import { describe, it, expect } from "vitest";
import { search, lookupByUpc } from "./walmart";

// These tests use the mock-catalog fallback (no WALMART_API_KEY in env)

describe("walmart search (mock catalog)", () => {
  it("returns results for a matching query", async () => {
    const results = await search("tide detergent");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].retailer).toBe("walmart");
  });

  it("each result has required fields", async () => {
    const results = await search("milk");
    for (const r of results) {
      expect(r.name).toBeTruthy();
      expect(r.retailer).toBe("walmart");
      expect(r.price).toBeGreaterThan(0);
      expect(r.inStock).toBe(true);
    }
  });

  it("returns empty array for no matches", async () => {
    const results = await search("xyzzy nonexistent product 12345");
    expect(results).toEqual([]);
  });

  it("applies regional pricing when region provided", async () => {
    const baseResults = await search("tide detergent");
    const nyResults = await search("tide detergent", "NY");
    if (baseResults.length > 0 && nyResults.length > 0) {
      // NY has multiplier 1.15, so prices should be higher
      expect(nyResults[0].price).toBeGreaterThan(baseResults[0].price);
    }
  });

  it("returns results with correct product structure", async () => {
    const results = await search("paper towels");
    if (results.length > 0) {
      const r = results[0];
      expect(r).toHaveProperty("name");
      expect(r).toHaveProperty("retailer");
      expect(r).toHaveProperty("price");
      expect(r).toHaveProperty("inStock");
    }
  });
});

describe("lookupByUpc", () => {
  it("finds a product by known UPC", async () => {
    // This UPC is from the mock catalog (Tide Original)
    const result = await lookupByUpc("037000764113");
    expect(result).not.toBeNull();
    expect(result!.name).toContain("Tide");
    expect(result!.retailer).toBe("walmart");
  });

  it("returns null for unknown UPC", async () => {
    const result = await lookupByUpc("000000000000");
    expect(result).toBeNull();
  });

  it("returned product has price", async () => {
    const result = await lookupByUpc("037000764113");
    expect(result).not.toBeNull();
    expect(result!.price).toBeGreaterThan(0);
  });
});
