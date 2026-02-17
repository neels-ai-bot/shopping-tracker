export interface SpendingEntry {
  id: string;
  date: string; // ISO date
  items: { name: string; price: number; retailer: string; category?: string }[];
  totalAmount: number;
  savedAmount: number; // how much saved vs highest price option
  store: string;
}

const STORAGE_KEY = "spendingHistory";

function readEntries(): SpendingEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeEntries(entries: SpendingEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export function getSpendingHistory(): SpendingEntry[] {
  return readEntries().sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function addSpendingEntry(entry: Omit<SpendingEntry, "id">): void {
  const entries = readEntries();
  entries.push({ ...entry, id: generateId() });
  writeEntries(entries);
}

export function getMonthlyTotals(): {
  month: string;
  total: number;
  saved: number;
}[] {
  const entries = readEntries();
  const map = new Map<string, { total: number; saved: number }>();

  for (const entry of entries) {
    const d = new Date(entry.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const existing = map.get(key) || { total: 0, saved: 0 };
    existing.total += entry.totalAmount;
    existing.saved += entry.savedAmount;
    map.set(key, existing);
  }

  const months = Array.from(map.entries())
    .map(([month, data]) => ({ month, total: data.total, saved: data.saved }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return months;
}

export function getCategoryBreakdown(): {
  category: string;
  total: number;
  percentage: number;
}[] {
  const entries = readEntries();
  const map = new Map<string, number>();
  let grandTotal = 0;

  for (const entry of entries) {
    for (const item of entry.items) {
      const cat = item.category || "Other";
      map.set(cat, (map.get(cat) || 0) + item.price);
      grandTotal += item.price;
    }
  }

  if (grandTotal === 0) return [];

  return Array.from(map.entries())
    .map(([category, total]) => ({
      category,
      total,
      percentage: Math.round((total / grandTotal) * 100),
    }))
    .sort((a, b) => b.total - a.total);
}

export function getWeeklyAverage(): number {
  const entries = readEntries();
  if (entries.length === 0) return 0;

  const dates = entries.map((e) => new Date(e.date).getTime());
  const earliest = Math.min(...dates);
  const latest = Math.max(...dates);
  const weeks = Math.max(1, (latest - earliest) / (7 * 24 * 60 * 60 * 1000));
  const totalSpent = entries.reduce((sum, e) => sum + e.totalAmount, 0);

  return totalSpent / weeks;
}

export function getTotalSaved(): number {
  return readEntries().reduce((sum, e) => sum + e.savedAmount, 0);
}

export function generateDemoData(): void {
  const existing = readEntries();
  if (existing.length > 0) return;

  const stores = ["Walmart", "Target", "Kroger", "Costco", "Aldi", "Publix"];

  const itemPool: {
    name: string;
    priceRange: [number, number];
    category: string;
  }[] = [
    { name: "Whole Milk 1 Gallon", priceRange: [3.29, 4.99], category: "Dairy" },
    { name: "Large Eggs 12ct", priceRange: [2.49, 4.29], category: "Dairy" },
    { name: "Cheddar Cheese 8oz", priceRange: [2.99, 4.49], category: "Dairy" },
    { name: "Greek Yogurt 32oz", priceRange: [3.99, 5.99], category: "Dairy" },
    { name: "Butter Unsalted 1lb", priceRange: [3.49, 5.29], category: "Dairy" },
    { name: "Bananas per lb", priceRange: [0.49, 0.79], category: "Produce" },
    { name: "Apples 3lb Bag", priceRange: [3.49, 5.49], category: "Produce" },
    { name: "Baby Spinach 5oz", priceRange: [2.49, 3.99], category: "Produce" },
    { name: "Avocados (each)", priceRange: [0.89, 1.99], category: "Produce" },
    { name: "Tomatoes per lb", priceRange: [1.49, 2.99], category: "Produce" },
    { name: "Strawberries 1lb", priceRange: [2.49, 4.49], category: "Produce" },
    { name: "Chicken Breast per lb", priceRange: [2.99, 5.49], category: "Meat" },
    { name: "Ground Beef 80/20 per lb", priceRange: [3.97, 5.99], category: "Meat" },
    { name: "Pork Chops per lb", priceRange: [2.79, 4.49], category: "Meat" },
    { name: "Bacon 16oz", priceRange: [4.99, 7.99], category: "Meat" },
    { name: "Salmon Fillet per lb", priceRange: [7.99, 12.99], category: "Meat" },
    { name: "Doritos 9.25oz", priceRange: [3.28, 4.99], category: "Snacks" },
    { name: "Goldfish Crackers 6.6oz", priceRange: [2.49, 3.79], category: "Snacks" },
    { name: "Granola Bars 12ct", priceRange: [2.99, 4.49], category: "Snacks" },
    { name: "Pretzels 16oz", priceRange: [2.79, 3.99], category: "Snacks" },
    { name: "Trail Mix 26oz", priceRange: [6.49, 9.99], category: "Snacks" },
    { name: "Coca-Cola 12-Pack", priceRange: [4.99, 7.49], category: "Beverages" },
    { name: "Orange Juice 52oz", priceRange: [3.49, 4.99], category: "Beverages" },
    { name: "Coffee Grounds 12oz", priceRange: [5.99, 9.49], category: "Beverages" },
    { name: "Sparkling Water 12-Pack", priceRange: [3.99, 5.99], category: "Beverages" },
    { name: "Dish Soap 19oz", priceRange: [2.49, 3.99], category: "Cleaning" },
    { name: "Paper Towels 6-Pack", priceRange: [5.99, 9.49], category: "Cleaning" },
    { name: "Laundry Detergent 50oz", priceRange: [7.99, 12.99], category: "Cleaning" },
    { name: "Trash Bags 40ct", priceRange: [6.49, 9.99], category: "Cleaning" },
    { name: "All-Purpose Cleaner", priceRange: [2.99, 4.49], category: "Cleaning" },
    { name: "Pasta Sauce 24oz", priceRange: [1.99, 3.49], category: "Pantry" },
    { name: "Rice 2lb Bag", priceRange: [1.99, 3.49], category: "Pantry" },
    { name: "Canned Beans 15oz", priceRange: [0.89, 1.49], category: "Pantry" },
    { name: "Olive Oil 17oz", priceRange: [4.99, 8.49], category: "Pantry" },
    { name: "Bread Whole Wheat", priceRange: [2.49, 4.29], category: "Bakery" },
    { name: "Tortillas 10ct", priceRange: [2.29, 3.79], category: "Bakery" },
    { name: "Frozen Pizza", priceRange: [4.49, 7.99], category: "Frozen" },
    { name: "Ice Cream 48oz", priceRange: [3.99, 6.99], category: "Frozen" },
    { name: "Frozen Vegetables 12oz", priceRange: [1.29, 2.49], category: "Frozen" },
  ];

  const entries: SpendingEntry[] = [];
  const now = new Date();

  for (let monthsAgo = 2; monthsAgo >= 0; monthsAgo--) {
    const numTrips = 10 + Math.floor(Math.random() * 6); // 10-15 trips per month

    for (let t = 0; t < numTrips; t++) {
      const tripDate = new Date(
        now.getFullYear(),
        now.getMonth() - monthsAgo,
        1 + Math.floor(Math.random() * 28)
      );

      // Don't generate future dates
      if (tripDate.getTime() > now.getTime()) continue;

      const store = stores[Math.floor(Math.random() * stores.length)];
      const numItems = 3 + Math.floor(Math.random() * 8); // 3-10 items per trip

      // Pick random items without duplicates
      const shuffled = itemPool.slice().sort(() => Math.random() - 0.5);
      const selectedItems = shuffled.slice(0, numItems);

      let tripTotal = 0;
      let tripSaved = 0;

      const items = selectedItems.map((item) => {
        const range = item.priceRange[1] - item.priceRange[0];
        const price = +(item.priceRange[0] + Math.random() * range).toFixed(2);
        const maxPrice = +item.priceRange[1].toFixed(2);
        tripTotal += price;
        tripSaved += +(maxPrice - price).toFixed(2);

        return {
          name: item.name,
          price,
          retailer: store,
          category: item.category,
        };
      });

      entries.push({
        id: generateId() + t + monthsAgo,
        date: tripDate.toISOString(),
        items,
        totalAmount: +tripTotal.toFixed(2),
        savedAmount: +tripSaved.toFixed(2),
        store,
      });
    }
  }

  writeEntries(entries);
}
