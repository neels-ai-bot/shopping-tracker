export interface PriceHistoryEntry {
  date: string; // ISO date string
  price: number;
  retailer: string;
}

const MAX_HISTORY_DAYS = 90;

function getStorageKey(productId: string): string {
  return `priceHistory_${productId}`;
}

function loadEntries(productId: string): PriceHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(productId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as PriceHistoryEntry[];
  } catch {
    return [];
  }
}

function persistEntries(productId: string, entries: PriceHistoryEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(productId), JSON.stringify(entries));
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function pruneOldEntries(entries: PriceHistoryEntry[]): PriceHistoryEntry[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - MAX_HISTORY_DAYS);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return entries.filter((e) => e.date >= cutoffStr);
}

/**
 * Saves a price entry for today. Only one entry per product per day per
 * retailer is stored — if one already exists for the same date + retailer the
 * call is a no-op.
 */
export function savePriceSnapshot(
  productId: string,
  price: number,
  retailer: string
): void {
  const entries = loadEntries(productId);
  const today = todayISO();

  const alreadyExists = entries.some(
    (e) => e.date === today && e.retailer === retailer
  );
  if (alreadyExists) return;

  entries.push({ date: today, price, retailer });

  const pruned = pruneOldEntries(entries);
  pruned.sort((a, b) => a.date.localeCompare(b.date));

  persistEntries(productId, pruned);
}

/**
 * Returns every recorded price-history entry for a product, sorted by date
 * ascending.
 */
export function getPriceHistory(productId: string): PriceHistoryEntry[] {
  const entries = loadEntries(productId);
  return entries.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Compares the most recent price to the price roughly 7 days ago.
 *
 * Returns:
 * - `"up"`     if the price increased by more than 1 %
 * - `"down"`   if the price decreased by more than 1 %
 * - `"stable"` if the change is within ±1 %
 * - `null`     if there is not enough data
 */
export function getPriceTrend(
  productId: string
): "up" | "down" | "stable" | null {
  const entries = getPriceHistory(productId);
  if (entries.length < 2) return null;

  const mostRecent = entries[entries.length - 1];

  // Find the entry closest to 7 days before the most recent entry
  const targetDate = new Date(mostRecent.date);
  targetDate.setDate(targetDate.getDate() - 7);
  const targetStr = targetDate.toISOString().slice(0, 10);

  let closest: PriceHistoryEntry | null = null;
  let closestDiff = Infinity;

  for (const entry of entries) {
    if (entry === mostRecent) continue;
    const diff = Math.abs(
      new Date(entry.date).getTime() - new Date(targetStr).getTime()
    );
    if (diff < closestDiff) {
      closestDiff = diff;
      closest = entry;
    }
  }

  if (!closest) return null;

  const change = (mostRecent.price - closest.price) / closest.price;

  if (change > 0.01) return "up";
  if (change < -0.01) return "down";
  return "stable";
}

/**
 * Generates realistic-looking mock price history for demo / first-visit
 * purposes.
 *
 * The price wanders randomly around `currentPrice` within roughly ±5-15 % of
 * the starting value. Short "stable" stretches are mixed in so the data does
 * not look like pure noise.
 */
export function generateMockHistory(
  currentPrice: number,
  retailer: string,
  days: number
): PriceHistoryEntry[] {
  const entries: PriceHistoryEntry[] = [];
  const today = new Date();

  // We'll walk backwards from today.  Start from a price that is slightly
  // different from the current price so the most-recent entry can land close
  // to `currentPrice`.
  let price = currentPrice * (1 + (Math.random() * 0.1 - 0.05)); // ±5 %

  // Pre-generate all prices first (walking backwards), then reverse so we can
  // ensure the final entry equals `currentPrice`.
  const prices: number[] = [];

  for (let i = days - 1; i >= 0; i--) {
    if (i === 0) {
      // Most recent day should match the supplied current price exactly.
      prices.push(currentPrice);
      continue;
    }

    // Decide whether this stretch is "stable" (small jitter) or "moving".
    const isStable = Math.random() < 0.35;

    if (isStable) {
      // Tiny jitter ≤ 0.5 %
      const jitter = price * (Math.random() * 0.005 - 0.0025);
      price = Math.round((price + jitter) * 100) / 100;
    } else {
      // Larger move: up to ±3 % per day
      const delta = price * (Math.random() * 0.06 - 0.03);
      price = Math.round((price + delta) * 100) / 100;
    }

    // Clamp so we stay within roughly ±15 % of the current price
    const low = currentPrice * 0.85;
    const high = currentPrice * 1.15;
    price = Math.max(low, Math.min(high, price));

    prices.push(price);
  }

  // `prices` is in reverse-chronological order (index 0 = oldest when
  // reversed).  Reverse it so index 0 = oldest.
  prices.reverse();

  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    entries.push({
      date: d.toISOString().slice(0, 10),
      price: prices[i],
      retailer,
    });
  }

  return entries;
}
