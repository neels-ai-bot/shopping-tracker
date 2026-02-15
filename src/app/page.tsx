"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import ProductList from "@/components/ProductList";
import BarcodeScanner from "@/components/BarcodeScanner";
import { ProductResult, Retailer } from "@/types";
import { ShoppingCart, BarChart3, Bell, TrendingDown, Zap, MapPin } from "lucide-react";
import Link from "next/link";

interface LocationInfo {
  city: string;
  region: string;
  country: string;
}

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [availableRetailers, setAvailableRetailers] = useState<Retailer[] | undefined>(undefined);
  const [zip, setZip] = useState("");

  const handleSearch = async (query: string) => {
    setLoading(true);
    setSearched(true);
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
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Find the Best Prices
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
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

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500">Searching retailers...</p>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && searched && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <h2 className="text-lg font-semibold text-gray-900">
              {products.length > 0
                ? `Comparing prices across ${new Set(products.map(p => p.retailer)).size} retailers`
                : "No results"}
            </h2>
            {location && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                <MapPin className="h-3.5 w-3.5 text-blue-500" />
                <span>
                  Prices for <span className="font-medium text-gray-700">{location.city}, {location.region}</span>
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
            className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all group"
          >
            <BarChart3 className="h-8 w-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 mb-1">
              Price Comparison
            </h3>
            <p className="text-sm text-gray-500">
              See prices side-by-side across major and local retailers
            </p>
          </Link>

          <Link
            href="/list"
            className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all group"
          >
            <ShoppingCart className="h-8 w-8 text-green-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 mb-1">
              Smart Shopping List
            </h3>
            <p className="text-sm text-gray-500">
              Build a list and find the cheapest store combination
            </p>
          </Link>

          <Link
            href="/alerts"
            className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all group"
          >
            <Bell className="h-8 w-8 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 mb-1">Price Alerts</h3>
            <p className="text-sm text-gray-500">
              Get notified when prices drop to your target
            </p>
          </Link>

          <Link
            href="/shrinkflation"
            className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all group"
          >
            <TrendingDown className="h-8 w-8 text-amber-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 mb-1">
              Shrinkflation Tracker
            </h3>
            <p className="text-sm text-gray-500">
              Detect when products shrink but prices stay the same
            </p>
          </Link>
        </div>
      )}

      {/* Quick Stats */}
      {!searched && (
        <div className="flex items-center justify-center gap-8 py-4 text-sm text-gray-400">
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
