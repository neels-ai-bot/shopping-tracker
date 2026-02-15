"use client";

import { useState } from "react";
import { Bell, X } from "lucide-react";
import { Retailer } from "@/types";
import { retailerDisplayName } from "@/lib/utils";
import { RETAILER_CONFIGS } from "@/lib/retailer-config";

interface AlertFormProps {
  productName: string;
  productId: string;
  currentPrice?: number;
  onSubmit: (data: {
    productId: string;
    targetPrice: number;
    retailer?: Retailer;
  }) => void;
  onClose: () => void;
}

const RETAILERS: (Retailer | "any")[] = [
  "any",
  ...(Object.keys(RETAILER_CONFIGS) as Retailer[]),
];

export default function AlertForm({
  productName,
  productId,
  currentPrice,
  onSubmit,
  onClose,
}: AlertFormProps) {
  const [targetPrice, setTargetPrice] = useState(
    currentPrice ? (currentPrice * 0.9).toFixed(2) : ""
  );
  const [retailer, setRetailer] = useState<Retailer | "any">("any");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) return;

    onSubmit({
      productId,
      targetPrice: price,
      retailer: retailer === "any" ? undefined : retailer,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Set Price Alert</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <p className="text-sm text-gray-500">Product</p>
            <p className="font-medium text-gray-900">{productName}</p>
            {currentPrice && (
              <p className="text-sm text-gray-500 mt-1">
                Current price: ${currentPrice.toFixed(2)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alert me when price drops to:
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              At which store?
            </label>
            <select
              value={retailer}
              onChange={(e) => setRetailer(e.target.value as Retailer | "any")}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              {RETAILERS.map((r) => (
                <option key={r} value={r}>
                  {r === "any" ? "Any Store" : retailerDisplayName(r)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            Create Alert
          </button>
        </form>
      </div>
    </div>
  );
}
