import type { Metadata } from "next";
import { copy } from "@/content/it";
import { FloorView } from "@/features/panel/floor-view";

export const metadata: Metadata = { title: copy.floor.title };

export default function Page() {
  return <FloorView />;
}
