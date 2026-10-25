import type { Metadata } from "next";
import { copy } from "@/content/it";
import { CustomersView } from "@/features/panel/customers-view";

export const metadata: Metadata = { title: copy.customersPanel.title };

export default function Page() {
  return <CustomersView />;
}
