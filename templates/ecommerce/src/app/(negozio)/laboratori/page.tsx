import type { Metadata } from "next";
import { copy } from "@/content/it";
import { SellersView } from "@/features/shop/sellers-view";

export const metadata: Metadata = {
  title: copy.sellers.title,
  description: copy.sellers.description,
};

export default function SellersPage() {
  return <SellersView />;
}
