import type { Metadata } from "next";
import { copy } from "@/content/it";
import { PaymentsView } from "@/features/payments/payments-view";

export const metadata: Metadata = { title: copy.payments.title };

export default function PaymentsPage() {
  return <PaymentsView />;
}
