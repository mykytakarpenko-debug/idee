import type { Metadata } from "next";
import { copy } from "@/content/it";
import { OrderView } from "@/features/site/order-view";

export const metadata: Metadata = { title: copy.order.title, description: copy.order.description };

export default function OrderPage() {
  return <OrderView />;
}
