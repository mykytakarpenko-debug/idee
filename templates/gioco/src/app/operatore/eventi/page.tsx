import type { Metadata } from "next";
import { copy } from "@/content/it";
import { EventsView } from "@/features/panel/events-view";

export const metadata: Metadata = {
  title: copy.panel.events.title,
  robots: { index: false, follow: false },
};

export default function EventsPage() {
  return <EventsView />;
}
