"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  PieChart,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  getSpendingHistory,
  getMonthlyTotals,
  getCategoryBreakdown,
  getWeeklyAverage,
  getTotalSaved,
  generateDemoData,
  type SpendingEntry,
} from "@/lib/spending";

const CATEGORY_COLORS: Record<string, string> = {
  Dairy: "bg-blue-500",
  Produce: "bg-green-500",
  Meat: "bg-red-500",
  Snacks: "bg-amber-500",
  Beverages: "bg-purple-500",
  Cleaning: "bg-cyan-500",
  Pantry: "bg-orange-500",
  Bakery: "bg-yellow-600",
  Frozen: "bg-indigo-500",
  Other: "bg-gray-500",
};

const CATEGORY_BAR_BG: Record<string, string> = {
  Dairy: "bg-blue-500/80",
  Produce: "bg-green-500/80",
  Meat: "bg-red-500/80",
  Snacks: "bg-amber-500/80",
  Beverages: "bg-purple-500/80",
  Cleaning: "bg-cyan-500/80",
  Pantry: "bg-orange-500/80",
  Bakery: "bg-yellow-600/80",
  Frozen: "bg-indigo-500/80",
  Other: "bg-gray-500/80",
};

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const d = new Date(Number(year), Number(month) - 1);
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getLastMonthKey(): string {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() - 1);
  return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, "0")}`;
}

export default function InsightsPage() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<SpendingEntry[]>([]);
  const [monthlyTotals, setMonthlyTotals] = useState<
    { month: string; total: number; saved: number }[]
  >([]);
  const [categories, setCategories] = useState<
    { category: string; total: number; percentage: number }[]
  >([]);
  const [weeklyAvg, setWeeklyAvg] = useState(0);
  const [totalSaved, setTotalSaved] = useState(0);
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);

  const loadData = useCallback(() => {
    generateDemoData();
    setHistory(getSpendingHistory());
    setMonthlyTotals(getMonthlyTotals());
    setCategories(getCategoryBreakdown());
    setWeeklyAvg(getWeeklyAverage());
    setTotalSaved(getTotalSaved());
    setLoading(false);
  }, []);

  useEffect(() => {
    // Small delay to simulate loading and let localStorage hydrate
    const timer = setTimeout(loadData, 400);
    return () => clearTimeout(timer);
  }, [loadData]);

  // Derived stats
  const currentMonthKey = getCurrentMonthKey();
  const lastMonthKey = getLastMonthKey();
  const currentMonthData = monthlyTotals.find((m) => m.month === currentMonthKey);
  const lastMonthData = monthlyTotals.find((m) => m.month === lastMonthKey);
  const thisMonthTotal = currentMonthData?.total || 0;
  const lastMonthTotal = lastMonthData?.total || 0;
  const monthChangePercent =
    lastMonthTotal > 0
      ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100)
      : 0;
  const tripsThisMonth = history.filter((e) => {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return key === currentMonthKey;
  }).length;

  // Last 6 months for bar chart
  const last6Months = monthlyTotals.slice(-6);
  const maxMonthlyTotal =
    last6Months.length > 0 ? Math.max(...last6Months.map((m) => m.total)) : 1;

  // Top category
  const topCategory = categories.length > 0 ? categories[0] : null;
  const topCategoryMonthly = topCategory
    ? topCategory.total / Math.max(1, monthlyTotals.length)
    : 0;

  // Last 10 trips
  const recentTrips = history.slice(0, 10);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div>
          <div className="h-7 w-52 rounded skeleton mb-2" />
          <div className="h-4 w-80 rounded skeleton" />
        </div>

        {/* Stats row skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4"
            >
              <div className="h-4 w-20 rounded skeleton mb-3" />
              <div className="h-7 w-24 rounded skeleton mb-1" />
              <div className="h-3 w-16 rounded skeleton" />
            </div>
          ))}
        </div>

        {/* Bar chart skeleton */}
        <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <div className="h-5 w-44 rounded skeleton mb-6" />
          <div className="flex items-end gap-3 h-48">
            {[60, 80, 45, 90, 70, 55].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full rounded-t skeleton"
                  style={{ height: `${h}%` }}
                />
                <div className="h-3 w-10 rounded skeleton" />
              </div>
            ))}
          </div>
        </div>

        {/* Category skeleton */}
        <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <div className="h-5 w-40 rounded skeleton mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i}>
                <div className="h-3 w-20 rounded skeleton mb-1" />
                <div className="h-5 rounded skeleton" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent trips skeleton */}
        <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <div className="h-5 w-28 rounded skeleton mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-slate-700"
              >
                <div>
                  <div className="h-4 w-32 rounded skeleton mb-1" />
                  <div className="h-3 w-48 rounded skeleton" />
                </div>
                <div className="h-5 w-16 rounded skeleton" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <PieChart className="h-6 w-6 text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Spending Insights
          </h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400">
          Track your grocery spending trends, savings, and category breakdown
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Spent This Month */}
        <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <div className="flex items-center gap-1.5 mb-2">
            <DollarSign className="h-4 w-4 text-green-500" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Spent This Month
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            ${thisMonthTotal.toFixed(0)}
          </p>
          {lastMonthTotal > 0 && (
            <div className="flex items-center gap-1 mt-1">
              {monthChangePercent <= 0 ? (
                <TrendingDown className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingUp className="h-3 w-3 text-red-500" />
              )}
              <span
                className={`text-xs font-medium ${
                  monthChangePercent <= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {monthChangePercent > 0 ? "+" : ""}
                {monthChangePercent}% vs last month
              </span>
            </div>
          )}
        </div>

        {/* Weekly Average */}
        <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <div className="flex items-center gap-1.5 mb-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Weekly Average
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            ${weeklyAvg.toFixed(0)}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">per week</p>
        </div>

        {/* Total Saved */}
        <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Total Saved
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            ${totalSaved.toFixed(0)}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">lifetime</p>
        </div>

        {/* Trips This Month */}
        <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <div className="flex items-center gap-1.5 mb-2">
            <ShoppingCart className="h-4 w-4 text-purple-500" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Trips This Month
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {tripsThisMonth}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            shopping trips
          </p>
        </div>
      </div>

      {/* Monthly Spending Bar Chart */}
      <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-500" />
          Monthly Spending
        </h2>
        {last6Months.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-500 text-center py-12">
            No spending data yet
          </p>
        ) : (
          <div className="flex items-end gap-3 h-52">
            {last6Months.map((m) => {
              const barHeight = (m.total / maxMonthlyTotal) * 100;
              const savingsHeight =
                m.total > 0 ? (m.saved / m.total) * barHeight : 0;
              const isCurrentMonth = m.month === currentMonthKey;

              return (
                <div
                  key={m.month}
                  className="flex-1 flex flex-col items-center gap-1 h-full justify-end"
                >
                  {/* Amount label */}
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    ${m.total.toFixed(0)}
                  </span>
                  {/* Bar container */}
                  <div
                    className="w-full relative rounded-t-md overflow-hidden"
                    style={{ height: `${barHeight}%`, minHeight: "8px" }}
                  >
                    {/* Total bar */}
                    <div
                      className={`absolute inset-0 ${
                        isCurrentMonth
                          ? "bg-blue-500 dark:bg-blue-400"
                          : "bg-blue-300 dark:bg-blue-600"
                      } transition-colors`}
                    />
                    {/* Savings overlay */}
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-green-400/60 dark:bg-green-400/40"
                      style={{ height: `${savingsHeight}%` }}
                    />
                  </div>
                  {/* Month label */}
                  <span
                    className={`text-xs font-medium ${
                      isCurrentMonth
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {formatMonth(m.month)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {/* Legend */}
        {last6Months.length > 0 && (
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-400 dark:bg-blue-500" />
              <span>Total Spent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-green-400/60 dark:bg-green-400/40" />
              <span>Savings Portion</span>
            </div>
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <PieChart className="h-5 w-5 text-purple-500" />
          Category Breakdown
        </h2>
        {categories.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-500 text-center py-8">
            No category data yet
          </p>
        ) : (
          <div className="space-y-3">
            {categories.map((cat) => {
              const barColor =
                CATEGORY_BAR_BG[cat.category] || CATEGORY_BAR_BG["Other"];
              const dotColor =
                CATEGORY_COLORS[cat.category] || CATEGORY_COLORS["Other"];

              return (
                <div key={cat.category}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${dotColor}`}
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {cat.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        ${cat.total.toFixed(0)}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 w-8 text-right">
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor} transition-all duration-500`}
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Spending Trends */}
      <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          Spending Trends
        </h2>
        <div className="space-y-3">
          {/* Month over month comparison */}
          {lastMonthTotal > 0 && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50">
              {monthChangePercent <= 0 ? (
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <TrendingDown className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <TrendingUp className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  You spent{" "}
                  <span
                    className={
                      monthChangePercent <= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }
                  >
                    {Math.abs(monthChangePercent)}%{" "}
                    {monthChangePercent <= 0 ? "less" : "more"}
                  </span>{" "}
                  than last month
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  ${thisMonthTotal.toFixed(0)} this month vs ${lastMonthTotal.toFixed(0)}{" "}
                  last month
                </p>
              </div>
            </div>
          )}

          {/* Top category */}
          {topCategory && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <PieChart className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Your biggest category is{" "}
                  <span className="text-purple-600 dark:text-purple-400">
                    {topCategory.category}
                  </span>{" "}
                  at ${topCategoryMonthly.toFixed(0)}/month
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {topCategory.percentage}% of your total spending
                </p>
              </div>
            </div>
          )}

          {/* Total savings */}
          {totalSaved > 0 && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  You&apos;ve saved{" "}
                  <span className="text-emerald-600 dark:text-emerald-400">
                    ${totalSaved.toFixed(0)}
                  </span>{" "}
                  total by comparing prices
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Across {history.length} shopping trips
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Trips */}
      <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-orange-500" />
          Recent Trips
        </h2>
        {recentTrips.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-500 text-center py-8">
            No trips recorded yet
          </p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {recentTrips.map((trip) => {
              const isExpanded = expandedTrip === trip.id;

              return (
                <div key={trip.id} className="py-3 first:pt-0 last:pb-0">
                  <button
                    onClick={() =>
                      setExpandedTrip(isExpanded ? null : trip.id)
                    }
                    className="w-full flex items-center justify-between text-left group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          {trip.store}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {formatDate(trip.date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          {trip.items.length} item
                          {trip.items.length !== 1 ? "s" : ""}
                        </span>
                        {trip.savedAmount > 0 && (
                          <span className="text-green-600 dark:text-green-400">
                            Saved ${trip.savedAmount.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                        ${trip.totalAmount.toFixed(2)}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                      )}
                    </div>
                  </button>

                  {/* Expanded items */}
                  {isExpanded && (
                    <div className="mt-2 ml-1 space-y-1.5 border-l-2 border-gray-200 dark:border-slate-600 pl-3">
                      {trip.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-gray-700 dark:text-gray-300 truncate">
                              {item.name}
                            </span>
                            {item.category && (
                              <span className="shrink-0 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400">
                                {item.category}
                              </span>
                            )}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-gray-100 ml-2 shrink-0">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
