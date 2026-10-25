import type { Metadata } from "next";
import { copy } from "@/content/it";
import { ResponsibleView } from "@/features/responsible/responsible-view";

export const metadata: Metadata = { title: copy.responsible.title };

export default function ResponsiblePage() {
  return <ResponsibleView />;
}
