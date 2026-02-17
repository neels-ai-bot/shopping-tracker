import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Weekly Deals - Shopping Tracker",
  description:
    "Browse this week's best grocery deals across Walmart, Target, Kroger, Costco, and more. Find the biggest savings on your favorite products.",
};

export default function DealsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
