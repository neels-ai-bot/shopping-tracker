import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { search as searchWalmart } from "@/lib/scrapers/walmart";
import { search as searchKroger } from "@/lib/scrapers/kroger";
import { search as searchTarget } from "@/lib/scrapers/target";
import { search as searchAmazon } from "@/lib/scrapers/amazon";
import { search as searchCostco } from "@/lib/scrapers/costco";
import { search as searchWholefoods } from "@/lib/scrapers/wholefoods";
import { search as searchPublix } from "@/lib/scrapers/publix";
import { search as searchHeb } from "@/lib/scrapers/heb";
import { search as searchWegmans } from "@/lib/scrapers/wegmans";
import { search as searchAldi } from "@/lib/scrapers/aldi";
import { search as searchTraderjoes } from "@/lib/scrapers/traderjoes";
import { findEquivalents } from "@/lib/brand-mapper";
import { detectShrinkflation } from "@/lib/shrinkflation";
import { detectLocation } from "@/lib/location";
import { getAvailableRetailers } from "@/lib/retailer-config";
import { ComparisonResult, ProductResult, RetailerPrice, Retailer } from "@/types";

const SEARCHERS: Record<Retailer, (q: string, region?: string) => Promise<ProductResult[]>> = {
  walmart: searchWalmart,
  kroger: searchKroger,
  target: searchTarget,
  amazon: searchAmazon,
  costco: searchCostco,
  wholefoods: searchWholefoods,
  publix: searchPublix,
  heb: searchHeb,
  wegmans: searchWegmans,
  aldi: searchAldi,
  traderjoes: searchTraderjoes,
};

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  const upc = request.nextUrl.searchParams.get("upc");
  const regionParam = request.nextUrl.searchParams.get("region");

  if (!query && !upc) {
    return NextResponse.json(
      { error: "Query parameter 'q' or 'upc' is required" },
      { status: 400 }
    );
  }

  const searchTerm = query || upc || "";

  // Detect region
  let region = regionParam || undefined;
  if (!region) {
    try {
      const forwarded = request.headers.get("x-forwarded-for");
      const ip = forwarded?.split(",")[0]?.trim() || undefined;
      const loc = await detectLocation(ip);
      if (loc) region = loc.region;
    } catch {
      // Non-critical
    }
  }

  const availableRetailers = getAvailableRetailers(region);

  try {
    // Search all available retailers in parallel
    const results = await Promise.allSettled(
      availableRetailers.map((r) => SEARCHERS[r](searchTerm, region))
    );

    const allResults: ProductResult[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        allResults.push(...result.value);
      }
    }

    if (allResults.length === 0) {
      return NextResponse.json({ comparison: null, message: "No results found" });
    }

    // Group by best match (first result from each retailer)
    const prices: RetailerPrice[] = [];
    const seenRetailers = new Set<string>();

    for (const result of allResults) {
      if (!seenRetailers.has(result.retailer)) {
        seenRetailers.add(result.retailer);
        prices.push({
          retailer: result.retailer,
          price: result.price,
          unitPrice: result.unitPrice,
          url: result.url,
          inStock: result.inStock,
        });
      }
    }

    // Find best price
    const inStockPrices = prices.filter((p) => p.inStock);
    const bestPrice = inStockPrices.length > 0
      ? inStockPrices.reduce((best, p) => (p.price < best.price ? p : best))
      : prices[0];

    // Get brand equivalents
    const firstResult = allResults[0];
    const equivalents = await findEquivalents({
      name: firstResult.name,
      brand: firstResult.brand,
      category: firstResult.category,
    });

    // Check for shrinkflation (if product exists in DB)
    let shrinkflationAlert = undefined;
    if (upc) {
      const dbProduct = await prisma.product.findUnique({ where: { upc } });
      if (dbProduct) {
        shrinkflationAlert = await detectShrinkflation(dbProduct.id) || undefined;
      }
    }

    const comparison: ComparisonResult = {
      productName: firstResult.name,
      upc: firstResult.upc,
      imageUrl: firstResult.imageUrl,
      prices,
      bestPrice,
      equivalents: equivalents.length > 0 ? equivalents : undefined,
      shrinkflationAlert,
    };

    return NextResponse.json({ comparison, availableRetailers });
  } catch (error) {
    console.error("Compare error:", error);
    return NextResponse.json({ error: "Comparison failed" }, { status: 500 });
  }
}
