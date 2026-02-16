import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Smart Shopping List - Shopping Tracker",
  description:
    "Build your grocery list and find the cheapest store combination. Optimize across multiple retailers accounting for trip costs.",
};

export default function ListLayout({ children }: { children: React.ReactNode }) {
  return children;
}
