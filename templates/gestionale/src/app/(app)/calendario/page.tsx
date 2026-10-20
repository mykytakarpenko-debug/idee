import type { Metadata } from "next";
import { copy } from "@/content/it";
import { CalendarView } from "@/features/calendar/calendar-view";

export const metadata: Metadata = { title: copy.calendar.title };

export default function CalendarPage() {
  return <CalendarView />;
}
