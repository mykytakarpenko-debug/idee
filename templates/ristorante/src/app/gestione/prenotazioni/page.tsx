import type { Metadata } from "next";
import { copy } from "@/content/it";
import { ReservationsView } from "@/features/panel/reservations-view";

export const metadata: Metadata = { title: copy.reservations.title };

export default function Page() {
  return <ReservationsView />;
}
