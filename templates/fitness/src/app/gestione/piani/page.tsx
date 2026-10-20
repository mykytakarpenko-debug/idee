import type { Metadata } from "next";
import { copy } from "@/content/it";
import { PlansView } from "@/features/panel/plans-view";

export const metadata: Metadata = { title: copy.plans.title };

export default function Page() {
  return <PlansView />;
}
