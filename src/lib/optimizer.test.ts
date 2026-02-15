import { describe, it, expect } from "vitest";
import { optimizeList } from "./optimizer";
import { RetailerPrice } from "@/types";

function makePrice(
  retailer: RetailerPrice["retailer"],
  price: number,
  inStock = true
): RetailerPrice {
  return { retailer, price, inStock };
}

describe("optimizeList", () => {
  it("returns empty array for empty list", () => {
    expect(optimizeList([])).toEqual([]);
  });

  it("builds single-store routes for each retailer with stock", () => {
    const items = [
      {
        name: "Milk",
        quantity: 1,
        prices: [makePrice("walmart", 3.0), makePrice("target", 3.5)],
      },
    ];
    const routes = optimizeList(items, 5.0);
    const singleStoreRoutes = routes.filter(
      (r) => r.strategy === "single-store"
    );
    expect(singleStoreRoutes.length).toBeGreaterThanOrEqual(2);
  });

  it("calculates single-store cost correctly", () => {
    const items = [
      {
        name: "Milk",
        quantity: 2,
        prices: [makePrice("walmart", 3.0)],
      },
    ];
    const routes = optimizeList(items, 5.0);
    const walmartRoute = routes.find(
      (r) =>
        r.strategy === "single-store" &&
        r.stores[0]?.retailer === "walmart"
    );
    expect(walmartRoute).toBeDefined();
    expect(walmartRoute!.totalCost).toBe(6.0); // 3.0 * 2
    expect(walmartRoute!.tripCost).toBe(5.0);
    expect(walmartRoute!.effectiveCost).toBe(11.0);
  });

  it("creates a greedy multi-store split", () => {
    const items = [
      {
        name: "Milk",
        quantity: 1,
        prices: [makePrice("walmart", 2.0), makePrice("target", 3.0)],
      },
      {
        name: "Bread",
        quantity: 1,
        prices: [makePrice("walmart", 4.0), makePrice("target", 1.0)],
      },
    ];
    const routes = optimizeList(items, 0);
    const splitRoute = routes.find((r) => r.strategy === "2-store-split");
    expect(splitRoute).toBeDefined();
    // Cheapest: Milk at walmart (2.0) + Bread at target (1.0) = 3.0
    expect(splitRoute!.totalCost).toBe(3.0);
  });

  it("sorts routes by effective cost ascending", () => {
    const items = [
      {
        name: "Milk",
        quantity: 1,
        prices: [makePrice("walmart", 2.0), makePrice("target", 5.0)],
      },
    ];
    const routes = optimizeList(items, 5.0);
    for (let i = 1; i < routes.length; i++) {
      expect(routes[i].effectiveCost).toBeGreaterThanOrEqual(
        routes[i - 1].effectiveCost
      );
    }
  });

  it("calculates savings relative to worst option", () => {
    const items = [
      {
        name: "Milk",
        quantity: 1,
        prices: [makePrice("walmart", 2.0), makePrice("target", 5.0)],
      },
    ];
    const routes = optimizeList(items, 5.0);
    if (routes.length > 1) {
      // Best route should have savings > 0
      expect(routes[0].savings).toBeGreaterThan(0);
      // Worst route should have savings = 0
      expect(routes[routes.length - 1].savings).toBe(0);
    }
  });

  it("skips out-of-stock items for single-store", () => {
    const items = [
      {
        name: "Milk",
        quantity: 1,
        prices: [makePrice("walmart", 3.0, false)],
      },
    ];
    const routes = optimizeList(items, 5.0);
    const walmartRoute = routes.find(
      (r) =>
        r.strategy === "single-store" &&
        r.stores[0]?.retailer === "walmart"
    );
    // Walmart can't fulfill anything
    expect(walmartRoute).toBeUndefined();
  });

  it("handles quantity multiplier in costs", () => {
    const items = [
      {
        name: "Milk",
        quantity: 3,
        prices: [makePrice("walmart", 4.0)],
      },
    ];
    const routes = optimizeList(items, 0);
    const walmartRoute = routes.find(
      (r) =>
        r.strategy === "single-store" &&
        r.stores[0]?.retailer === "walmart"
    );
    expect(walmartRoute!.totalCost).toBe(12.0);
  });

  it("accounts for trip cost per store", () => {
    const items = [
      {
        name: "Milk",
        quantity: 1,
        prices: [makePrice("walmart", 2.0), makePrice("target", 2.0)],
      },
      {
        name: "Bread",
        quantity: 1,
        prices: [makePrice("walmart", 3.0), makePrice("target", 1.0)],
      },
    ];
    // With high trip cost, single store might win over split
    const routes = optimizeList(items, 100);
    // All routes should include trip cost
    for (const route of routes) {
      expect(route.tripCost).toBeGreaterThan(0);
      expect(route.effectiveCost).toBe(route.totalCost + route.tripCost);
    }
  });
});
