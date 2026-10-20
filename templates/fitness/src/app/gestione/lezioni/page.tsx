import type { Metadata } from "next";
import { copy } from "@/content/it";
import { ClassesView } from "@/features/panel/classes-view";

export const metadata: Metadata = { title: copy.classes.title };

export default function Page() {
  return <ClassesView />;
}
