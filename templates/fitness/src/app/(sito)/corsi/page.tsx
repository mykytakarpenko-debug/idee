import type { Metadata } from "next";
import { copy } from "@/content/it";
import { CoursesView } from "@/features/site/courses-view";

export const metadata: Metadata = {
  title: copy.courses.title,
  description: copy.courses.description,
};

export default function Page() {
  return <CoursesView />;
}
