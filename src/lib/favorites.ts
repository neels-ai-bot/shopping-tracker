/**
 * Favorites/Watchlist system using localStorage.
 * Stores favorite products for quick access and tracks last-seen prices.
 */

export interface FavoriteProduct {
  id: string; // UPC or product name as key
  name: string;
  brand?: string;
  category?: string;
  lastPrice: number;
  lastRetailer: string;
  lastSeen: string; // ISO date
  addedAt: string; // ISO date
}

const STORAGE_KEY = "favoriteProducts";
const MAX_FAVORITES = 50;

export function getFavorites(): FavoriteProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function addFavorite(product: {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  price: number;
  retailer: string;
}): FavoriteProduct[] {
  const favorites = getFavorites();
  const existing = favorites.findIndex((f) => f.id === product.id);

  const entry: FavoriteProduct = {
    id: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    lastPrice: product.price,
    lastRetailer: product.retailer,
    lastSeen: new Date().toISOString(),
    addedAt: existing >= 0 ? favorites[existing].addedAt : new Date().toISOString(),
  };

  if (existing >= 0) {
    favorites[existing] = entry;
  } else {
    favorites.unshift(entry);
    if (favorites.length > MAX_FAVORITES) favorites.pop();
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  return favorites;
}

export function removeFavorite(id: string): FavoriteProduct[] {
  const favorites = getFavorites().filter((f) => f.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  return favorites;
}

export function isFavorite(id: string): boolean {
  return getFavorites().some((f) => f.id === id);
}

export function updateFavoritePrice(
  id: string,
  price: number,
  retailer: string
): void {
  const favorites = getFavorites();
  const index = favorites.findIndex((f) => f.id === id);
  if (index >= 0) {
    favorites[index].lastPrice = price;
    favorites[index].lastRetailer = retailer;
    favorites[index].lastSeen = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }
}
