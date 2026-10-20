import type { Metadata } from "next";
import { copy } from "@/content/it";
import { OrdersView } from "@/features/panel/orders-view";

export const metadata: Metadata = { title: copy.orders.title };

export default function Page() {
  return <OrdersView />;
}
