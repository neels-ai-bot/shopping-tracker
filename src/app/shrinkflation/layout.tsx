import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shrinkflation Tracker - Shopping Tracker",
  description:
    "Detect when product sizes shrink while prices stay the same. Track package size changes over time and calculate the real price increase.",
};

export default function ShrinkflationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
