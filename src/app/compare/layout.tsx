import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Price Comparison - Shopping Tracker",
  description:
    "Compare prices for any product across Walmart, Target, Amazon, Costco, Kroger, and more. See store-brand alternatives and shrinkflation alerts.",
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
