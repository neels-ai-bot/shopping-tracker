import { ProductResult, Retailer } from "@/types";
import { matchesQuery } from "./search-utils";
import { CATALOG, MockProduct } from "./mock-catalog";
import { applyRegionalPricing } from "@/lib/location";

const RETAILER: Retailer = "wegmans";

export async function search(query: string, region?: string): Promise<ProductResult[]> {
  // Wegmans has no public API — uses mock catalog
  return getMockResults(query, region);
}

export async function lookupByUpc(upc: string): Promise<ProductResult | null> {
  const item = CATALOG.find((p) => p.upc === upc && p.prices[RETAILER]);
  if (!item) return null;
  return catalogToResult(item);
}

function getMockResults(query: string, region?: string): ProductResult[] {
  return CATALOG
    .filter((p) => p.prices[RETAILER] !== undefined)
    .map((p) => catalogToResult(p, region))
    .filter((p) => matchesQuery(p, query));
}

function catalogToResult(p: MockProduct, region?: string): ProductResult {
  const basePrice = p.prices[RETAILER]!;
  const price = region ? applyRegionalPricing(basePrice, region) : basePrice;
  const baseUnit = p.unitPrices[RETAILER];
  const unitPrice = baseUnit && region ? applyRegionalPricing(baseUnit, region) : baseUnit;

  return {
    name: p.name,
    upc: p.upc,
    brand: p.brand,
    category: p.category,
    packageSize: p.packageSize,
    packageSizeOz: p.packageSizeOz,
    retailer: RETAILER,
    price,
    unitPrice,
    inStock: true,
  };
}
