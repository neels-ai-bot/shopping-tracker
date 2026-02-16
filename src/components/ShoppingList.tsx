"use client";

import { useState } from "react";
import { ShoppingListItem } from "@/types";
import { Plus, Minus, Trash2, ShoppingCart } from "lucide-react";

interface ShoppingListProps {
  items: ShoppingListItem[];
  onAddItem: (name: string) => void;
  onRemoveItem: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onOptimize?: () => void;
  loading?: boolean;
}

export default function ShoppingList({
  items,
  onAddItem,
  onRemoveItem,
  onUpdateQuantity,
  onOptimize,
  loading = false,
}: ShoppingListProps) {
  const [newItem, setNewItem] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.trim()) {
      onAddItem(newItem.trim());
      setNewItem("");
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Item Form */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Add an item..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
        />
        <button
          type="submit"
          disabled={!newItem.trim()}
          className="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <Plus className="h-5 w-5" />
        </button>
      </form>

      {/* Items List */}
      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500">
          <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Your list is empty</p>
          <p className="text-sm">Add items to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm"
            >
              <span className="flex-1 text-gray-900 dark:text-gray-100 font-medium">
                {item.name}
              </span>

              {/* Quantity Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))
                  }
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <Minus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
                <span className="w-8 text-center font-semibold text-gray-900 dark:text-gray-100">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <Plus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Delete */}
              <button
                onClick={() => onRemoveItem(item.id)}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Optimize Button */}
      {items.length > 0 && onOptimize && (
        <button
          onClick={onOptimize}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <ShoppingCart className="h-5 w-5" />
              Find Best Prices
            </>
          )}
        </button>
      )}

      {/* Summary */}
      {items.length > 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          {items.length} item{items.length !== 1 ? "s" : ""} ·{" "}
          {items.reduce((sum, i) => sum + i.quantity, 0)} total units
        </p>
      )}
    </div>
  );
}
