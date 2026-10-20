import type { Metadata } from "next";
import { copy } from "@/content/it";
import { AgendaView } from "@/features/panel/agenda-view";

export const metadata: Metadata = { title: copy.agenda.title };

export default function Page() {
  return <AgendaView />;
}
