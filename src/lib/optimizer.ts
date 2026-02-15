import { OptimizedRoute, StoreAssignment, Retailer, RetailerPrice } from "@/types";
import { getAvailableRetailers } from "./retailer-config";

interface ListItem {
  name: string;
  quantity: number;
  prices: RetailerPrice[];
}

/**
 * Whole-list cost optimizer.
 * Takes a shopping list with prices at each retailer and finds
 * the cheapest combination of stores, accounting for trip costs.
 */
export function optimizeList(
  items: ListItem[],
  tripCostPerStore: number = 5.0,
  region?: string
): OptimizedRoute[] {
  const routes: OptimizedRoute[] = [];
  const retailers = getAvailableRetailers(region);

  // Strategy 1: Best single store
  for (const retailer of retailers) {
    const assignment = buildSingleStoreAssignment(items, retailer);
    if (assignment && assignment.items.length > 0) {
      routes.push({
        strategy: "single-store",
        stores: [assignment],
        totalCost: assignment.subtotal,
        savings: 0,
        tripCost: tripCostPerStore,
        effectiveCost: assignment.subtotal + tripCostPerStore,
      });
    }
  }

  // Strategy 2: Cheapest item at any store (greedy multi-store)
  const greedyAssignment = buildGreedyAssignment(items);
  if (greedyAssignment.length > 0) {
    const totalCost = greedyAssignment.reduce((sum, s) => sum + s.subtotal, 0);
    const tripCost = greedyAssignment.length * tripCostPerStore;
    routes.push({
      strategy: `${greedyAssignment.length}-store-split`,
      stores: greedyAssignment,
      totalCost,
      savings: 0,
      tripCost,
      effectiveCost: totalCost + tripCost,
    });
  }

  // Strategy 3: Best 2-store split
  const twoStoreSplit = buildBestNStoreSplit(items, 2, retailers);
  if (twoStoreSplit && twoStoreSplit.length > 0) {
    const totalCost = twoStoreSplit.reduce((sum, s) => sum + s.subtotal, 0);
    const tripCost = twoStoreSplit.length * tripCostPerStore;
    routes.push({
      strategy: "2-store-split",
      stores: twoStoreSplit,
      totalCost,
      savings: 0,
      tripCost,
      effectiveCost: totalCost + tripCost,
    });
  }

  // Sort by effective cost
  routes.sort((a, b) => a.effectiveCost - b.effectiveCost);

  // Calculate savings relative to worst option
  if (routes.length > 1) {
    const worstCost = routes[routes.length - 1].effectiveCost;
    for (const route of routes) {
      route.savings = Math.round((worstCost - route.effectiveCost) * 100) / 100;
    }
  }

  return routes;
}

function buildSingleStoreAssignment(
  items: ListItem[],
  retailer: Retailer
): StoreAssignment | null {
  const assignedItems = [];
  let subtotal = 0;

  for (const item of items) {
    const price = item.prices.find(
      (p) => p.retailer === retailer && p.inStock
    );
    if (price) {
      const itemTotal = price.price * item.quantity;
      assignedItems.push({
        name: item.name,
        quantity: item.quantity,
        price: price.price,
        unitPrice: price.unitPrice,
      });
      subtotal += itemTotal;
    }
  }

  if (assignedItems.length === 0) return null;

  return {
    retailer,
    items: assignedItems,
    subtotal: Math.round(subtotal * 100) / 100,
  };
}

function buildGreedyAssignment(items: ListItem[]): StoreAssignment[] {
  const storeMap = new Map<Retailer, StoreAssignment>();

  for (const item of items) {
    const availablePrices = item.prices.filter((p) => p.inStock);
    if (availablePrices.length === 0) continue;

    // Find cheapest retailer for this item
    const cheapest = availablePrices.reduce((best, p) =>
      p.price < best.price ? p : best
    );

    if (!storeMap.has(cheapest.retailer)) {
      storeMap.set(cheapest.retailer, {
        retailer: cheapest.retailer,
        items: [],
        subtotal: 0,
      });
    }

    const store = storeMap.get(cheapest.retailer)!;
    const itemTotal = cheapest.price * item.quantity;
    store.items.push({
      name: item.name,
      quantity: item.quantity,
      price: cheapest.price,
      unitPrice: cheapest.unitPrice,
    });
    store.subtotal = Math.round((store.subtotal + itemTotal) * 100) / 100;
  }

  return Array.from(storeMap.values());
}

function buildBestNStoreSplit(
  items: ListItem[],
  maxStores: number,
  availableRetailers: Retailer[]
): StoreAssignment[] | null {
  // Get all possible store combinations of size maxStores
  const retailers = availableRetailers;
  const combos = getCombinations(retailers, maxStores);

  let bestAssignment: StoreAssignment[] | null = null;
  let bestCost = Infinity;

  for (const combo of combos) {
    const storeMap = new Map<Retailer, StoreAssignment>();
    for (const r of combo) {
      storeMap.set(r, { retailer: r, items: [], subtotal: 0 });
    }

    let totalCost = 0;
    let allItemsCovered = true;

    for (const item of items) {
      const availablePrices = item.prices.filter(
        (p) => combo.includes(p.retailer) && p.inStock
      );
      if (availablePrices.length === 0) {
        allItemsCovered = false;
        break;
      }

      const cheapest = availablePrices.reduce((best, p) =>
        p.price < best.price ? p : best
      );

      const store = storeMap.get(cheapest.retailer)!;
      const itemTotal = cheapest.price * item.quantity;
      store.items.push({
        name: item.name,
        quantity: item.quantity,
        price: cheapest.price,
        unitPrice: cheapest.unitPrice,
      });
      store.subtotal = Math.round((store.subtotal + itemTotal) * 100) / 100;
      totalCost += itemTotal;
    }

    if (allItemsCovered && totalCost < bestCost) {
      bestCost = totalCost;
      bestAssignment = Array.from(storeMap.values()).filter(
        (s) => s.items.length > 0
      );
    }
  }

  return bestAssignment;
}

function getCombinations<T>(arr: T[], size: number): T[][] {
  if (size === 1) return arr.map((item) => [item]);
  const combos: T[][] = [];
  for (let i = 0; i <= arr.length - size; i++) {
    const rest = getCombinations(arr.slice(i + 1), size - 1);
    for (const combo of rest) {
      combos.push([arr[i], ...combo]);
    }
  }
  return combos;
}
