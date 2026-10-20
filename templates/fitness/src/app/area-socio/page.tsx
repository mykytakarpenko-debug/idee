import type { Metadata } from "next";
import { copy } from "@/content/it";
import { OverviewView } from "@/features/member/overview-view";

export const metadata: Metadata = { title: copy.member.nav.overview };

export default function Page() {
  return <OverviewView />;
}
