import { NextRequest, NextResponse } from "next/server";
import { lookupBarcode } from "@/lib/barcode";

export async function GET(request: NextRequest) {
  const upc = request.nextUrl.searchParams.get("upc");

  if (!upc) {
    return NextResponse.json(
      { error: "UPC parameter is required" },
      { status: 400 }
    );
  }

  try {
    const product = await lookupBarcode(upc);

    if (!product) {
      return NextResponse.json(
        { error: "Product not found for this barcode" },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Barcode lookup error:", error);
    return NextResponse.json(
      { error: "Barcode lookup failed" },
      { status: 500 }
    );
  }
}
