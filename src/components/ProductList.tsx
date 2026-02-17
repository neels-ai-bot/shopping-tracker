"use client";

import { useState } from "react";
import { ProductResult, Retailer } from "@/types";
import {
  formatPrice,
  retailerDisplayName,
  retailerColor,
  retailerTextColor,
} from "@/lib/utils";
import { ShoppingCart, Bell, ExternalLink, Share2, DollarSign, Heart } from "lucide-react";
import { addFavorite, removeFavorite } from "@/lib/favorites";

const DEFAULT_RETAILERS: Retailer[] = ["walmart", "target", "amazon", "costco", "kroger", "wholefoods", "traderjoes"];

interface GroupedProduct {
  name: string;
  upc?: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  packageSize?: string;
  prices: Map<Retailer, ProductResult>;
  bestRetailer: Retailer;
  bestPrice: number;
  bestUnitPriceRetailer?: Retailer;
  bestUnitPrice?: number;
}

interface ProductListProps {
  products: ProductResult[];
  availableRetailers?: Retailer[];
  onAddToList?: (product: ProductResult) => void;
  onSetAlert?: (product: ProductResult) => void;
}

/**
 * Group flat product results so the same product across different retailers
 * appears as one row. Groups by UPC (exact match only). Different SKUs
 * (different UPC or different package size) stay as separate rows.
 */
function groupProducts(products: ProductResult[]): GroupedProduct[] {
  const groups: GroupedProduct[] = [];
  const upcMap = new Map<string, number>(); // upc -> group index

  for (const product of products) {
    let groupIndex = -1;

    // Only group by exact UPC match — this ensures different SKUs stay separate
    if (product.upc && upcMap.has(product.upc)) {
      groupIndex = upcMap.get(product.upc)!;
      // Extra guard: don't merge if already has this retailer (different listing)
      if (groups[groupIndex].prices.has(product.retailer)) {
        groupIndex = -1;
      }
    }

    if (groupIndex !== -1) {
      // Add to existing group (same product, different retailer)
      const group = groups[groupIndex];
      group.prices.set(product.retailer, product);
      if (!group.imageUrl && product.imageUrl) group.imageUrl = product.imageUrl;
      if (product.price < group.bestPrice) {
        group.bestPrice = product.price;
        group.bestRetailer = product.retailer;
      }
      if (product.unitPrice != null && (group.bestUnitPrice == null || product.unitPrice < group.bestUnitPrice)) {
        group.bestUnitPrice = product.unitPrice;
        group.bestUnitPriceRetailer = product.retailer;
      }
    } else {
      // New product row
      const prices = new Map<Retailer, ProductResult>();
      prices.set(product.retailer, product);
      const newGroup: GroupedProduct = {
        name: product.name,
        upc: product.upc,
        brand: product.brand,
        category: product.category,
        imageUrl: product.imageUrl,
        packageSize: product.packageSize,
        prices,
        bestRetailer: product.retailer,
        bestPrice: product.price,
        bestUnitPriceRetailer: product.unitPrice != null ? product.retailer : undefined,
        bestUnitPrice: product.unitPrice,
      };
      const idx = groups.length;
      groups.push(newGroup);
      if (product.upc) upcMap.set(product.upc, idx);
    }
  }

  return groups;
}

const shareProduct = async (name: string, price: number, retailer: string) => {
  const text = `${name} - $${price.toFixed(2)} at ${retailer}. Found on Shopping Tracker!`;
  if (navigator.share) {
    try { await navigator.share({ title: name, text }); } catch { /* user cancelled */ }
  } else {
    await navigator.clipboard.writeText(text);
  }
};

export default function ProductList({
  products,
  availableRetailers,
  onAddToList,
  onSetAlert,
}: ProductListProps) {
  const [sortByUnitPrice, setSortByUnitPrice] = useState(false);
  const [favSet, setFavSet] = useState<Set<string>>(() => new Set());

  const toggleFavorite = (group: GroupedProduct) => {
    const id = group.upc || group.name;
    const best = group.prices.get(group.bestRetailer)!;
    if (favSet.has(id)) {
      removeFavorite(id);
      setFavSet((prev) => { const next = new Set(prev); next.delete(id); return next; });
    } else {
      addFavorite({
        id,
        name: group.name,
        brand: group.brand,
        category: group.category,
        price: best.price,
        retailer: retailerDisplayName(group.bestRetailer),
      });
      setFavSet((prev) => new Set(prev).add(id));
    }
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-lg">No products found</p>
        <p className="text-sm mt-1">Try a different search term</p>
      </div>
    );
  }

  const retailers = availableRetailers ?? DEFAULT_RETAILERS;
  const grouped = groupProducts(products);

  // When sorting by unit price, sort the groups so the one with the best unit price comes first
  const sortedGroups = sortByUnitPrice
    ? [...grouped].sort((a, b) => (a.bestUnitPrice ?? Infinity) - (b.bestUnitPrice ?? Infinity))
    : grouped;

  return (
    <div className="space-y-4">
      {/* Sort toggle: segmented control */}
      <div className="flex items-center gap-1">
        <DollarSign className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-1" />
        <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Sort by:</span>
        <div className="inline-flex rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
          <button
            onClick={() => setSortByUnitPrice(false)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              !sortByUnitPrice
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"
            }`}
          >
            Total Price
          </button>
          <button
            onClick={() => setSortByUnitPrice(true)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              sortByUnitPrice
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"
            }`}
          >
            Unit Price
          </button>
        </div>
      </div>

      {sortedGroups.map((group, index) => {
        const sortedPrices = retailers
          .filter((r) => group.prices.has(r))
          .map((r) => ({ retailer: r, product: group.prices.get(r)! }))
          .sort((a, b) =>
            sortByUnitPrice
              ? (a.product.unitPrice ?? Infinity) - (b.product.unitPrice ?? Infinity)
              : a.product.price - b.product.price
          );

        // Whether the best unit-price retailer differs from the best total-price retailer
        const bestValueDiffers =
          group.bestUnitPriceRetailer != null &&
          group.bestUnitPriceRetailer !== group.bestRetailer;

        return (
          <div
            key={group.upc || `${group.name}-${index}`}
            className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden"
          >
            {/* Product Header */}
            <div className="flex items-center gap-4 p-4">
              <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                {group.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={group.imageUrl}
                    alt={group.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ShoppingCart className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {group.brand ? `${group.brand} — ` : ""}
                  {stripBrand(group.name, group.brand)}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {group.packageSize && <span>{group.packageSize}</span>}
                  {group.category && (
                    <>
                      {group.packageSize && <span className="text-gray-300">·</span>}
                      <span>{group.category}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 flex items-center gap-1">
                {onAddToList && (
                  <button
                    onClick={() => onAddToList(group.prices.values().next().value!)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    title="Add to list"
                  >
                    <ShoppingCart className="h-4 w-4 text-gray-600" />
                  </button>
                )}
                {onSetAlert && (
                  <button
                    onClick={() => onSetAlert(group.prices.values().next().value!)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    title="Set price alert"
                  >
                    <Bell className="h-4 w-4 text-gray-600" />
                  </button>
                )}
                <button
                  onClick={() => toggleFavorite(group)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                  title={favSet.has(group.upc || group.name) ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart className={`h-4 w-4 ${favSet.has(group.upc || group.name) ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
                </button>
                <button
                  onClick={() => {
                    const best = group.prices.get(group.bestRetailer)!;
                    shareProduct(group.name, best.price, retailerDisplayName(group.bestRetailer));
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                  title="Share product"
                >
                  <Share2 className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Retailer Price Row — scrollable on mobile */}
            <div
              className="border-t border-gray-100 dark:border-slate-700 px-4 py-3 flex gap-2 overflow-x-auto sm:grid"
              style={{ gridTemplateColumns: `repeat(${retailers.length}, minmax(0, 1fr))` }}
            >
              {retailers.map((retailer) => {
                const entry = group.prices.get(retailer);
                const isBest = retailer === group.bestRetailer && sortedPrices.length > 1;
                const isBestValue =
                  bestValueDiffers &&
                  retailer === group.bestUnitPriceRetailer &&
                  sortedPrices.length > 1;

                return (
                  <div
                    key={retailer}
                    className={`rounded-xl px-2 py-2 text-center transition-all min-w-[70px] ${
                      entry
                        ? isBest
                          ? "bg-green-50 ring-1 ring-green-300"
                          : isBestValue
                            ? "bg-purple-50 ring-1 ring-purple-300"
                            : "bg-gray-50 dark:bg-slate-800/50"
                        : "bg-gray-50 dark:bg-slate-800/50 opacity-40"
                    }`}
                  >
                    {/* Retailer label */}
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <div
                        className={`w-2 h-2 rounded-full ${retailerColor(retailer)}`}
                      />
                      <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate">
                        {retailerDisplayName(retailer)}
                      </span>
                    </div>

                    {entry ? (
                      <>
                        <p
                          className={`text-base font-bold ${
                            isBest ? "text-green-700" : "text-gray-900 dark:text-gray-100"
                          }`}
                        >
                          {formatPrice(entry.price)}
                        </p>
                        {entry.unitPrice != null && (
                          <p
                            className={
                              sortByUnitPrice
                                ? "text-sm font-semibold text-gray-700 dark:text-gray-200"
                                : "text-[10px] text-gray-400 dark:text-gray-500"
                            }
                          >
                            ${entry.unitPrice.toFixed(2)}/oz
                          </p>
                        )}
                        {isBest && (
                          <span className="inline-block mt-1 text-[9px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">
                            BEST
                          </span>
                        )}
                        {isBestValue && (
                          <span className="inline-block mt-1 text-[9px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full">
                            BEST VALUE
                          </span>
                        )}
                        {entry.url && (
                          <a
                            href={entry.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-0.5 mt-1 text-[10px] ${retailerTextColor(retailer)} hover:underline`}
                          >
                            View <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">N/A</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Savings summary */}
            {sortedPrices.length > 1 && (
              <div className="border-t border-gray-100 dark:border-slate-700 px-4 py-2 bg-gray-50 dark:bg-slate-800/50 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
                <span>
                  Best at{" "}
                  <span className={`font-semibold ${retailerTextColor(group.bestRetailer)}`}>
                    {retailerDisplayName(group.bestRetailer)}
                  </span>
                </span>
                <span className="font-semibold text-green-600">
                  Save{" "}
                  {formatPrice(
                    sortedPrices[sortedPrices.length - 1].product.price -
                      sortedPrices[0].product.price
                  )}{" "}
                  vs {retailerDisplayName(sortedPrices[sortedPrices.length - 1].retailer)}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Remove brand name prefix from product name to avoid redundancy */
function stripBrand(name: string, brand?: string): string {
  if (!brand) return name;
  const lower = name.toLowerCase();
  const brandLower = brand.toLowerCase();
  if (lower.startsWith(brandLower)) {
    return name.slice(brand.length).replace(/^[\s\-—]+/, "").trim() || name;
  }
  return name;
}
