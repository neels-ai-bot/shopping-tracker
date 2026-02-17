"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import PriceCard from "@/components/PriceCard";
import ShrinkflationBadge from "@/components/ShrinkflationBadge";
import { ComparisonResult } from "@/types";
import { formatPrice, retailerDisplayName } from "@/lib/utils";
import { ShoppingCart, TrendingUp } from "lucide-react";
import PriceHistoryChart from "@/components/PriceHistoryChart";

function CompareContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (query: string) => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/compare?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setComparison(data.comparison || null);
    } catch {
      setComparison(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) handleSearch(initialQuery);
  }, [initialQuery]);

  const sortedPrices = comparison?.prices
    ? [...comparison.prices].sort((a, b) => a.price - b.price)
    : [];

  const savingsVsHighest =
    sortedPrices.length >= 2
      ? sortedPrices[sortedPrices.length - 1].price - sortedPrices[0].price
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
          Price Comparison
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Compare prices for a product across all retailers
        </p>
      </div>

      <SearchBar
        onSearch={handleSearch}
        placeholder="Search for a product to compare..."
        loading={loading}
      />

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full skeleton" />
                  <div className="h-4 w-24 rounded skeleton" />
                </div>
                <div className="h-3 w-16 rounded skeleton" />
              </div>
              <div className="mt-3">
                <div className="h-7 w-20 rounded skeleton" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && searched && !comparison && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-lg">No results found</p>
          <p className="text-sm mt-1">Try a different product name</p>
        </div>
      )}

      {!loading && comparison && (
        <div className="space-y-6">
          {/* Product Info */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
            <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {comparison.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={comparison.imageUrl}
                  alt={comparison.productName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ShoppingCart className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {comparison.productName}
              </h2>
              {comparison.upc && (
                <p className="text-sm text-gray-400 dark:text-gray-500">UPC: {comparison.upc}</p>
              )}
              {savingsVsHighest > 0 && (
                <div className="flex items-center gap-1 mt-1 text-green-600 dark:text-green-400">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-semibold">
                    Save up to {formatPrice(savingsVsHighest)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Shrinkflation Alert */}
          {comparison.shrinkflationAlert && (
            <ShrinkflationBadge alert={comparison.shrinkflationAlert} />
          )}

          {/* Price Cards */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Prices by Retailer
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sortedPrices.map((price, index) => (
                <PriceCard
                  key={price.retailer}
                  price={price}
                  isBest={index === 0}
                />
              ))}
            </div>
          </div>

          {/* Price History */}
          {comparison.upc && sortedPrices.length > 0 && (
            <PriceHistoryChart
              productId={comparison.upc}
              currentPrice={sortedPrices[0].price}
              retailer={sortedPrices[0].retailer}
            />
          )}

          {/* Brand Equivalents */}
          {comparison.equivalents && comparison.equivalents.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Store-Brand Alternatives
              </h3>
              <div className="space-y-2">
                {comparison.equivalents.map((eq, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{eq.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {retailerDisplayName(eq.store)} ·{" "}
                        {Math.round(eq.confidence * 100)}% match
                      </p>
                    </div>
                    {eq.price > 0 && (
                      <span className="font-bold text-gray-900 dark:text-gray-100">
                        {formatPrice(eq.price)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-gray-500 dark:text-gray-400">Loading...</div>}>
      <CompareContent />
    </Suspense>
  );
}
