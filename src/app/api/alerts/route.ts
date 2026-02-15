import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - fetch all alerts
export async function GET() {
  try {
    const alerts = await prisma.alert.findMany({
      include: {
        product: {
          include: {
            prices: {
              orderBy: { scrapedAt: "desc" },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = alerts.map((alert) => ({
      id: alert.id,
      productId: alert.productId,
      productName: alert.product.name,
      targetPrice: alert.targetPrice,
      retailer: alert.retailer,
      active: alert.active,
      triggered: alert.triggered,
      currentPrice: alert.product.prices[0]?.price,
      createdAt: alert.createdAt,
    }));

    return NextResponse.json({ alerts: formatted });
  } catch (error) {
    console.error("Alert fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}

// POST - create a new alert
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.productId || !body.targetPrice) {
      return NextResponse.json(
        { error: "productId and targetPrice are required" },
        { status: 400 }
      );
    }

    const alert = await prisma.alert.create({
      data: {
        productId: body.productId,
        targetPrice: body.targetPrice,
        retailer: body.retailer || null,
      },
      include: { product: true },
    });

    return NextResponse.json({
      alert: {
        id: alert.id,
        productId: alert.productId,
        productName: alert.product.name,
        targetPrice: alert.targetPrice,
        retailer: alert.retailer,
        active: alert.active,
        triggered: alert.triggered,
      },
    });
  } catch (error) {
    console.error("Alert create error:", error);
    return NextResponse.json({ error: "Failed to create alert" }, { status: 500 });
  }
}

// PUT - toggle alert active/inactive
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.alertId) {
      return NextResponse.json({ error: "alertId is required" }, { status: 400 });
    }

    const alert = await prisma.alert.update({
      where: { id: body.alertId },
      data: {
        active: body.active !== undefined ? body.active : undefined,
        triggered: body.triggered !== undefined ? body.triggered : undefined,
        targetPrice: body.targetPrice,
      },
    });

    return NextResponse.json({ alert });
  } catch (error) {
    console.error("Alert update error:", error);
    return NextResponse.json({ error: "Failed to update alert" }, { status: 500 });
  }
}

// DELETE - remove an alert
export async function DELETE(request: NextRequest) {
  const alertId = request.nextUrl.searchParams.get("id");

  if (!alertId) {
    return NextResponse.json({ error: "Alert id is required" }, { status: 400 });
  }

  try {
    await prisma.alert.delete({ where: { id: alertId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Alert delete error:", error);
    return NextResponse.json({ error: "Failed to delete alert" }, { status: 500 });
  }
}
