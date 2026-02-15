export type Retailer = "amazon" | "walmart" | "target" | "costco" | "kroger" | "wholefoods" | "publix" | "heb" | "wegmans" | "aldi" | "traderjoes";

export interface ProductResult {
  name: string;
  upc?: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  packageSize?: string;
  packageSizeOz?: number;
  retailer: Retailer;
  price: number;
  unitPrice?: number;
  url?: string;
  inStock: boolean;
}

export interface ComparisonResult {
  productName: string;
  upc?: string;
  imageUrl?: string;
  prices: RetailerPrice[];
  bestPrice: RetailerPrice;
  equivalents?: BrandEquivalent[];
  shrinkflationAlert?: ShrinkflationAlert;
}

export interface RetailerPrice {
  retailer: Retailer;
  price: number;
  unitPrice?: number;
  url?: string;
  inStock: boolean;
}

export interface BrandEquivalent {
  name: string;
  store: string;
  price: number;
  unitPrice?: number;
  confidence: number;
}

export interface ShrinkflationAlert {
  productName: string;
  previousSize: string;
  currentSize: string;
  previousSizeOz: number;
  currentSizeOz: number;
  priceChange: number; // percentage
  effectivePriceChange: number; // percentage accounting for size
}

export interface OptimizedRoute {
  strategy: string; // "single-store" | "2-store-split" | "3-store-split"
  stores: StoreAssignment[];
  totalCost: number;
  savings: number; // vs worst single store
  tripCost: number;
  effectiveCost: number; // totalCost + tripCost
}

export interface StoreAssignment {
  retailer: Retailer;
  items: OptimizedItem[];
  subtotal: number;
}

export interface OptimizedItem {
  name: string;
  quantity: number;
  price: number;
  unitPrice?: number;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  productId?: string;
}

export interface PriceAlert {
  id: string;
  productId: string;
  productName: string;
  targetPrice: number;
  retailer?: Retailer;
  active: boolean;
  triggered: boolean;
  currentPrice?: number;
}

export interface SizeHistoryEntry {
  date: string;
  packageSize: string;
  sizeOz: number;
  price: number;
  pricePerOz: number;
  retailer: string;
}

export interface SearchParams {
  query: string;
  retailers?: Retailer[];
  category?: string;
}

export interface ScraperConfig {
  apiKey?: string;
  baseUrl: string;
  rateLimit: number; // ms between requests
}
