import { Retailer } from "@/types";

export interface RetailerConfig {
  id: Retailer;
  displayName: string;
  color: string;       // Tailwind bg class
  textColor: string;   // Tailwind text class
  availability: "national" | "regional";
  /** State codes where this retailer operates (only for regional) */
  regions?: string[];
}

export const RETAILER_CONFIGS: Record<Retailer, RetailerConfig> = {
  walmart: {
    id: "walmart",
    displayName: "Walmart",
    color: "bg-blue-600",
    textColor: "text-blue-600",
    availability: "national",
  },
  target: {
    id: "target",
    displayName: "Target",
    color: "bg-red-600",
    textColor: "text-red-600",
    availability: "national",
  },
  amazon: {
    id: "amazon",
    displayName: "Amazon",
    color: "bg-orange-500",
    textColor: "text-orange-500",
    availability: "national",
  },
  costco: {
    id: "costco",
    displayName: "Costco",
    color: "bg-red-700",
    textColor: "text-red-700",
    availability: "national",
  },
  kroger: {
    id: "kroger",
    displayName: "Kroger",
    color: "bg-blue-500",
    textColor: "text-blue-500",
    availability: "national",
  },
  wholefoods: {
    id: "wholefoods",
    displayName: "Whole Foods",
    color: "bg-green-700",
    textColor: "text-green-700",
    availability: "national",
  },
  publix: {
    id: "publix",
    displayName: "Publix",
    color: "bg-green-600",
    textColor: "text-green-600",
    availability: "regional",
    regions: ["FL", "GA", "AL", "SC", "TN", "NC", "VA"],
  },
  heb: {
    id: "heb",
    displayName: "H-E-B",
    color: "bg-red-600",
    textColor: "text-red-500",
    availability: "regional",
    regions: ["TX"],
  },
  wegmans: {
    id: "wegmans",
    displayName: "Wegmans",
    color: "bg-indigo-600",
    textColor: "text-indigo-600",
    availability: "regional",
    regions: ["NY", "PA", "NJ", "VA", "MD", "MA", "NC", "DE"],
  },
  aldi: {
    id: "aldi",
    displayName: "Aldi",
    color: "bg-sky-600",
    textColor: "text-sky-600",
    availability: "regional",
    regions: [
      "IL", "IN", "OH", "PA", "NY", "MI", "WI", "IA", "MO", "MN",
      "GA", "FL", "NC", "SC", "VA", "MD", "NJ", "CT", "KS", "NE",
      "NH", "KY", "TN", "AL", "OK", "WV", "DE", "SD", "ND", "LA", "AR",
    ],
  },
  traderjoes: {
    id: "traderjoes",
    displayName: "Trader Joe's",
    color: "bg-red-800",
    textColor: "text-red-800",
    availability: "national",
  },
};

/**
 * Returns retailers available for a given state code.
 * National retailers are always included. Regional retailers are included
 * only if the state is in their regions list.
 * If no stateCode is provided, returns national retailers only.
 */
export function getAvailableRetailers(stateCode?: string): Retailer[] {
  const retailers: Retailer[] = [];

  for (const config of Object.values(RETAILER_CONFIGS)) {
    if (config.availability === "national") {
      retailers.push(config.id);
    } else if (stateCode && config.regions?.includes(stateCode.toUpperCase())) {
      retailers.push(config.id);
    }
  }

  return retailers;
}

export function retailerDisplayName(retailer: string): string {
  const config = RETAILER_CONFIGS[retailer as Retailer];
  return config?.displayName ?? retailer;
}

export function retailerColor(retailer: string): string {
  const config = RETAILER_CONFIGS[retailer as Retailer];
  return config?.color ?? "bg-gray-500";
}

export function retailerTextColor(retailer: string): string {
  const config = RETAILER_CONFIGS[retailer as Retailer];
  return config?.textColor ?? "text-gray-500";
}
