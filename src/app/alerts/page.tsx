"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PriceAlert, Retailer } from "@/types";
import { formatPrice, retailerDisplayName, retailerColor } from "@/lib/utils";
import { Bell, BellOff, Trash2, Plus, Check, Target } from "lucide-react";

function AlertsContent() {
  const searchParams = useSearchParams();
  const productParam = searchParams.get("product");
  const priceParam = searchParams.get("price");

  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(!!productParam);

  const [searchQuery, setSearchQuery] = useState(productParam || "");
  const [targetPrice, setTargetPrice] = useState(
    priceParam ? (parseFloat(priceParam) * 0.9).toFixed(2) : ""
  );
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | "any">("any");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/alerts");
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const createAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery || !targetPrice) return;

    setCreating(true);
    try {
      const searchRes = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&retailers=walmart`
      );
      const searchData = await searchRes.json();
      const product = searchData.products?.[0];

      if (!product) {
        alert("Product not found. Try a different search term.");
        return;
      }

      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.upc || searchQuery,
          targetPrice: parseFloat(targetPrice),
          retailer: selectedRetailer === "any" ? null : selectedRetailer,
        }),
      });

      if (res.ok) {
        setShowCreateForm(false);
        setSearchQuery("");
        setTargetPrice("");
        fetchAlerts();
      }
    } catch {
      // Ignore
    } finally {
      setCreating(false);
    }
  };

  const toggleAlert = async (alertId: string, active: boolean) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, active } : a))
    );
    try {
      await fetch("/api/alerts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId, active }),
      });
    } catch {
      fetchAlerts();
    }
  };

  const deleteAlert = async (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    try {
      await fetch(`/api/alerts?id=${alertId}`, { method: "DELETE" });
    } catch {
      fetchAlerts();
    }
  };

  const activeAlerts = alerts.filter((a) => a.active && !a.triggered);
  const triggeredAlerts = alerts.filter((a) => a.triggered);
  const inactiveAlerts = alerts.filter((a) => !a.active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            Price Alerts
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Get notified when prices drop to your target
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          New Alert
        </button>
      </div>

      {/* Create Alert Form */}
      {showCreateForm && (
        <form
          onSubmit={createAlert}
          className="p-4 rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 space-y-3"
        >
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Create Price Alert</h3>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Product name..."
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                Target Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                Store
              </label>
              <select
                value={selectedRetailer}
                onChange={(e) =>
                  setSelectedRetailer(e.target.value as Retailer | "any")
                }
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
              >
                <option value="any">Any Store</option>
                <option value="walmart">Walmart</option>
                <option value="target">Target</option>
                <option value="amazon">Amazon</option>
                <option value="costco">Costco</option>
                <option value="kroger">Kroger</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {creating ? "Creating..." : "Create Alert"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="w-10 h-10 rounded-lg skeleton" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded skeleton" />
                <div className="h-3 w-28 rounded skeleton" />
              </div>
            </div>
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-lg">No alerts yet</p>
          <p className="text-sm mt-1">
            Create an alert to get notified when prices drop
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {triggeredAlerts.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Check className="h-4 w-4" />
                Triggered ({triggeredAlerts.length})
              </h2>
              <div className="space-y-2">
                {triggeredAlerts.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} onToggle={toggleAlert} onDelete={deleteAlert} />
                ))}
              </div>
            </div>
          )}

          {activeAlerts.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Bell className="h-4 w-4" />
                Active ({activeAlerts.length})
              </h2>
              <div className="space-y-2">
                {activeAlerts.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} onToggle={toggleAlert} onDelete={deleteAlert} />
                ))}
              </div>
            </div>
          )}

          {inactiveAlerts.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <BellOff className="h-4 w-4" />
                Inactive ({inactiveAlerts.length})
              </h2>
              <div className="space-y-2">
                {inactiveAlerts.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} onToggle={toggleAlert} onDelete={deleteAlert} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AlertCard({
  alert,
  onToggle,
  onDelete,
}: {
  alert: PriceAlert;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border shadow-sm ${
        alert.triggered
          ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
          : alert.active
            ? "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            : "border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 opacity-60"
      }`}
    >
      <div
        className={`p-2 rounded-lg ${
          alert.triggered ? "bg-green-100 dark:bg-green-900/40" : "bg-blue-50 dark:bg-blue-900/30"
        }`}
      >
        <Target
          className={`h-5 w-5 ${
            alert.triggered ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"
          }`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
          {alert.productName}
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>Target: {formatPrice(alert.targetPrice)}</span>
          {alert.retailer && (
            <>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${retailerColor(alert.retailer)}`} />
                {retailerDisplayName(alert.retailer)}
              </span>
            </>
          )}
          {alert.currentPrice !== undefined && (
            <>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span>Now: {formatPrice(alert.currentPrice)}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onToggle(alert.id, !alert.active)}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          title={alert.active ? "Pause alert" : "Resume alert"}
        >
          {alert.active ? (
            <BellOff className="h-4 w-4 text-gray-400" />
          ) : (
            <Bell className="h-4 w-4 text-blue-500" />
          )}
        </button>
        <button
          onClick={() => onDelete(alert.id)}
          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </button>
      </div>
    </div>
  );
}

export default function AlertsPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-gray-500 dark:text-gray-400">Loading...</div>}>
      <AlertsContent />
    </Suspense>
  );
}
