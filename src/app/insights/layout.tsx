import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Spending Insights - Shopping Tracker",
  description: "Track your grocery spending trends, category breakdown, and savings over time.",
};

export default function InsightsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
