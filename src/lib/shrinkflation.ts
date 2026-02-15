import { ShrinkflationAlert, SizeHistoryEntry } from "@/types";
import { prisma } from "./db";

/**
 * Record a product's current size and price for shrinkflation tracking.
 */
export async function recordSize(
  productId: string,
  packageSize: string,
  sizeOz: number,
  price: number,
  retailer: string
): Promise<void> {
  await prisma.sizeHistory.create({
    data: {
      productId,
      packageSize,
      sizeOz,
      price,
      retailer,
    },
  });
}

/**
 * Check if a product has experienced shrinkflation.
 * Compares latest size against historical data.
 */
export async function detectShrinkflation(
  productId: string
): Promise<ShrinkflationAlert | null> {
  const history = await prisma.sizeHistory.findMany({
    where: { productId },
    orderBy: { recordedAt: "asc" },
    include: { product: true },
  });

  if (history.length < 2) return null;

  const oldest = history[0];
  const newest = history[history.length - 1];

  // Check if size decreased
  if (newest.sizeOz >= oldest.sizeOz) return null;

  const sizeChangePercent =
    ((newest.sizeOz - oldest.sizeOz) / oldest.sizeOz) * 100;
  const priceChangePercent =
    ((newest.price - oldest.price) / oldest.price) * 100;

  // Effective price change accounts for size reduction
  const oldPricePerOz = oldest.price / oldest.sizeOz;
  const newPricePerOz = newest.price / newest.sizeOz;
  const effectivePriceChange =
    ((newPricePerOz - oldPricePerOz) / oldPricePerOz) * 100;

  // Only alert if size decreased meaningfully (>2%)
  if (Math.abs(sizeChangePercent) < 2) return null;

  return {
    productName: oldest.product.name,
    previousSize: oldest.packageSize,
    currentSize: newest.packageSize,
    previousSizeOz: oldest.sizeOz,
    currentSizeOz: newest.sizeOz,
    priceChange: Math.round(priceChangePercent * 10) / 10,
    effectivePriceChange: Math.round(effectivePriceChange * 10) / 10,
  };
}

/**
 * Get the full size history for a product.
 */
export async function getSizeHistory(
  productId: string
): Promise<SizeHistoryEntry[]> {
  const history = await prisma.sizeHistory.findMany({
    where: { productId },
    orderBy: { recordedAt: "asc" },
  });

  return history.map((h) => ({
    date: h.recordedAt.toISOString().split("T")[0],
    packageSize: h.packageSize,
    sizeOz: h.sizeOz,
    price: h.price,
    pricePerOz: Math.round((h.price / h.sizeOz) * 100) / 100,
    retailer: h.retailer,
  }));
}

/**
 * Get all products with detected shrinkflation.
 */
export async function getAllShrinkflationAlerts(): Promise<ShrinkflationAlert[]> {
  const products = await prisma.product.findMany({
    where: {
      sizeHistory: { some: {} },
    },
    select: { id: true },
  });

  const alerts: ShrinkflationAlert[] = [];

  for (const product of products) {
    const alert = await detectShrinkflation(product.id);
    if (alert) alerts.push(alert);
  }

  return alerts;
}

/**
 * Parse a package size string into ounces.
 */
export function parseSizeToOz(sizeStr: string): number | null {
  const lower = sizeStr.toLowerCase().trim();

  // Match patterns like "32 oz", "32oz", "32 fl oz"
  const ozMatch = lower.match(/([\d.]+)\s*(?:fl\s*)?oz/);
  if (ozMatch) return parseFloat(ozMatch[1]);

  // Match grams - convert to oz (1 oz = 28.3495g)
  const gMatch = lower.match(/([\d.]+)\s*g(?:rams?)?/);
  if (gMatch) return Math.round((parseFloat(gMatch[1]) / 28.3495) * 100) / 100;

  // Match kg
  const kgMatch = lower.match(/([\d.]+)\s*kg/);
  if (kgMatch) return Math.round((parseFloat(kgMatch[1]) * 35.274) * 100) / 100;

  // Match pounds (before liters so "lb" isn't caught by the "l" pattern)
  const lbMatch = lower.match(/([\d.]+)\s*(?:lb|pound)s?/);
  if (lbMatch) return Math.round(parseFloat(lbMatch[1]) * 16 * 100) / 100;

  // Match liters - convert to fl oz (1 L = 33.814 fl oz)
  const lMatch = lower.match(/([\d.]+)\s*l(?:iters?)?(?:\b|$)/);
  if (lMatch) return Math.round((parseFloat(lMatch[1]) * 33.814) * 100) / 100;

  // Match ml
  const mlMatch = lower.match(/([\d.]+)\s*ml/);
  if (mlMatch) return Math.round((parseFloat(mlMatch[1]) / 29.5735) * 100) / 100;

  // Match count (for items like paper towels)
  const ctMatch = lower.match(/([\d.]+)\s*(?:ct|count|rolls?|sheets?|pack)/);
  if (ctMatch) return parseFloat(ctMatch[1]);

  return null;
}
