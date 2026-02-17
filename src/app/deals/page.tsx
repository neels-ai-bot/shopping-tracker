"use client";

import { useState, useEffect } from "react";
import { Flame, Clock, Tag, Filter, Heart } from "lucide-react";
import { retailerDisplayName, retailerColor } from "@/lib/utils";
import { Retailer } from "@/types";

interface Deal {
  id: string;
  name: string;
  brand: string;
  category: string;
  retailer: Retailer;
  salePrice: number;
  originalPrice: number;
  percentOff: number;
  unitPrice?: number;
  packageSize?: string;
  endsIn: number; // days
  url?: string;
}

const CATEGORIES = [
  "All",
  "Produce",
  "Dairy",
  "Meat",
  "Snacks",
  "Beverages",
  "Cereal",
  "Cleaning",
  "Frozen",
  "Baby",
  "Personal Care",
];

// Mock weekly deals data — in production this would come from retailer APIs
const WEEKLY_DEALS: Deal[] = [
  { id: "d1", name: "Cheerios Original 18oz", brand: "General Mills", category: "Cereal", retailer: "walmart", salePrice: 3.48, originalPrice: 4.48, percentOff: 22, unitPrice: 0.19, packageSize: "18 oz", endsIn: 3 },
  { id: "d2", name: "Tide PODS 42ct", brand: "Tide", category: "Cleaning", retailer: "target", salePrice: 11.99, originalPrice: 14.49, percentOff: 17, packageSize: "42 ct", endsIn: 5 },
  { id: "d3", name: "Organic Whole Milk 1 Gallon", brand: "Horizon", category: "Dairy", retailer: "kroger", salePrice: 4.99, originalPrice: 6.49, percentOff: 23, unitPrice: 0.04, packageSize: "128 oz", endsIn: 2 },
  { id: "d4", name: "Bounty Paper Towels 6-Pack", brand: "Bounty", category: "Cleaning", retailer: "costco", salePrice: 14.99, originalPrice: 19.49, percentOff: 23, packageSize: "6 rolls", endsIn: 6 },
  { id: "d5", name: "Doritos Nacho Cheese 9.25oz", brand: "Frito-Lay", category: "Snacks", retailer: "walmart", salePrice: 3.28, originalPrice: 4.98, percentOff: 34, unitPrice: 0.35, packageSize: "9.25 oz", endsIn: 3 },
  { id: "d6", name: "Folgers Classic Roast 43.5oz", brand: "Folgers", category: "Beverages", retailer: "kroger", salePrice: 8.49, originalPrice: 12.49, percentOff: 32, unitPrice: 0.20, packageSize: "43.5 oz", endsIn: 4 },
  { id: "d7", name: "Colgate Total Toothpaste 5.1oz", brand: "Colgate", category: "Personal Care", retailer: "amazon", salePrice: 3.49, originalPrice: 5.49, percentOff: 36, packageSize: "5.1 oz", endsIn: 1 },
  { id: "d8", name: "Bananas per lb", brand: "Fresh", category: "Produce", retailer: "aldi", salePrice: 0.19, originalPrice: 0.29, percentOff: 34, packageSize: "per lb", endsIn: 3 },
  { id: "d9", name: "Large Eggs 18ct", brand: "Great Value", category: "Dairy", retailer: "walmart", salePrice: 3.98, originalPrice: 5.47, percentOff: 27, packageSize: "18 ct", endsIn: 3 },
  { id: "d10", name: "Chicken Breast Boneless", brand: "Perdue", category: "Meat", retailer: "publix", salePrice: 2.99, originalPrice: 4.49, percentOff: 33, packageSize: "per lb", endsIn: 2 },
  { id: "d11", name: "Coke 12-Pack Cans", brand: "Coca-Cola", category: "Beverages", retailer: "target", salePrice: 4.99, originalPrice: 7.49, percentOff: 33, packageSize: "12 x 12oz", endsIn: 5 },
  { id: "d12", name: "Greek Yogurt 32oz", brand: "Chobani", category: "Dairy", retailer: "kroger", salePrice: 4.49, originalPrice: 5.99, percentOff: 25, unitPrice: 0.14, packageSize: "32 oz", endsIn: 4 },
  { id: "d13", name: "DiGiorno Rising Crust Pizza", brand: "DiGiorno", category: "Frozen", retailer: "walmart", salePrice: 5.48, originalPrice: 7.68, percentOff: 29, packageSize: "27.5 oz", endsIn: 3 },
  { id: "d14", name: "Pampers Swaddlers Size 3", brand: "Pampers", category: "Baby", retailer: "amazon", salePrice: 24.99, originalPrice: 34.99, percentOff: 29, packageSize: "84 ct", endsIn: 7 },
  { id: "d15", name: "Strawberries 1lb", brand: "Fresh", category: "Produce", retailer: "heb", salePrice: 1.99, originalPrice: 3.49, percentOff: 43, packageSize: "16 oz", endsIn: 2 },
  { id: "d16", name: "Prego Traditional Pasta Sauce", brand: "Prego", category: "Snacks", retailer: "kroger", salePrice: 1.99, originalPrice: 2.99, percentOff: 33, packageSize: "24 oz", endsIn: 4 },
  { id: "d17", name: "Nature Valley Granola Bars 12ct", brand: "General Mills", category: "Snacks", retailer: "target", salePrice: 2.99, originalPrice: 4.29, percentOff: 30, packageSize: "12 ct", endsIn: 5 },
  { id: "d18", name: "Frozen Broccoli Florets 12oz", brand: "Birds Eye", category: "Frozen", retailer: "walmart", salePrice: 1.48, originalPrice: 2.28, percentOff: 35, packageSize: "12 oz", endsIn: 3 },
  { id: "d19", name: "Ground Beef 80/20 per lb", brand: "Fresh", category: "Meat", retailer: "walmart", salePrice: 3.97, originalPrice: 5.47, percentOff: 27, packageSize: "per lb", endsIn: 3 },
  { id: "d20", name: "Kraft Mac & Cheese 5-Pack", brand: "Kraft", category: "Snacks", retailer: "costco", salePrice: 4.49, originalPrice: 6.49, percentOff: 31, packageSize: "5 x 7.25oz", endsIn: 6 },
];

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"percentOff" | "endsIn" | "price">("percentOff");
  const [savedDeals, setSavedDeals] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load saved deals from localStorage
    try {
      const saved = JSON.parse(localStorage.getItem("savedDeals") || "[]");
      if (Array.isArray(saved)) setSavedDeals(new Set(saved));
    } catch { /* ignore */ }

    // Simulate API fetch
    setTimeout(() => {
      setDeals(WEEKLY_DEALS);
      setLoading(false);
    }, 300);
  }, []);

  const toggleSaveDeal = (dealId: string) => {
    setSavedDeals((prev) => {
      const next = new Set(prev);
      if (next.has(dealId)) {
        next.delete(dealId);
      } else {
        next.add(dealId);
      }
      localStorage.setItem("savedDeals", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const filteredDeals = deals
    .filter((d) => {
      if (selectedCategory === "All") return true;
      if (selectedCategory === "Dairy") return ["Dairy", "Milk", "Eggs", "Cheese", "Yogurt", "Butter"].includes(d.category);
      if (selectedCategory === "Frozen") return d.category.startsWith("Frozen") || d.category === "Ice Cream";
      if (selectedCategory === "Personal Care") return ["Personal Care", "Body Care", "Hair Care", "Toothpaste", "Deodorant", "Shaving", "Skin Care"].includes(d.category);
      return d.category === selectedCategory;
    })
    .sort((a, b) => {
      if (sortBy === "percentOff") return b.percentOff - a.percentOff;
      if (sortBy === "endsIn") return a.endsIn - b.endsIn;
      return a.salePrice - b.salePrice;
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Flame className="h-6 w-6 text-orange-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Weekly Deals
          </h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400">
          This week&apos;s best grocery deals across all retailers
        </p>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800">
        <div className="text-center flex-1">
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{deals.length}</p>
          <p className="text-xs text-orange-700 dark:text-orange-300">Active Deals</p>
        </div>
        <div className="w-px h-10 bg-orange-200 dark:bg-orange-700" />
        <div className="text-center flex-1">
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {deals.length > 0 ? Math.round(deals.reduce((s, d) => s + d.percentOff, 0) / deals.length) : 0}%
          </p>
          <p className="text-xs text-orange-700 dark:text-orange-300">Avg Savings</p>
        </div>
        <div className="w-px h-10 bg-orange-200 dark:bg-orange-700" />
        <div className="text-center flex-1">
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            ${deals.reduce((s, d) => s + (d.originalPrice - d.salePrice), 0).toFixed(0)}+
          </p>
          <p className="text-xs text-orange-700 dark:text-orange-300">Total Savings</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? "bg-orange-500 text-white"
                : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Sort Controls */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {filteredDeals.length} deal{filteredDeals.length !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-1 text-sm">
          <Filter className="h-3.5 w-3.5 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "percentOff" | "endsIn" | "price")}
            className="bg-transparent text-gray-600 dark:text-gray-400 border-none focus:outline-none cursor-pointer text-sm font-medium"
          >
            <option value="percentOff">Biggest Savings</option>
            <option value="endsIn">Ending Soon</option>
            <option value="price">Lowest Price</option>
          </select>
        </div>
      </div>

      {/* Deals Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
              <div className="flex justify-between mb-3">
                <div className="h-5 w-16 rounded skeleton" />
                <div className="h-5 w-20 rounded skeleton" />
              </div>
              <div className="h-5 w-48 rounded skeleton mb-2" />
              <div className="h-4 w-32 rounded skeleton mb-3" />
              <div className="flex justify-between">
                <div className="h-6 w-20 rounded skeleton" />
                <div className="h-4 w-16 rounded skeleton" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredDeals.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <Tag className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-lg">No deals in this category</p>
          <p className="text-sm mt-1">Check back later or try a different category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredDeals.map((deal) => (
            <div
              key={deal.id}
              className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                {/* Top Row: Badge + Retailer + Save */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">
                      {deal.percentOff}% OFF
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className={`w-2 h-2 rounded-full ${retailerColor(deal.retailer)}`} />
                      {retailerDisplayName(deal.retailer)}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleSaveDeal(deal.id)}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        savedDeals.has(deal.id)
                          ? "fill-red-500 text-red-500"
                          : "text-gray-400 dark:text-gray-500"
                      }`}
                    />
                  </button>
                </div>

                {/* Product Name */}
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5 truncate">
                  {deal.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  {deal.brand} · {deal.packageSize}
                </p>

                {/* Price Row */}
                <div className="flex items-end justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-green-600 dark:text-green-400">
                      ${deal.salePrice.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-400 line-through">
                      ${deal.originalPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                    <Clock className="h-3 w-3" />
                    <span>{deal.endsIn === 1 ? "Ends tomorrow" : `${deal.endsIn} days left`}</span>
                  </div>
                </div>
              </div>

              {/* Savings Bar */}
              <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 border-t border-green-100 dark:border-green-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-green-700 dark:text-green-300">
                  You save ${(deal.originalPrice - deal.salePrice).toFixed(2)}
                </span>
                {deal.unitPrice && (
                  <span className="text-xs text-green-600 dark:text-green-400">
                    ${deal.unitPrice.toFixed(2)}/oz
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
