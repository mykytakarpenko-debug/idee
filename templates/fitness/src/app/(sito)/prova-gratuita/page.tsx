import type { Metadata } from "next";
import { copy } from "@/content/it";
import { TrialView } from "@/features/site/trial-view";

export const metadata: Metadata = { title: copy.trial.title, description: copy.trial.description };

export default function Page() {
  return <TrialView />;
}
