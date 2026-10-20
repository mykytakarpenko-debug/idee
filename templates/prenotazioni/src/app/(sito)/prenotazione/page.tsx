import type { Metadata } from "next";
import { copy } from "@/content/it";
import { FindBookingView } from "@/features/site/manage-view";

export const metadata: Metadata = { title: copy.manage.findTitle, robots: { index: false } };

export default function FindBookingPage() {
  return <FindBookingView />;
}
