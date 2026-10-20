import type { Metadata } from "next";
import { copy } from "@/content/it";
import { ServicesView } from "@/features/services/services-view";

export const metadata: Metadata = { title: copy.services.title };

export default function ServicesPage() {
  return <ServicesView />;
}
