import type { Metadata } from "next";
import { copy } from "@/content/it";
import { AppointmentsView } from "@/features/appointments/appointments-view";

export const metadata: Metadata = { title: copy.appointments.title };

export default function AppointmentsPage() {
  return <AppointmentsView />;
}
