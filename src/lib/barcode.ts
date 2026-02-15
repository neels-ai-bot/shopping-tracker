// Barcode lookup utilities

// Open Food Facts API - free, no key required
const OPEN_FOOD_FACTS_URL = "https://world.openfoodfacts.org/api/v0/product";

// UPC Item DB API - free tier available
const UPC_ITEMDB_URL = "https://api.upcitemdb.com/prod/trial/lookup";

export interface BarcodeProduct {
  name: string;
  brand?: string;
  upc: string;
  category?: string;
  imageUrl?: string;
  packageSize?: string;
}

/**
 * Look up a product by UPC/barcode number.
 * Tries Open Food Facts first, then UPC Item DB.
 */
export async function lookupBarcode(upc: string): Promise<BarcodeProduct | null> {
  // Normalize UPC - strip leading zeros, ensure 12-13 digits
  const normalizedUpc = upc.replace(/^0+/, "").padStart(12, "0");

  // Try Open Food Facts first (free, no API key)
  try {
    const result = await lookupOpenFoodFacts(normalizedUpc);
    if (result) return result;
  } catch {
    // Fall through to next source
  }

  // Try UPC Item DB
  try {
    const result = await lookupUpcItemDb(normalizedUpc);
    if (result) return result;
  } catch {
    // Fall through to mock
  }

  // Return mock data for known UPCs (demo purposes)
  return getMockBarcodeResult(normalizedUpc);
}

async function lookupOpenFoodFacts(upc: string): Promise<BarcodeProduct | null> {
  const response = await fetch(`${OPEN_FOOD_FACTS_URL}/${upc}.json`);
  if (!response.ok) return null;

  const data = await response.json();
  if (data.status !== 1 || !data.product) return null;

  const product = data.product;
  return {
    name: product.product_name || "Unknown Product",
    brand: product.brands,
    upc,
    category: product.categories?.split(",")[0]?.trim(),
    imageUrl: product.image_url,
    packageSize: product.quantity,
  };
}

async function lookupUpcItemDb(upc: string): Promise<BarcodeProduct | null> {
  const response = await fetch(`${UPC_ITEMDB_URL}?upc=${upc}`);
  if (!response.ok) return null;

  const data = await response.json();
  if (!data.items || data.items.length === 0) return null;

  const item = data.items[0];
  return {
    name: item.title || "Unknown Product",
    brand: item.brand,
    upc,
    category: item.category,
    imageUrl: item.images?.[0],
    packageSize: item.size,
  };
}

// Mock barcode data for demo/development
const MOCK_BARCODES: Record<string, BarcodeProduct> = {
  "037000764113": {
    name: "Tide Original Laundry Detergent",
    brand: "Tide",
    upc: "037000764113",
    category: "Laundry Detergent",
    packageSize: "150 oz",
  },
  "016000275287": {
    name: "Cheerios Original Cereal",
    brand: "General Mills",
    upc: "016000275287",
    category: "Cereal",
    packageSize: "18 oz",
  },
  "037000869450": {
    name: "Bounty Select-A-Size Paper Towels",
    brand: "Bounty",
    upc: "037000869450",
    category: "Paper Towels",
    packageSize: "12 Double Rolls",
  },
  "037000449836": {
    name: "Crest 3D White Toothpaste",
    brand: "Crest",
    upc: "037000449836",
    category: "Toothpaste",
    packageSize: "4.8 oz",
  },
};

function getMockBarcodeResult(upc: string): BarcodeProduct | null {
  return MOCK_BARCODES[upc] || null;
}
