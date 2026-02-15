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
import { recordSize, parseSizeToOz } from "@/lib/shrinkflation";
import { ProductResult, Retailer } from "@/types";

const SEARCHERS: Record<Retailer, (q: string) => Promise<ProductResult[]>> = {
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

/**
 * POST - Trigger a scraping run for tracked products.
 * Used by the cron job to update prices and check alerts.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const productIds: string[] = body.productIds || [];

    // If no specific products, scrape all products with active alerts
    let products;
    if (productIds.length > 0) {
      products = await prisma.product.findMany({
        where: { id: { in: productIds } },
      });
    } else {
      products = await prisma.product.findMany({
        where: {
          alerts: { some: { active: true } },
        },
      });
    }

    const results = [];

    for (const product of products) {
      const searchTerm = product.upc || product.name;

      // Search each retailer
      for (const [retailer, searchFn] of Object.entries(SEARCHERS)) {
        try {
          const searchResults = await searchFn(searchTerm);
          if (searchResults.length > 0) {
            const best = searchResults[0];

            // Save new price
            await prisma.price.create({
              data: {
                productId: product.id,
                retailer,
                price: best.price,
                unitPrice: best.unitPrice,
                url: best.url,
                inStock: best.inStock,
              },
            });

            // Record size for shrinkflation tracking
            if (best.packageSize) {
              const sizeOz = parseSizeToOz(best.packageSize);
              if (sizeOz) {
                await recordSize(
                  product.id,
                  best.packageSize,
                  sizeOz,
                  best.price,
                  retailer
                );
              }
            }

            // Check alerts
            const alerts = await prisma.alert.findMany({
              where: {
                productId: product.id,
                active: true,
                triggered: false,
                OR: [
                  { retailer: null },
                  { retailer },
                ],
              },
            });

            for (const alert of alerts) {
              if (best.price <= alert.targetPrice) {
                await prisma.alert.update({
                  where: { id: alert.id },
                  data: { triggered: true },
                });
                results.push({
                  type: "alert_triggered",
                  product: product.name,
                  retailer,
                  price: best.price,
                  targetPrice: alert.targetPrice,
                });
              }
            }
          }
        } catch {
          // Continue with other retailers
        }
      }
    }

    return NextResponse.json({
      success: true,
      productsScraped: products.length,
      results,
    });
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json({ error: "Scrape failed" }, { status: 500 });
  }
}
