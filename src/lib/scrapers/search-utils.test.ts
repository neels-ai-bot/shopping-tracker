import { describe, it, expect } from "vitest";
import { matchesQuery, scoreMatch } from "./search-utils";
import { ProductResult } from "@/types";

function makeProduct(overrides: Partial<ProductResult> = {}): ProductResult {
  return {
    name: "Tide Original Laundry Detergent",
    brand: "Tide",
    category: "Laundry Detergent",
    retailer: "walmart",
    price: 11.97,
    inStock: true,
    ...overrides,
  };
}

describe("matchesQuery", () => {
  it("matches when query word is in name", () => {
    expect(matchesQuery(makeProduct(), "tide")).toBe(true);
  });

  it("matches when query word is in brand", () => {
    expect(matchesQuery(makeProduct(), "tide")).toBe(true);
  });

  it("does not match completely unrelated query", () => {
    expect(matchesQuery(makeProduct(), "chocolate cake")).toBe(false);
  });

  it("matches partial multi-word query (threshold)", () => {
    // 2 words, threshold = 1, "detergent" matches name
    expect(matchesQuery(makeProduct(), "detergent xyz")).toBe(true);
  });

  it("returns true for empty query", () => {
    // empty query -> score returns 1 -> matchesQuery returns true
    expect(matchesQuery(makeProduct(), "")).toBe(true);
  });

  it("handles fuzzy matching (typo tolerance)", () => {
    // "tde" is edit distance 1 from "tide"
    expect(matchesQuery(makeProduct(), "tde")).toBe(true);
  });
});

describe("scoreMatch", () => {
  it("returns 1 for empty query", () => {
    expect(scoreMatch(makeProduct(), "")).toBe(1);
  });

  it("scores exact name word match at 10 + bonuses", () => {
    const score = scoreMatch(makeProduct(), "tide");
    // "tide" exact word in name: 10, all words matched: +20, phrase in name: +15, brand+name: +10
    expect(score).toBe(55);
  });

  it("scores substring match in name", () => {
    // "deter" is substring of "detergent" in name, not an exact word
    const score = scoreMatch(makeProduct(), "deter");
    expect(score).toBeGreaterThan(0);
  });

  it("returns 0 when below threshold", () => {
    // 3 words, threshold = 2, only 1 matches
    expect(scoreMatch(makeProduct(), "tide chocolate banana")).toBe(0);
  });

  it("gives all-words-matched bonus", () => {
    // "tide detergent" - both words match, gets all-words bonus (+20)
    const withBonus = scoreMatch(makeProduct(), "tide detergent");
    // "tide chocolate" - only "tide" matches (1/2 words meets threshold), no all-words bonus
    const withoutBonus = scoreMatch(makeProduct(), "tide chocolate");
    expect(withBonus).toBeGreaterThan(withoutBonus);
  });

  it("gives consecutive phrase bonus", () => {
    // "laundry detergent" appears consecutively in name
    const consecutive = scoreMatch(makeProduct(), "laundry detergent");
    // "detergent laundry" - both words match but not consecutive
    const nonConsecutive = scoreMatch(makeProduct(), "detergent laundry");
    expect(consecutive).toBeGreaterThan(nonConsecutive);
  });

  it("scores category match lower than name match", () => {
    const product = makeProduct({
      name: "Some Product",
      brand: "SomeBrand",
      category: "Cleaning Supplies",
    });
    const catScore = scoreMatch(product, "cleaning");
    // Category exact word = 3, all-words: +20 = 23
    expect(catScore).toBe(23);
  });

  it("scores fuzzy match lower than exact", () => {
    const exact = scoreMatch(makeProduct(), "tide");
    // "tde" fuzzy matches name word "tide" (distance 1)
    const fuzzy = scoreMatch(makeProduct(), "tde");
    expect(fuzzy).toBeGreaterThan(0);
    expect(fuzzy).toBeLessThan(exact);
  });

  it("handles product with missing fields", () => {
    const product = makeProduct({
      name: "Mystery Item",
      brand: undefined,
      category: undefined,
    });
    const score = scoreMatch(product, "mystery");
    expect(score).toBeGreaterThan(0);
  });
});
