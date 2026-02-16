"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ShoppingListComponent from "@/components/ShoppingList";
import ReceiptScanner from "@/components/ReceiptScanner";
import { ShoppingListItem, OptimizedRoute } from "@/types";
import {
  formatPrice,
  retailerDisplayName,
  retailerColor,
} from "@/lib/utils";
import { FileText, Store, DollarSign, MapPin } from "lucide-react";

function ListContent() {
  const searchParams = useSearchParams();
  const addItem = searchParams.get("add");

  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [routes, setRoutes] = useState<OptimizedRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [tripCost, setTripCost] = useState(5);
  const [listId, setListId] = useState<string | null>(null);

  useEffect(() => {
    loadList();
  }, []);

  useEffect(() => {
    if (addItem && !items.some((i) => i.name === addItem)) {
      handleAddItem(addItem);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addItem]);

  const loadList = async () => {
    try {
      const res = await fetch("/api/list");
      const data = await res.json();
      if (data.lists && data.lists.length > 0) {
        const list = data.lists[0];
        setListId(list.id);
        setItems(
          list.items.map((item: { id: string; name: string; quantity: number; productId?: string }) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            productId: item.productId,
          }))
        );
      }
    } catch {
      // First time, no list yet
    }
  };

  const handleAddItem = async (name: string) => {
    const tempId = `temp-${Date.now()}`;
    const newItem: ShoppingListItem = { id: tempId, name, quantity: 1 };
    setItems((prev) => [...prev, newItem]);

    try {
      if (!listId) {
        const res = await fetch("/api/list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "My Shopping List", items: [{ name }] }),
        });
        const data = await res.json();
        setListId(data.list.id);
        setItems(
          data.list.items.map((item: { id: string; name: string; quantity: number }) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
          }))
        );
      } else {
        const res = await fetch("/api/list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "addItem", listId, name }),
        });
        const data = await res.json();
        setItems((prev) =>
          prev.map((i) =>
            i.id === tempId ? { ...i, id: data.item.id } : i
          )
        );
      }
    } catch {
      // Keep optimistic update
    }
  };

  const handleRemoveItem = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await fetch(`/api/list?itemId=${id}`, { method: "DELETE" });
    } catch {
      // Ignore
    }
  };

  const handleUpdateQuantity = async (id: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    );
    try {
      await fetch("/api/list", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: id, quantity }),
      });
    } catch {
      // Ignore
    }
  };

  const handleOptimize = async () => {
    setLoading(true);
    setRoutes([]);

    try {
      const itemPrices = await Promise.all(
        items.map(async (item) => {
          const res = await fetch(
            `/api/search?q=${encodeURIComponent(item.name)}`
          );
          const data = await res.json();
          const prices = (data.products || []).map(
            (p: { retailer: string; price: number; unitPrice?: number; inStock: boolean }) => ({
              retailer: p.retailer,
              price: p.price,
              unitPrice: p.unitPrice,
              inStock: p.inStock,
            })
          );
          return { name: item.name, quantity: item.quantity, prices };
        })
      );

      const { optimizeList } = await import("@/lib/optimizer");
      const optimized = optimizeList(itemPrices, tripCost);
      setRoutes(optimized);
    } catch {
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReceiptItems = (receiptItems: string[]) => {
    setShowReceipt(false);
    for (const item of receiptItems) {
      handleAddItem(item);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            Shopping List
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Build your list and find the best store combination
          </p>
        </div>
        <button
          onClick={() => setShowReceipt(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          <FileText className="h-4 w-4" />
          Scan Receipt
        </button>
      </div>

      {/* Trip Cost Setting */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
        <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Extra store trip cost:
            <span className="font-bold ml-1">${tripCost}</span>
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            Accounts for gas/time when splitting across stores
          </p>
        </div>
        <input
          type="range"
          min="0"
          max="20"
          step="1"
          value={tripCost}
          onChange={(e) => setTripCost(parseInt(e.target.value))}
          className="w-24"
        />
      </div>

      <ShoppingListComponent
        items={items}
        onAddItem={handleAddItem}
        onRemoveItem={handleRemoveItem}
        onUpdateQuantity={handleUpdateQuantity}
        onOptimize={handleOptimize}
        loading={loading}
      />

      {/* Optimization Results */}
      {routes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Optimized Shopping Routes
          </h2>
          {routes.map((route, index) => (
            <div
              key={index}
              className={`p-4 rounded-2xl border shadow-sm ${
                index === 0
                  ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20"
                  : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              }`}
            >
              {index === 0 && (
                <div className="inline-block px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full mb-2">
                  Best Option
                </div>
              )}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
                    {route.strategy.replace(/-/g, " ")}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {route.stores.map((store) => (
                      <span
                        key={store.retailer}
                        className="inline-flex items-center gap-1 text-xs"
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${retailerColor(store.retailer)}`}
                        />
                        <span className="text-gray-600 dark:text-gray-400">
                          {retailerDisplayName(store.retailer)}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatPrice(route.effectiveCost)}
                  </p>
                  {route.savings > 0 && (
                    <p className="text-sm text-green-600 dark:text-green-400 font-semibold">
                      Save {formatPrice(route.savings)}
                    </p>
                  )}
                </div>
              </div>

              {/* Store breakdown */}
              <div className="space-y-2">
                {route.stores.map((store) => (
                  <div
                    key={store.retailer}
                    className="text-sm border-t border-gray-200 dark:border-slate-700 pt-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                        <Store className="h-3.5 w-3.5" />
                        {retailerDisplayName(store.retailer)}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatPrice(store.subtotal)}
                      </span>
                    </div>
                    <div className="ml-5 mt-0.5 text-gray-500 dark:text-gray-400 text-xs">
                      {store.items.map((item) => (
                        <span key={item.name}>
                          {item.name} x{item.quantity} ({formatPrice(item.price)})
                          {" · "}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between text-sm border-t border-gray-200 dark:border-slate-700 pt-2">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5" />
                    Trip cost ({route.stores.length} store{route.stores.length > 1 ? "s" : ""})
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">{formatPrice(route.tripCost)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Receipt Scanner Modal */}
      {showReceipt && (
        <ReceiptScanner
          onItemsDetected={handleReceiptItems}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
}

export default function ListPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-gray-500 dark:text-gray-400">Loading...</div>}>
      <ListContent />
    </Suspense>
  );
}
