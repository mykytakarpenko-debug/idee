import type { Metadata } from "next";
import { copy } from "@/content/it";
import { MembersView } from "@/features/panel/members-view";

export const metadata: Metadata = { title: copy.members.title };

export default function Page() {
  return <MembersView />;
}
