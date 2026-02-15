import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

export function formatUnitPrice(price: number): string {
  return `${formatPrice(price)}/oz`;
}

// Re-export from centralized retailer config for backwards compatibility
export {
  retailerDisplayName,
  retailerColor,
  retailerTextColor,
} from "./retailer-config";
