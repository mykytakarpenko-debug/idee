import type { Metadata } from "next";
import { copy } from "@/content/it";
import { CheckInView } from "@/features/panel/checkin-view";

export const metadata: Metadata = { title: copy.checkin.title };

export default function Page() {
  return <CheckInView />;
}
