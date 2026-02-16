import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Price Alerts - Shopping Tracker",
  description:
    "Set price drop alerts for grocery products. Get notified when your target price is reached at any retailer.",
};

export default function AlertsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
