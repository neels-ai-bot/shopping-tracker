import { ProductResult, Retailer } from "@/types";
import { matchesQuery } from "./search-utils";
import { CATALOG } from "./mock-catalog";
import { applyRegionalPricing } from "@/lib/location";

const RETAILER: Retailer = "walmart";
const API_BASE = "https://affiliate.api.walmart.com/v1";

export async function search(query: string, region?: string): Promise<ProductResult[]> {
  const apiKey = process.env.WALMART_API_KEY;

  if (!apiKey) {
    return getMockResults(query, region);
  }

  try {
    const response = await fetch(
      `${API_BASE}/search?query=${encodeURIComponent(query)}&format=json&apiKey=${apiKey}`,
      { headers: { Accept: "application/json" } }
    );

    if (!response.ok) return getMockResults(query, region);

    const data = await response.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.items || []).slice(0, 10).map((item: any) => ({
      name: item.name as string,
      upc: item.upc as string,
      brand: item.brandName as string,
      category: item.categoryPath as string,
      imageUrl: item.thumbnailImage as string,
      packageSize: item.size as string,
      retailer: RETAILER,
      price: item.salePrice as number || item.msrp as number,
      unitPrice: undefined,
      url: item.productUrl as string,
      inStock: (item.stock as string) !== "Not available",
    }));
  } catch {
    return getMockResults(query, region);
  }
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

function catalogToResult(p: typeof CATALOG[0], region?: string): ProductResult {
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
