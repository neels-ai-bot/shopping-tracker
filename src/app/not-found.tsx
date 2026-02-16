import Link from "next/link";
import { Search, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6">
        <Search className="h-10 w-10 text-blue-600 dark:text-blue-400" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Page Not Found
      </h1>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
        The page you&apos;re looking for doesn&apos;t exist. Try searching for a product
        or head back to the home page.
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Home className="h-4 w-4" />
          Go Home
        </Link>
        <Link
          href="/compare"
          className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
        >
          <Search className="h-4 w-4" />
          Compare Prices
        </Link>
      </div>
    </div>
  );
}
