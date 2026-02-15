import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.brandMapping.deleteMany();
  await prisma.sizeHistory.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.price.deleteMany();
  await prisma.shoppingItem.deleteMany();
  await prisma.shoppingList.deleteMany();
  await prisma.product.deleteMany();

  // Seed Products
  const tide = await prisma.product.create({
    data: {
      name: "Tide Original Laundry Detergent",
      upc: "037000764113",
      brand: "Tide",
      category: "Laundry Detergent",
      packageSize: "150 oz",
      packageSizeOz: 150,
    },
  });

  const cheerios = await prisma.product.create({
    data: {
      name: "Cheerios Original Cereal",
      upc: "016000275287",
      brand: "General Mills",
      category: "Cereal",
      packageSize: "18 oz",
      packageSizeOz: 18,
    },
  });

  const bounty = await prisma.product.create({
    data: {
      name: "Bounty Select-A-Size Paper Towels",
      upc: "037000869450",
      brand: "Bounty",
      category: "Paper Towels",
      packageSize: "12 Double Rolls",
      packageSizeOz: 12,
    },
  });

  const crest = await prisma.product.create({
    data: {
      name: "Crest 3D White Toothpaste",
      upc: "037000449836",
      brand: "Crest",
      category: "Toothpaste",
      packageSize: "4.8 oz",
      packageSizeOz: 4.8,
    },
  });

  // Seed Prices
  const priceData = [
    { productId: tide.id, retailer: "walmart", price: 11.97, unitPrice: 0.08 },
    { productId: tide.id, retailer: "target", price: 13.99, unitPrice: 0.09 },
    { productId: tide.id, retailer: "amazon", price: 14.99, unitPrice: 0.10 },
    { productId: tide.id, retailer: "costco", price: 16.99, unitPrice: 0.09 },
    { productId: tide.id, retailer: "kroger", price: 13.49, unitPrice: 0.09 },

    { productId: cheerios.id, retailer: "walmart", price: 4.48, unitPrice: 0.25 },
    { productId: cheerios.id, retailer: "target", price: 4.99, unitPrice: 0.28 },
    { productId: cheerios.id, retailer: "amazon", price: 5.69, unitPrice: 0.32 },
    { productId: cheerios.id, retailer: "costco", price: 7.99, unitPrice: 0.20 },
    { productId: cheerios.id, retailer: "kroger", price: 5.49, unitPrice: 0.31 },

    { productId: bounty.id, retailer: "walmart", price: 18.94, unitPrice: 1.58 },
    { productId: bounty.id, retailer: "target", price: 19.99, unitPrice: 1.67 },
    { productId: bounty.id, retailer: "amazon", price: 22.99, unitPrice: 1.92 },
    { productId: bounty.id, retailer: "costco", price: 23.99, unitPrice: 2.00 },
    { productId: bounty.id, retailer: "kroger", price: 20.49, unitPrice: 1.71 },

    { productId: crest.id, retailer: "walmart", price: 5.97, unitPrice: 1.24 },
    { productId: crest.id, retailer: "target", price: 6.29, unitPrice: 1.31 },
    { productId: crest.id, retailer: "amazon", price: 7.49, unitPrice: 1.56 },
    { productId: crest.id, retailer: "costco", price: 19.99, unitPrice: 0.83 },
    { productId: crest.id, retailer: "kroger", price: 6.49, unitPrice: 1.35 },
  ];

  for (const price of priceData) {
    await prisma.price.create({ data: { ...price, inStock: true } });
  }

  // Seed Size History for shrinkflation demo
  const doritos = await prisma.product.create({
    data: {
      name: "Doritos Nacho Cheese",
      upc: "028400090865",
      brand: "Doritos",
      category: "Chips",
      packageSize: "9.25 oz",
      packageSizeOz: 9.25,
    },
  });

  const sizeHistoryData = [
    { productId: doritos.id, packageSize: "10.5 oz", sizeOz: 10.5, price: 4.29, retailer: "walmart", recordedAt: new Date("2024-01-15") },
    { productId: doritos.id, packageSize: "10.5 oz", sizeOz: 10.5, price: 4.49, retailer: "walmart", recordedAt: new Date("2024-04-20") },
    { productId: doritos.id, packageSize: "9.75 oz", sizeOz: 9.75, price: 4.49, retailer: "walmart", recordedAt: new Date("2024-07-10") },
    { productId: doritos.id, packageSize: "9.25 oz", sizeOz: 9.25, price: 4.49, retailer: "walmart", recordedAt: new Date("2024-10-05") },
    { productId: doritos.id, packageSize: "9.25 oz", sizeOz: 9.25, price: 4.29, retailer: "walmart", recordedAt: new Date("2025-01-15") },
  ];

  for (const entry of sizeHistoryData) {
    await prisma.sizeHistory.create({ data: entry });
  }

  // Seed a shopping list
  await prisma.shoppingList.create({
    data: {
      name: "Weekly Groceries",
      items: {
        create: [
          { name: "Milk", quantity: 1 },
          { name: "Cheerios", quantity: 2 },
          { name: "Paper Towels", quantity: 1 },
        ],
      },
    },
  });

  // Seed brand mappings
  await prisma.brandMapping.create({
    data: {
      sourceProductId: tide.id,
      equivalentName: "Great Value Laundry Detergent",
      equivalentStore: "walmart",
      confidence: 0.85,
    },
  });

  await prisma.brandMapping.create({
    data: {
      sourceProductId: tide.id,
      equivalentName: "Up & Up Laundry Detergent",
      equivalentStore: "target",
      confidence: 0.82,
    },
  });

  console.log("Seed data created successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
