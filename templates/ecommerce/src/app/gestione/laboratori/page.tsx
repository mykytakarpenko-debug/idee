import type { Metadata } from "next";
import { copy } from "@/content/it";
import { SellersPanelView } from "@/features/panel/sellers-view";

export const metadata: Metadata = { title: copy.sellersPanel.title };

export default function Page() {
  return <SellersPanelView />;
}
