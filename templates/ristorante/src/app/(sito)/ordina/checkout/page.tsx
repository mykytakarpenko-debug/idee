import type { Metadata } from "next";
import { copy } from "@/content/it";
import { CheckoutView } from "@/features/site/checkout-view";

export const metadata: Metadata = { title: copy.checkout.title, robots: { index: false } };

export default function CheckoutPage() {
  return <CheckoutView />;
}
