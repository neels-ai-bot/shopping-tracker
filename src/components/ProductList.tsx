"use client";

import { ProductResult, Retailer } from "@/types";
import {
  formatPrice,
  retailerDisplayName,
  retailerColor,
  retailerTextColor,
} from "@/lib/utils";
import { ShoppingCart, Bell, ExternalLink } from "lucide-react";

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
      };
      const idx = groups.length;
      groups.push(newGroup);
      if (product.upc) upcMap.set(product.upc, idx);
    }
  }

  return groups;
}

export default function ProductList({
  products,
  availableRetailers,
  onAddToList,
  onSetAlert,
}: ProductListProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No products found</p>
        <p className="text-sm mt-1">Try a different search term</p>
      </div>
    );
  }

  const retailers = availableRetailers ?? DEFAULT_RETAILERS;
  const grouped = groupProducts(products);

  return (
    <div className="space-y-4">
      {grouped.map((group, index) => {
        const sortedPrices = retailers
          .filter((r) => group.prices.has(r))
          .map((r) => ({ retailer: r, product: group.prices.get(r)! }))
          .sort((a, b) => a.product.price - b.product.price);

        return (
          <div
            key={group.upc || `${group.name}-${index}`}
            className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"
          >
            {/* Product Header */}
            <div className="flex items-center gap-4 p-4">
              <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                {group.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={group.imageUrl}
                    alt={group.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ShoppingCart className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {group.brand ? `${group.brand} — ` : ""}
                  {stripBrand(group.name, group.brand)}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
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
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Add to list"
                  >
                    <ShoppingCart className="h-4 w-4 text-gray-600" />
                  </button>
                )}
                {onSetAlert && (
                  <button
                    onClick={() => onSetAlert(group.prices.values().next().value!)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Set price alert"
                  >
                    <Bell className="h-4 w-4 text-gray-600" />
                  </button>
                )}
              </div>
            </div>

            {/* Retailer Price Row — dynamic columns */}
            <div
              className="border-t border-gray-100 px-4 py-3 grid gap-2 overflow-x-auto"
              style={{ gridTemplateColumns: `repeat(${retailers.length}, minmax(0, 1fr))` }}
            >
              {retailers.map((retailer) => {
                const entry = group.prices.get(retailer);
                const isBest = retailer === group.bestRetailer && sortedPrices.length > 1;

                return (
                  <div
                    key={retailer}
                    className={`rounded-xl px-2 py-2 text-center transition-all min-w-[70px] ${
                      entry
                        ? isBest
                          ? "bg-green-50 ring-1 ring-green-300"
                          : "bg-gray-50"
                        : "bg-gray-50 opacity-40"
                    }`}
                  >
                    {/* Retailer label */}
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <div
                        className={`w-2 h-2 rounded-full ${retailerColor(retailer)}`}
                      />
                      <span className="text-[11px] font-medium text-gray-500 truncate">
                        {retailerDisplayName(retailer)}
                      </span>
                    </div>

                    {entry ? (
                      <>
                        <p
                          className={`text-base font-bold ${
                            isBest ? "text-green-700" : "text-gray-900"
                          }`}
                        >
                          {formatPrice(entry.price)}
                        </p>
                        {entry.unitPrice && (
                          <p className="text-[10px] text-gray-400">
                            ${entry.unitPrice.toFixed(2)}/oz
                          </p>
                        )}
                        {isBest && (
                          <span className="inline-block mt-1 text-[9px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">
                            BEST
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
                      <p className="text-xs text-gray-400 mt-1">N/A</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Savings summary */}
            {sortedPrices.length > 1 && (
              <div className="border-t border-gray-100 px-4 py-2 bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
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
