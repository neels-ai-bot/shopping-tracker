"use client";

import { RetailerPrice } from "@/types";
import { formatPrice, formatUnitPrice, retailerDisplayName, retailerColor } from "@/lib/utils";
import { ExternalLink, Check, X } from "lucide-react";

interface PriceCardProps {
  price: RetailerPrice;
  isBest?: boolean;
}

export default function PriceCard({ price, isBest = false }: PriceCardProps) {
  return (
    <div
      className={`relative rounded-xl border p-4 transition-all ${
        isBest
          ? "border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md ring-2 ring-green-200 dark:ring-green-800"
          : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md"
      }`}
    >
      {isBest && (
        <div className="absolute -top-3 left-4 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
          Best Price
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${retailerColor(price.retailer)}`}
          />
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {retailerDisplayName(price.retailer)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {price.inStock ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <X className="h-4 w-4 text-red-500" />
          )}
          <span
            className={`text-xs ${
              price.inStock ? "text-green-600" : "text-red-600"
            }`}
          >
            {price.inStock ? "In Stock" : "Out of Stock"}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatPrice(price.price)}
          </p>
          {price.unitPrice && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatUnitPrice(price.unitPrice)}
            </p>
          )}
        </div>

        {price.url && (
          <a
            href={price.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            View <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}
