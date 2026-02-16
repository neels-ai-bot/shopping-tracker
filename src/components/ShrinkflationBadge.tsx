"use client";

import { ShrinkflationAlert } from "@/types";
import { AlertTriangle, TrendingDown } from "lucide-react";

interface ShrinkflationBadgeProps {
  alert: ShrinkflationAlert;
  compact?: boolean;
}

export default function ShrinkflationBadge({
  alert,
  compact = false,
}: ShrinkflationBadgeProps) {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs font-medium">
        <AlertTriangle className="h-3 w-3" />
        Shrinkflation
      </span>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
          <TrendingDown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-2">
            Shrinkflation Detected
            <AlertTriangle className="h-4 w-4" />
          </h4>
          <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
            <span className="font-medium">{alert.productName}</span> decreased
            from {alert.previousSize} to {alert.currentSize}
          </p>
          <div className="flex gap-4 mt-2 flex-wrap">
            <div className="text-sm">
              <span className="text-amber-600 dark:text-amber-400">Size change:</span>{" "}
              <span className="font-semibold text-amber-900 dark:text-amber-200">
                {(
                  ((alert.currentSizeOz - alert.previousSizeOz) /
                    alert.previousSizeOz) *
                  100
                ).toFixed(1)}
                %
              </span>
            </div>
            <div className="text-sm">
              <span className="text-amber-600 dark:text-amber-400">Price change:</span>{" "}
              <span className="font-semibold text-amber-900 dark:text-amber-200">
                {alert.priceChange > 0 ? "+" : ""}
                {alert.priceChange}%
              </span>
            </div>
            <div className="text-sm">
              <span className="text-amber-600 dark:text-amber-400">Effective increase:</span>{" "}
              <span className="font-bold text-red-600 dark:text-red-400">
                +{alert.effectivePriceChange}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
