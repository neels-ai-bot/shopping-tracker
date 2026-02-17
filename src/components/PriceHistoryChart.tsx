"use client";

import { useEffect, useMemo, useState } from "react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import {
  getPriceHistory,
  getPriceTrend,
  generateMockHistory,
  savePriceSnapshot,
  type PriceHistoryEntry,
} from "@/lib/price-history";

interface PriceHistoryChartProps {
  productId: string;
  currentPrice: number;
  retailer: string;
}

export default function PriceHistoryChart({
  productId,
  currentPrice,
  retailer,
}: PriceHistoryChartProps) {
  const [history, setHistory] = useState<PriceHistoryEntry[]>([]);
  const [trend, setTrend] = useState<"up" | "down" | "stable" | null>(null);

  useEffect(() => {
    let entries = getPriceHistory(productId);

    // If there is no existing history, seed it with realistic mock data and
    // persist every entry so subsequent visits already have data.
    if (entries.length === 0) {
      const mock = generateMockHistory(currentPrice, retailer, 30);
      mock.forEach((e) => savePriceSnapshot(productId, e.price, e.retailer));
      entries = getPriceHistory(productId);
    }

    setHistory(entries);
    setTrend(getPriceTrend(productId));
  }, [productId, currentPrice, retailer]);

  // Only show the most recent 30 days for the chart.
  const last30 = useMemo(() => {
    return history.slice(-30);
  }, [history]);

  // Compute min / max with their dates.
  const { lowest, highest, minPrice, maxPrice } = useMemo(() => {
    if (last30.length === 0) {
      return { lowest: null, highest: null, minPrice: 0, maxPrice: 0 };
    }

    let lo = last30[0];
    let hi = last30[0];

    for (const entry of last30) {
      if (entry.price < lo.price) lo = entry;
      if (entry.price > hi.price) hi = entry;
    }

    return {
      lowest: lo,
      highest: hi,
      minPrice: lo.price,
      maxPrice: hi.price,
    };
  }, [last30]);

  // For bar height calculation we map prices into a 0-100 % range. If all
  // prices are the same we just show bars at 50 %.
  const priceRange = maxPrice - minPrice;

  function barHeight(price: number): number {
    if (priceRange === 0) return 50;
    return 10 + ((price - minPrice) / priceRange) * 80; // 10-90 %
  }

  function formatDate(iso: string): string {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  if (last30.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      {/* Header row */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-100">
          Price History (30 days)
        </h3>
        <TrendIndicator trend={trend} />
      </div>

      {/* Bar chart */}
      <div className="flex h-24 items-end gap-[2px]">
        {last30.map((entry, i) => {
          const height = barHeight(entry.price);
          const isLowest = lowest !== null && entry.price === lowest.price && entry.date === lowest.date;
          const isHighest = highest !== null && entry.price === highest.price && entry.date === highest.date;

          let bgClass = "bg-blue-400 dark:bg-blue-500";
          if (isLowest) bgClass = "bg-green-500 dark:bg-green-400";
          else if (isHighest) bgClass = "bg-red-400 dark:bg-red-400";

          return (
            <div
              key={entry.date + entry.retailer + i}
              className="group relative flex-1"
              style={{ height: "100%" }}
            >
              {/* Tooltip */}
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block dark:bg-gray-700">
                ${entry.price.toFixed(2)} &mdash; {formatDate(entry.date)}
              </div>

              {/* Bar */}
              <div
                className={`absolute bottom-0 left-0 w-full rounded-t ${bgClass} transition-all`}
                style={{ height: `${height}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
        {lowest && (
          <span>
            Lowest:{" "}
            <span className="font-medium text-green-600 dark:text-green-400">
              ${lowest.price.toFixed(2)}
            </span>{" "}
            on {formatDate(lowest.date)}
          </span>
        )}
        {highest && (
          <span>
            Highest:{" "}
            <span className="font-medium text-red-500 dark:text-red-400">
              ${highest.price.toFixed(2)}
            </span>{" "}
            on {formatDate(highest.date)}
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Trend indicator sub-component                                      */
/* ------------------------------------------------------------------ */

function TrendIndicator({ trend }: { trend: "up" | "down" | "stable" | null }) {
  if (trend === "down") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-400">
        <TrendingDown className="h-3.5 w-3.5" />
        Down
      </span>
    );
  }

  if (trend === "up") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-400">
        <TrendingUp className="h-3.5 w-3.5" />
        Up
      </span>
    );
  }

  if (trend === "stable") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-slate-700 dark:text-gray-400">
        <Minus className="h-3.5 w-3.5" />
        Stable
      </span>
    );
  }

  return null;
}
