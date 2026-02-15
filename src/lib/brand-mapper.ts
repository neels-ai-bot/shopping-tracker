import Fuse from "fuse.js";
import { BrandEquivalent } from "@/types";
import { prisma } from "./db";

// Known store-brand mappings for common categories
const STORE_BRAND_MAP: Record<string, { brand: string; store: string }[]> = {
  "laundry detergent": [
    { brand: "Great Value", store: "walmart" },
    { brand: "Up & Up", store: "target" },
    { brand: "Kirkland Signature", store: "costco" },
    { brand: "Kroger", store: "kroger" },
    { brand: "Amazon Basics", store: "amazon" },
    { brand: "365 by Whole Foods", store: "wholefoods" },
    { brand: "Publix", store: "publix" },
    { brand: "H-E-B", store: "heb" },
    { brand: "Wegmans", store: "wegmans" },
    { brand: "Tandil", store: "aldi" },
    { brand: "Trader Joe's", store: "traderjoes" },
  ],
  "paper towels": [
    { brand: "Great Value", store: "walmart" },
    { brand: "Up & Up", store: "target" },
    { brand: "Kirkland Signature", store: "costco" },
    { brand: "Kroger", store: "kroger" },
    { brand: "Amazon Basics", store: "amazon" },
    { brand: "365 by Whole Foods", store: "wholefoods" },
    { brand: "Publix", store: "publix" },
    { brand: "H-E-B", store: "heb" },
    { brand: "Wegmans", store: "wegmans" },
    { brand: "Boulder", store: "aldi" },
  ],
  cereal: [
    { brand: "Great Value", store: "walmart" },
    { brand: "Market Pantry", store: "target" },
    { brand: "Kirkland Signature", store: "costco" },
    { brand: "Kroger", store: "kroger" },
    { brand: "365 by Whole Foods", store: "wholefoods" },
    { brand: "Publix", store: "publix" },
    { brand: "H-E-B", store: "heb" },
    { brand: "Wegmans", store: "wegmans" },
    { brand: "Millville", store: "aldi" },
    { brand: "Trader Joe's", store: "traderjoes" },
  ],
  toothpaste: [
    { brand: "Equate", store: "walmart" },
    { brand: "Up & Up", store: "target" },
    { brand: "Kirkland Signature", store: "costco" },
    { brand: "Kroger", store: "kroger" },
    { brand: "365 by Whole Foods", store: "wholefoods" },
    { brand: "Publix", store: "publix" },
    { brand: "H-E-B", store: "heb" },
    { brand: "Wegmans", store: "wegmans" },
  ],
  milk: [
    { brand: "Great Value", store: "walmart" },
    { brand: "Good & Gather", store: "target" },
    { brand: "Kirkland Signature", store: "costco" },
    { brand: "Kroger", store: "kroger" },
    { brand: "365 by Whole Foods", store: "wholefoods" },
    { brand: "Publix Greenwise", store: "publix" },
    { brand: "H-E-B Organics", store: "heb" },
    { brand: "Wegmans", store: "wegmans" },
    { brand: "Simply Nature", store: "aldi" },
    { brand: "Trader Joe's", store: "traderjoes" },
  ],
};

interface ProductForMapping {
  name: string;
  brand?: string;
  category?: string;
}

/**
 * Find store-brand equivalents for a given product.
 * Uses fuzzy matching + known brand mappings.
 */
export async function findEquivalents(
  product: ProductForMapping
): Promise<BrandEquivalent[]> {
  const equivalents: BrandEquivalent[] = [];

  // Check database for saved mappings first
  try {
    const dbMappings = await prisma.brandMapping.findMany({
      where: {
        sourceProduct: {
          name: { contains: product.name },
        },
      },
    });

    for (const mapping of dbMappings) {
      equivalents.push({
        name: mapping.equivalentName,
        store: mapping.equivalentStore,
        price: 0, // Will be filled by caller
        confidence: mapping.confidence,
      });
    }
  } catch {
    // DB not available, continue with static mappings
  }

  // Use category-based mapping
  const category = product.category?.toLowerCase() || guessCategory(product.name);
  const storeBrands = STORE_BRAND_MAP[category];

  if (storeBrands) {
    for (const sb of storeBrands) {
      // Don't suggest the same brand
      if (product.brand && sb.brand.toLowerCase() === product.brand.toLowerCase()) {
        continue;
      }

      const equivalentName = `${sb.brand} ${category.charAt(0).toUpperCase() + category.slice(1)}`;

      // Check if already in results
      if (equivalents.some((e) => e.store === sb.store)) continue;

      equivalents.push({
        name: equivalentName,
        store: sb.store,
        price: 0,
        confidence: 0.7, // Static mapping confidence
      });
    }
  }

  return equivalents;
}

/**
 * Fuzzy match a product name against a list of products to find equivalents.
 */
export function fuzzyMatch(
  query: string,
  products: { name: string; store: string; price: number }[]
): BrandEquivalent[] {
  const fuse = new Fuse(products, {
    keys: ["name"],
    threshold: 0.4,
    includeScore: true,
  });

  const results = fuse.search(query);

  return results.map((r) => ({
    name: r.item.name,
    store: r.item.store,
    price: r.item.price,
    confidence: Math.round((1 - (r.score || 0)) * 100) / 100,
  }));
}

/**
 * Save a user-confirmed brand mapping to the database.
 */
export async function saveBrandMapping(
  sourceProductId: string,
  equivalentName: string,
  equivalentStore: string,
  confidence: number = 1.0
): Promise<void> {
  await prisma.brandMapping.create({
    data: {
      sourceProductId,
      equivalentName,
      equivalentStore,
      confidence,
    },
  });
}

function guessCategory(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("detergent") || lower.includes("laundry")) return "laundry detergent";
  if (lower.includes("paper towel")) return "paper towels";
  if (lower.includes("cereal") || lower.includes("cheerios") || lower.includes("flakes"))
    return "cereal";
  if (lower.includes("toothpaste")) return "toothpaste";
  if (lower.includes("milk")) return "milk";
  return "";
}
