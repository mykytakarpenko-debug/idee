import type { Metadata } from "next";
import { copy } from "@/content/it";
import { ProductsView } from "@/features/panel/products-view";

export const metadata: Metadata = { title: copy.productsPanel.title };

export default function Page() {
  return <ProductsView />;
}
