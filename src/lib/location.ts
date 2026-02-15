export interface UserLocation {
  city: string;
  region: string; // state abbreviation
  country: string;
  zip: string;
  lat: number;
  lon: number;
}

/**
 * Regional price multipliers relative to national average (1.0).
 * Based on real cost-of-living differences across US regions.
 */
const REGIONAL_MULTIPLIERS: Record<string, number> = {
  // Expensive metro areas
  CA: 1.12, NY: 1.15, HI: 1.18, MA: 1.10, CT: 1.09, NJ: 1.08,
  WA: 1.08, OR: 1.06, CO: 1.05, DC: 1.12, MD: 1.06, AK: 1.14,
  // Moderate
  IL: 1.03, PA: 1.01, VA: 1.02, FL: 1.02, MN: 1.01, AZ: 1.01,
  NV: 1.02, NH: 1.03, RI: 1.04, VT: 1.04, DE: 1.01, UT: 1.01,
  // Average
  OH: 1.00, MI: 0.99, GA: 0.99, NC: 0.98, WI: 0.99, MO: 0.97,
  IN: 0.97, IA: 0.96, NE: 0.97, KS: 0.96, NM: 0.99, SC: 0.97,
  // Below average
  TX: 0.96, TN: 0.95, AL: 0.94, KY: 0.94, AR: 0.93, WV: 0.93,
  LA: 0.95, OK: 0.94, MS: 0.92, SD: 0.95, ND: 0.96, MT: 0.97,
  ID: 0.97, WY: 0.97, ME: 1.02,
};

/**
 * Detect user location from IP address using free ip-api.com service.
 */
export async function detectLocation(ip?: string): Promise<UserLocation | null> {
  try {
    const url = ip
      ? `http://ip-api.com/json/${ip}?fields=city,region,regionName,country,zip,lat,lon`
      : `http://ip-api.com/json/?fields=city,region,regionName,country,zip,lat,lon`;

    const res = await fetch(url, { next: { revalidate: 3600 } }); // cache 1hr
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.city) return null;

    return {
      city: data.city,
      region: data.region,       // e.g. "CA"
      country: data.country,     // e.g. "US"
      zip: data.zip,
      lat: data.lat,
      lon: data.lon,
    };
  } catch {
    return null;
  }
}

/**
 * Get the regional price multiplier for a state.
 * Returns 1.0 if unknown.
 */
export function getRegionalMultiplier(stateCode: string): number {
  return REGIONAL_MULTIPLIERS[stateCode.toUpperCase()] ?? 1.0;
}

/**
 * Apply regional pricing to a base price.
 * Rounds to nearest cent.
 */
export function applyRegionalPricing(basePrice: number, stateCode: string): number {
  const mult = getRegionalMultiplier(stateCode);
  return Math.round(basePrice * mult * 100) / 100;
}
