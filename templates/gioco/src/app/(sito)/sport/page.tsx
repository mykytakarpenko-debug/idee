import type { Metadata } from "next";
import { copy } from "@/content/it";
import { SportView } from "@/features/sport/sport-view";

export const metadata: Metadata = { title: copy.sport.title, description: copy.sport.description };

export default function SportPage() {
  return <SportView />;
}
