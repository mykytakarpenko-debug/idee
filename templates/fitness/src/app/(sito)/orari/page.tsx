import type { Metadata } from "next";
import { copy } from "@/content/it";
import { ScheduleView } from "@/features/site/schedule-view";

export const metadata: Metadata = {
  title: copy.schedule.title,
  description: copy.schedule.description,
};

export default function Page() {
  return <ScheduleView />;
}
