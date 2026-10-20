import type { Metadata } from "next";
import { copy } from "@/content/it";
import { ServicesView } from "@/features/panel/services-view";

export const metadata: Metadata = { title: copy.services.title };

export default function Page() {
  return <ServicesView />;
}
