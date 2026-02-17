import { ProductResult, Retailer } from "@/types";
import { matchesQuery } from "./search-utils";
import { CATALOG, MockProduct } from "./mock-catalog";
import { applyRegionalPricing } from "@/lib/location";

const RETAILER: Retailer = "kroger";

// ── Kroger API types ──────────────────────────────────────────────
interface KrogerTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface KrogerPrice {
  regular: number;
  promo?: number;
}

interface KrogerItem {
  price?: KrogerPrice;
  size?: string;
  soldBy?: string;
}

interface KrogerImageSize {
  size: string;
  url: string;
}

interface KrogerImage {
  sizes: KrogerImageSize[];
}

interface KrogerProduct {
  productId: string;
  upc?: string;
  brand?: string;
  description: string;
  categories?: string[];
  items?: KrogerItem[];
  images?: KrogerImage[];
}

interface KrogerSearchResponse {
  data: KrogerProduct[];
}

// ── OAuth2 token cache ────────────────────────────────────────────
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(clientId: string, clientSecret: string): Promise<string> {
  // Return cached token if still valid (with 60s safety margin)
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch("https://api.kroger.com/v1/connect/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: "grant_type=client_credentials&scope=product.compact",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Kroger OAuth failed (${response.status}): ${text}`);
  }

  const data: KrogerTokenResponse = await response.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;
  return cachedToken;
}

// ── Size parsing ──────────────────────────────────────────────────
/**
 * Parses a size string (e.g. "16 oz", "1 lb", "32 fl oz", "1.5 gal")
 * and returns the equivalent weight/volume in ounces.
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

  // Match "500 ml", "1 l", "1.5 liter"
  const mlMatch = normalized.match(/([\d.]+)\s*ml/);
  if (mlMatch) return parseFloat(mlMatch[1]) * 0.033814;

  const lMatch = normalized.match(/([\d.]+)\s*(?:l|liter|litre)s?\b/);
  if (lMatch) return parseFloat(lMatch[1]) * 33.814;

  // Match "500 g", "1 kg"
  const kgMatch = normalized.match(/([\d.]+)\s*kg/);
  if (kgMatch) return parseFloat(kgMatch[1]) * 35.274;

  const gMatch = normalized.match(/([\d.]+)\s*g\b/);
  if (gMatch) return parseFloat(gMatch[1]) * 0.035274;

  return undefined;
}

// ── Response mapping ──────────────────────────────────────────────
function mapKrogerProduct(product: KrogerProduct): ProductResult | null {
  const item = product.items?.[0];
  if (!item) return null;

  const price = item.price?.promo ?? item.price?.regular;
  if (price === undefined || price <= 0) return null;

  const packageSize = item.size;
  const packageSizeOz = parseSizeToOz(packageSize);
  const unitPrice = packageSizeOz && packageSizeOz > 0
    ? Math.round((price / packageSizeOz) * 100) / 100
    : undefined;

  // Extract the best image URL — prefer "medium", fall back to the first available
  let imageUrl: string | undefined;
  if (product.images && product.images.length > 0) {
    for (const img of product.images) {
      const medium = img.sizes.find((s) => s.size === "medium");
      if (medium) {
        imageUrl = medium.url;
        break;
      }
    }
    // Fall back to first image's first size
    if (!imageUrl && product.images[0].sizes.length > 0) {
      imageUrl = product.images[0].sizes[0].url;
    }
  }

  return {
    name: product.description,
    upc: product.upc,
    brand: product.brand,
    category: product.categories?.[0],
    imageUrl,
    packageSize,
    packageSizeOz,
    retailer: RETAILER,
    price,
    unitPrice,
    inStock: true,
  };
}

// ── Public API ────────────────────────────────────────────────────
export async function search(query: string, region?: string): Promise<ProductResult[]> {
  const clientId = process.env.KROGER_CLIENT_ID;
  const clientSecret = process.env.KROGER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return getMockResults(query, region);
  }

  try {
    const token = await getAccessToken(clientId, clientSecret);

    const url = `https://api.kroger.com/v1/products?filter.term=${encodeURIComponent(query)}&filter.limit=10`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(`Kroger product search failed (${response.status})`);
      return getMockResults(query, region);
    }

    const body: KrogerSearchResponse = await response.json();
    const results: ProductResult[] = [];

    for (const product of body.data) {
      const mapped = mapKrogerProduct(product);
      if (mapped) {
        // Apply regional pricing if a region is provided
        if (region) {
          mapped.price = applyRegionalPricing(mapped.price, region);
          if (mapped.unitPrice !== undefined) {
            mapped.unitPrice = applyRegionalPricing(mapped.unitPrice, region);
          }
        }
        results.push(mapped);
      }
    }

    return results;
  } catch (error) {
    console.error("Kroger API error, falling back to mock:", error);
    return getMockResults(query, region);
  }
}

export async function lookupByUpc(upc: string): Promise<ProductResult | null> {
  const clientId = process.env.KROGER_CLIENT_ID;
  const clientSecret = process.env.KROGER_CLIENT_SECRET;

  if (clientId && clientSecret) {
    try {
      const token = await getAccessToken(clientId, clientSecret);

      const response = await fetch(`https://api.kroger.com/v1/products/${encodeURIComponent(upc)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const body: { data: KrogerProduct } = await response.json();
        const mapped = mapKrogerProduct(body.data);
        if (mapped) return mapped;
      }
    } catch (error) {
      console.error("Kroger UPC lookup error, falling back to mock:", error);
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
