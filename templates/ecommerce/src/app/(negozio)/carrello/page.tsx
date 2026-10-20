import type { Metadata } from "next";
import { copy } from "@/content/it";
import { CartView } from "@/features/shop/cart-view";

export const metadata: Metadata = { title: copy.cart.title, robots: { index: false } };

export default function CartPage() {
  return <CartView />;
}
