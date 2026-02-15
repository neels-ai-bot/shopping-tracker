"use client";

import { useState, useEffect } from "react";
import ShrinkflationBadge from "@/components/ShrinkflationBadge";
import { ShrinkflationAlert, SizeHistoryEntry } from "@/types";
import { TrendingDown, Package, AlertTriangle, Info } from "lucide-react";

// Demo data for the shrinkflation tracker
const DEMO_ALERTS: ShrinkflationAlert[] = [
  {
    productName: "Doritos Nacho Cheese",
    previousSize: "10.5 oz",
    currentSize: "9.25 oz",
    previousSizeOz: 10.5,
    currentSizeOz: 9.25,
    priceChange: 0,
    effectivePriceChange: 13.5,
  },
  {
    productName: "Charmin Ultra Soft (Mega Roll)",
    previousSize: "352 sheets",
    currentSize: "264 sheets",
    previousSizeOz: 352,
    currentSizeOz: 264,
    priceChange: 5.0,
    effectivePriceChange: 40.2,
  },
  {
    productName: "Tillamook Ice Cream",
    previousSize: "56 oz",
    currentSize: "48 oz",
    previousSizeOz: 56,
    currentSizeOz: 48,
    priceChange: 0,
    effectivePriceChange: 16.7,
  },
  {
    productName: "Gatorade",
    previousSize: "32 oz",
    currentSize: "28 oz",
    previousSizeOz: 32,
    currentSizeOz: 28,
    priceChange: 0,
    effectivePriceChange: 14.3,
  },
  {
    productName: "Folgers Coffee",
    previousSize: "51 oz",
    currentSize: "43.5 oz",
    previousSizeOz: 51,
    currentSizeOz: 43.5,
    priceChange: 2.0,
    effectivePriceChange: 19.2,
  },
];

const DEMO_HISTORY: SizeHistoryEntry[] = [
  { date: "2024-01-15", packageSize: "10.5 oz", sizeOz: 10.5, price: 4.29, pricePerOz: 0.41, retailer: "walmart" },
  { date: "2024-04-20", packageSize: "10.5 oz", sizeOz: 10.5, price: 4.49, pricePerOz: 0.43, retailer: "walmart" },
  { date: "2024-07-10", packageSize: "9.75 oz", sizeOz: 9.75, price: 4.49, pricePerOz: 0.46, retailer: "walmart" },
  { date: "2024-10-05", packageSize: "9.25 oz", sizeOz: 9.25, price: 4.49, pricePerOz: 0.49, retailer: "walmart" },
  { date: "2025-01-15", packageSize: "9.25 oz", sizeOz: 9.25, price: 4.29, pricePerOz: 0.46, retailer: "walmart" },
];

export default function ShrinkflationPage() {
  const [alerts, setAlerts] = useState<ShrinkflationAlert[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load shrinkflation data - fall back to demo data
    setAlerts(DEMO_ALERTS);
    setLoading(false);
  }, []);

  const selectedHistory = selectedProduct === "Doritos Nacho Cheese" ? DEMO_HISTORY : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Shrinkflation Tracker
        </h1>
        <p className="text-gray-500">
          Products that got smaller while prices stayed the same (or increased)
        </p>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
        <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-medium">What is shrinkflation?</p>
          <p className="mt-1">
            Shrinkflation is when companies reduce the size or quantity of a
            product while keeping the price the same (or even increasing it).
            This effectively raises the per-unit price without changing the
            sticker price.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm text-center">
          <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
          <p className="text-xs text-gray-500">Products Detected</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm text-center">
          <TrendingDown className="h-6 w-6 text-red-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">
            {alerts.length > 0
              ? `${Math.round(alerts.reduce((sum, a) => sum + Math.abs((a.currentSizeOz - a.previousSizeOz) / a.previousSizeOz * 100), 0) / alerts.length)}%`
              : "0%"}
          </p>
          <p className="text-xs text-gray-500">Avg Size Reduction</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm text-center">
          <Package className="h-6 w-6 text-blue-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">
            {alerts.length > 0
              ? `+${Math.round(alerts.reduce((sum, a) => sum + a.effectivePriceChange, 0) / alerts.length)}%`
              : "0%"}
          </p>
          <p className="text-xs text-gray-500">Avg Effective Increase</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-lg">No shrinkflation detected yet</p>
          <p className="text-sm mt-1">
            Products will appear here as we track size changes over time
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <div key={index}>
              <button
                onClick={() =>
                  setSelectedProduct(
                    selectedProduct === alert.productName
                      ? null
                      : alert.productName
                  )
                }
                className="w-full text-left"
              >
                <ShrinkflationBadge alert={alert} />
              </button>

              {/* Size History Chart (simplified) */}
              {selectedProduct === alert.productName &&
                selectedHistory.length > 0 && (
                  <div className="mt-2 p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Size & Price History
                    </h4>
                    <div className="space-y-2">
                      {selectedHistory.map((entry, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 text-sm"
                        >
                          <span className="text-gray-400 w-24 flex-shrink-0">
                            {entry.date}
                          </span>
                          <div className="flex-1 flex items-center gap-2">
                            <div
                              className="h-3 rounded-full bg-blue-400"
                              style={{
                                width: `${(entry.sizeOz / selectedHistory[0].sizeOz) * 100}%`,
                              }}
                            />
                            <span className="text-gray-600 flex-shrink-0">
                              {entry.packageSize}
                            </span>
                          </div>
                          <span className="text-gray-900 font-medium w-16 text-right flex-shrink-0">
                            ${entry.price.toFixed(2)}
                          </span>
                          <span className="text-gray-500 w-20 text-right flex-shrink-0">
                            ${entry.pricePerOz.toFixed(2)}/oz
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
