import type { Metadata } from "next";
import { copy } from "@/content/it";
import { BookView } from "@/features/member/book-view";

export const metadata: Metadata = { title: copy.member.book.title };

export default function Page() {
  return <BookView />;
}
