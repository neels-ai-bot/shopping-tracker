import { ProductResult, Retailer } from "@/types";
import { matchesQuery } from "./search-utils";
import { CATALOG, MockProduct } from "./mock-catalog";
import { applyRegionalPricing } from "@/lib/location";

const RETAILER: Retailer = "walmart";

// Walmart Affiliate API v3 (v1 was deprecated)
const API_BASE = "https://developer.api.walmart.com/api-proxy/service/affil/product/v2";

// ── Walmart API types ─────────────────────────────────────────────
interface WalmartSearchItem {
  itemId: number;
  name: string;
  upc?: string;
  brandName?: string;
  categoryPath?: string;
  thumbnailImage?: string;
  mediumImage?: string;
  salePrice?: number;
  msrp?: number;
  size?: string;
  productUrl?: string;
  stock?: string;
  availableOnline?: boolean;
}

interface WalmartSearchResponse {
  items?: WalmartSearchItem[];
  totalResults?: number;
}

// ── Size parsing ──────────────────────────────────────────────────
/**
 * Parses a size string and returns the equivalent weight/volume in ounces.
 */
function parseSizeToOz(size: string | undefined): number | undefined {
  if (!size) return undefined;

  const normalized = size.toLowerCase().trim();

  // Match patterns like "16 oz", "16oz", "32 fl oz", "32 fl. oz."
  const ozMatch = normalized.match(/([\d.]+)\s*(?:fl\.?\s*)?oz/);
  if (ozMatch) return parseFloat(ozMatch[1]);

  // Match "1 lb", "1.5 lbs", "2 lb."
  const lbMatch = normalized.match(/([\d.]+)\s*lbs?\.?/);
  if (lbMatch) return parseFloat(lbMatch[1]) * 16;

  // Match "1 gal", "0.5 gallon"
  const galMatch = normalized.match(/([\d.]+)\s*gal(?:lon)?s?/);
  if (galMatch) return parseFloat(galMatch[1]) * 128;

  // Match "1 qt", "2 quarts"
  const qtMatch = normalized.match(/([\d.]+)\s*(?:qt|quart)s?/);
  if (qtMatch) return parseFloat(qtMatch[1]) * 32;

  // Match "1 pt", "2 pints"
  const ptMatch = normalized.match(/([\d.]+)\s*(?:pt|pint)s?/);
  if (ptMatch) return parseFloat(ptMatch[1]) * 16;

  // Match "500 ml"
  const mlMatch = normalized.match(/([\d.]+)\s*ml/);
  if (mlMatch) return parseFloat(mlMatch[1]) * 0.033814;

  // Match "1 l", "1.5 liter"
  const lMatch = normalized.match(/([\d.]+)\s*(?:l|liter|litre)s?\b/);
  if (lMatch) return parseFloat(lMatch[1]) * 33.814;

  // Match "1 kg"
  const kgMatch = normalized.match(/([\d.]+)\s*kg/);
  if (kgMatch) return parseFloat(kgMatch[1]) * 35.274;

  // Match "500 g"
  const gMatch = normalized.match(/([\d.]+)\s*g\b/);
  if (gMatch) return parseFloat(gMatch[1]) * 0.035274;

  return undefined;
}

// ── Response mapping ──────────────────────────────────────────────
function mapWalmartItem(item: WalmartSearchItem, region?: string): ProductResult | null {
  const rawPrice = item.salePrice ?? item.msrp;
  if (rawPrice === undefined || rawPrice <= 0) return null;

  const price = region ? applyRegionalPricing(rawPrice, region) : rawPrice;
  const packageSize = item.size;
  const packageSizeOz = parseSizeToOz(packageSize);
  const unitPrice = packageSizeOz && packageSizeOz > 0
    ? Math.round((price / packageSizeOz) * 100) / 100
    : undefined;

  const inStock =
    item.availableOnline !== false && item.stock !== "Not available";

  return {
    name: item.name,
    upc: item.upc,
    brand: item.brandName,
    category: item.categoryPath,
    imageUrl: item.mediumImage || item.thumbnailImage,
    packageSize,
    packageSizeOz,
    retailer: RETAILER,
    price,
    unitPrice,
    url: item.productUrl,
    inStock,
  };
}

// ── Public API ────────────────────────────────────────────────────
export async function search(query: string, region?: string): Promise<ProductResult[]> {
  const apiKey = process.env.WALMART_API_KEY;

  if (!apiKey) {
    return getMockResults(query, region);
  }

  try {
    const url = `${API_BASE}/search?query=${encodeURIComponent(query)}&format=json&numItems=10`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "WM_SEC.ACCESS_TOKEN": apiKey,
        "WM_CONSUMER.CHANNEL.TYPE": "AFFILIATE",
      },
    });

    if (!response.ok) {
      console.error(`Walmart product search failed (${response.status})`);
      return getMockResults(query, region);
    }

    const data: WalmartSearchResponse = await response.json();

    if (!data.items || !Array.isArray(data.items)) {
      console.error("Walmart API returned unexpected format");
      return getMockResults(query, region);
    }

    const results: ProductResult[] = [];
    for (const item of data.items.slice(0, 10)) {
      const mapped = mapWalmartItem(item, region);
      if (mapped) {
        results.push(mapped);
      }
    }

    return results;
  } catch (error) {
    console.error("Walmart API error, falling back to mock:", error);
    return getMockResults(query, region);
  }
}

export async function lookupByUpc(upc: string): Promise<ProductResult | null> {
  const apiKey = process.env.WALMART_API_KEY;

  if (apiKey) {
    try {
      const url = `${API_BASE}/items?upc=${encodeURIComponent(upc)}`;
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "WM_SEC.ACCESS_TOKEN": apiKey,
          "WM_CONSUMER.CHANNEL.TYPE": "AFFILIATE",
        },
      });

      if (response.ok) {
        const data: { items?: WalmartSearchItem[] } = await response.json();
        if (data.items && data.items.length > 0) {
          const mapped = mapWalmartItem(data.items[0]);
          if (mapped) return mapped;
        }
      }
    } catch (error) {
      console.error("Walmart UPC lookup error, falling back to mock:", error);
    }
  }

  // Mock fallback for UPC lookup
  const item = CATALOG.find((p) => p.upc === upc && p.prices[RETAILER]);
  if (!item) return null;
  return catalogToResult(item);
}

// ── Mock fallback ─────────────────────────────────────────────────
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
