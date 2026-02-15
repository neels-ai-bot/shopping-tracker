"use client";

import { useState } from "react";
import { Search, Barcode, MapPin } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onScanBarcode?: () => void;
  onZipChange?: (zip: string) => void;
  zip?: string;
  placeholder?: string;
  loading?: boolean;
}

export default function SearchBar({
  onSearch,
  onScanBarcode,
  onZipChange,
  zip = "",
  placeholder = "Search for a product...",
  loading = false,
}: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
            disabled={loading}
          />
        </div>
        {onScanBarcode && (
          <button
            type="button"
            onClick={onScanBarcode}
            className="p-3 rounded-xl border border-gray-200 bg-white shadow-sm hover:bg-gray-50 transition-colors"
            title="Scan barcode"
          >
            <Barcode className="h-5 w-5 text-gray-600" />
          </button>
        )}
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {loading ? (
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            "Search"
          )}
        </button>
      </div>
      {onZipChange && (
        <div className="flex items-center gap-2">
          <div className="relative">
            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={zip}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 5);
                onZipChange(val);
              }}
              placeholder="Zip code"
              className="w-28 pl-8 pr-2 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              inputMode="numeric"
              maxLength={5}
            />
          </div>
          {zip.length === 5 && (
            <span className="text-xs text-gray-500">
              Regional prices applied
            </span>
          )}
        </div>
      )}
    </form>
  );
}
