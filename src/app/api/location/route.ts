import { NextRequest, NextResponse } from "next/server";
import { detectLocation, getRegionalMultiplier } from "@/lib/location";

export async function GET(request: NextRequest) {
  // Get IP from headers (works behind proxies / Vercel)
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || undefined;

  try {
    const location = await detectLocation(ip);

    if (!location) {
      return NextResponse.json({
        location: null,
        multiplier: 1.0,
        message: "Could not detect location",
      });
    }

    return NextResponse.json({
      location,
      multiplier: getRegionalMultiplier(location.region),
    });
  } catch {
    return NextResponse.json({
      location: null,
      multiplier: 1.0,
      message: "Location detection failed",
    });
  }
}
