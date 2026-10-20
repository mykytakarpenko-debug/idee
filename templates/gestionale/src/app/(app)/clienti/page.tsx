import type { Metadata } from "next";
import { copy } from "@/content/it";
import { ClientsView } from "@/features/clients/clients-view";

export const metadata: Metadata = { title: copy.clients.title };

export default function ClientsPage() {
  return <ClientsView />;
}
