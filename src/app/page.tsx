"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import ProductList from "@/components/ProductList";
import BarcodeScanner from "@/components/BarcodeScanner";
import { ProductResult, Retailer } from "@/types";
import { ShoppingCart, BarChart3, Bell, TrendingDown, Zap, MapPin, Clock, X, Flame } from "lucide-react";
import Link from "next/link";

interface LocationInfo {
  city: string;
  region: string;
  country: string;
}

const MAX_RECENT = 8;

const TRENDING_DEALS = [
  { name: "Tide PODS 42ct", retailer: "Walmart", price: 13.97, was: 17.99, pct: 22 },
  { name: "Cheerios 18oz", retailer: "Target", price: 3.49, was: 4.99, pct: 30 },
  { name: "Bounty Paper Towels 6pk", retailer: "Costco", price: 15.99, was: 19.49, pct: 18 },
  { name: "Folgers Coffee 43.5oz", retailer: "Kroger", price: 8.99, was: 12.49, pct: 28 },
  { name: "Organic Whole Milk 1gal", retailer: "Aldi", price: 4.49, was: 5.99, pct: 25 },
  { name: "Colgate Total 5.1oz", retailer: "Amazon", price: 3.99, was: 5.49, pct: 27 },
];

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [availableRetailers, setAvailableRetailers] = useState<Retailer[] | undefined>(undefined);
  const [zip, setZip] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("recentSearches") || "[]");
      if (Array.isArray(saved)) setRecentSearches(saved.slice(0, MAX_RECENT));
    } catch { /* ignore */ }
  }, []);

  const saveRecent = (query: string) => {
    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(0, MAX_RECENT);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  const removeRecent = (query: string) => {
    const updated = recentSearches.filter((s) => s !== query);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  const handleSearch = async (query: string) => {
    setLoading(true);
    setSearched(true);
    saveRecent(query);
    try {
      const params = new URLSearchParams({ q: query });
      if (zip.length === 5) params.set("zip", zip);
      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
      if (data.location) setLocation(data.location);
      if (data.availableRetailers) setAvailableRetailers(data.availableRetailers);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScan = async (barcode: string) => {
    setShowScanner(false);
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/scan?upc=${barcode}`);
      const data = await res.json();
      if (data.product) {
        handleSearch(data.product.name);
        return;
      }
      setProducts([]);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const retailerCount = availableRetailers?.length ?? 7;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      {!searched && (
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Find the Best Prices
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Compare prices across Walmart, Target, Amazon, Costco, Kroger, Whole Foods,
            and your local stores. Save money with whole-list optimization.
          </p>
        </div>
      )}

      {/* Search */}
      <SearchBar
        onSearch={handleSearch}
        onScanBarcode={() => setShowScanner(true)}
        onZipChange={setZip}
        zip={zip}
        loading={loading}
      />

      {/* Recent Searches */}
      {!searched && recentSearches.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          {recentSearches.map((q) => (
            <button
              key={q}
              className="group flex items-center gap-1 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-gray-600 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <span onClick={() => handleSearch(q)}>{q}</span>
              <X
                className="h-3 w-3 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); removeRecent(q); }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                <div className="w-14 h-14 rounded-lg skeleton" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 rounded skeleton" />
                  <div className="h-3 w-32 rounded skeleton" />
                </div>
              </div>
              <div className="border-t border-gray-100 dark:border-slate-700 px-4 py-3 flex gap-2">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="flex-1 h-16 rounded-xl skeleton" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && searched && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {products.length > 0
                ? `Comparing prices across ${new Set(products.map(p => p.retailer)).size} retailers`
                : "No results"}
            </h2>
            {location && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                <MapPin className="h-3.5 w-3.5 text-blue-500" />
                <span>
                  Prices for <span className="font-medium text-gray-700 dark:text-gray-300">{location.city}, {location.region}</span>
                </span>
              </div>
            )}
          </div>
          <ProductList
            products={products}
            availableRetailers={availableRetailers}
            onAddToList={(product) => {
              router.push(`/list?add=${encodeURIComponent(product.name)}`);
            }}
            onSetAlert={(product) => {
              router.push(
                `/alerts?product=${encodeURIComponent(product.name)}&price=${product.price}`
              );
            }}
          />
        </div>
      )}

      {/* Feature Cards (shown before search) */}
      {!searched && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          <Link
            href="/compare"
            className="p-6 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md dark:hover:shadow-slate-800/50 transition-all group"
          >
            <BarChart3 className="h-8 w-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Price Comparison
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              See prices side-by-side across major and local retailers
            </p>
          </Link>

          <Link
            href="/list"
            className="p-6 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md dark:hover:shadow-slate-800/50 transition-all group"
          >
            <ShoppingCart className="h-8 w-8 text-green-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Smart Shopping List
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Build a list and find the cheapest store combination
            </p>
          </Link>

          <Link
            href="/alerts"
            className="p-6 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md dark:hover:shadow-slate-800/50 transition-all group"
          >
            <Bell className="h-8 w-8 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Price Alerts</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Get notified when prices drop to your target
            </p>
          </Link>

          <Link
            href="/shrinkflation"
            className="p-6 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md dark:hover:shadow-slate-800/50 transition-all group"
          >
            <TrendingDown className="h-8 w-8 text-amber-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Shrinkflation Tracker
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Detect when products shrink but prices stay the same
            </p>
          </Link>
        </div>
      )}

      {/* Trending Deals */}
      {!searched && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Flame className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Trending Deals</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {TRENDING_DEALS.map((deal) => (
              <button
                key={deal.name}
                onClick={() => handleSearch(deal.name.split(" ").slice(0, 2).join(" "))}
                className="p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md dark:hover:shadow-slate-800/50 transition-all text-left group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                    {deal.pct}% OFF
                  </span>
                  <span className="text-[10px] text-gray-400">{deal.retailer}</span>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {deal.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-base font-bold text-gray-900 dark:text-gray-100">${deal.price.toFixed(2)}</span>
                  <span className="text-xs text-gray-400 line-through">${deal.was.toFixed(2)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {!searched && (
        <div className="flex items-center justify-center gap-8 py-4 text-sm text-gray-400 dark:text-gray-500">
          <div className="flex items-center gap-1">
            <Zap className="h-4 w-4" />
            <span>{retailerCount}+ Retailers</span>
          </div>
          <div className="flex items-center gap-1">
            <ShoppingCart className="h-4 w-4" />
            <span>List Optimizer</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingDown className="h-4 w-4" />
            <span>Shrinkflation Detection</span>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
