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
import { detectLocation } from "@/lib/location";
import { getAvailableRetailers } from "@/lib/retailer-config";
import { scoreMatch } from "@/lib/scrapers/search-utils";
import { ProductResult, Retailer } from "@/types";

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
  const retailers = request.nextUrl.searchParams.get("retailers");
  const regionParam = request.nextUrl.searchParams.get("region");

  if (!query) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  // Detect region from param, or IP
  let region = regionParam || undefined;
  let locationInfo = null;
  if (!region) {
    try {
      const forwarded = request.headers.get("x-forwarded-for");
      const ip = forwarded?.split(",")[0]?.trim() || undefined;
      const loc = await detectLocation(ip);
      if (loc) {
        region = loc.region;
        locationInfo = loc;
      }
    } catch {
      // Non-critical
    }
  }

  // Determine which retailers are available for this region
  const availableRetailers = getAvailableRetailers(region);

  const selectedRetailers: Retailer[] = retailers
    ? (retailers.split(",") as Retailer[]).filter((r) => availableRetailers.includes(r))
    : availableRetailers;

  try {
    // Search all selected retailers in parallel
    const results = await Promise.allSettled(
      selectedRetailers.map((r) => SEARCHERS[r](query, region))
    );

    const products: ProductResult[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        products.push(...result.value);
      }
    }

    // Sort by relevance score so best matches appear first
    products.sort((a, b) => scoreMatch(b, query) - scoreMatch(a, query));

    // Save products to database for future reference
    for (const product of products.slice(0, 20)) {
      try {
        const existing = product.upc
          ? await prisma.product.findUnique({ where: { upc: product.upc } })
          : null;

        const productRecord = existing || await prisma.product.create({
          data: {
            name: product.name,
            upc: product.upc,
            brand: product.brand,
            category: product.category,
            imageUrl: product.imageUrl,
            packageSize: product.packageSize,
            packageSizeOz: product.packageSizeOz,
          },
        });

        await prisma.price.create({
          data: {
            productId: productRecord.id,
            retailer: product.retailer,
            price: product.price,
            unitPrice: product.unitPrice,
            url: product.url,
            inStock: product.inStock,
          },
        });
      } catch {
        // Non-critical: continue if DB save fails
      }
    }

    return NextResponse.json({
      products,
      total: products.length,
      location: locationInfo,
      region,
      availableRetailers,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
