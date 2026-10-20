import type { Metadata } from "next";
import { copy } from "@/content/it";
import { AvailabilityView } from "@/features/panel/availability-view";

export const metadata: Metadata = { title: copy.availability.title };

export default function Page() {
  return <AvailabilityView />;
}
