import type { Metadata } from "next";
import { copy } from "@/content/it";
import { MembershipView } from "@/features/member/membership-view";

export const metadata: Metadata = { title: copy.member.membership.title };

export default function Page() {
  return <MembershipView />;
}
