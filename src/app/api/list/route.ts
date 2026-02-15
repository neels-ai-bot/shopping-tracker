import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - fetch all lists or a specific list
export async function GET(request: NextRequest) {
  const listId = request.nextUrl.searchParams.get("id");

  try {
    if (listId) {
      const list = await prisma.shoppingList.findUnique({
        where: { id: listId },
        include: { items: true },
      });
      if (!list) {
        return NextResponse.json({ error: "List not found" }, { status: 404 });
      }
      return NextResponse.json({ list });
    }

    const lists = await prisma.shoppingList.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ lists });
  } catch (error) {
    console.error("List fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch lists" }, { status: 500 });
  }
}

// POST - create a new list or add item to a list
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === "addItem" && body.listId) {
      const item = await prisma.shoppingItem.create({
        data: {
          listId: body.listId,
          name: body.name,
          quantity: body.quantity || 1,
          productId: body.productId,
        },
      });
      return NextResponse.json({ item });
    }

    // Create new list
    const list = await prisma.shoppingList.create({
      data: {
        name: body.name || "My Shopping List",
        items: body.items
          ? {
              create: body.items.map((item: { name: string; quantity?: number }) => ({
                name: item.name,
                quantity: item.quantity || 1,
              })),
            }
          : undefined,
      },
      include: { items: true },
    });

    return NextResponse.json({ list });
  } catch (error) {
    console.error("List create error:", error);
    return NextResponse.json({ error: "Failed to create list" }, { status: 500 });
  }
}

// PUT - update item quantity
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.itemId && body.quantity !== undefined) {
      const item = await prisma.shoppingItem.update({
        where: { id: body.itemId },
        data: { quantity: body.quantity },
      });
      return NextResponse.json({ item });
    }

    if (body.listId && body.name) {
      const list = await prisma.shoppingList.update({
        where: { id: body.listId },
        data: { name: body.name },
      });
      return NextResponse.json({ list });
    }

    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  } catch (error) {
    console.error("List update error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// DELETE - remove item or list
export async function DELETE(request: NextRequest) {
  const itemId = request.nextUrl.searchParams.get("itemId");
  const listId = request.nextUrl.searchParams.get("listId");

  try {
    if (itemId) {
      await prisma.shoppingItem.delete({ where: { id: itemId } });
      return NextResponse.json({ success: true });
    }

    if (listId) {
      await prisma.shoppingList.delete({ where: { id: listId } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Specify itemId or listId" }, { status: 400 });
  } catch (error) {
    console.error("List delete error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
