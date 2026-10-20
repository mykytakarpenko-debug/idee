import type { Metadata } from "next";
import { copy } from "@/content/it";
import { ProfileView } from "@/features/member/profile-view";

export const metadata: Metadata = { title: copy.member.profile.title };

export default function Page() {
  return <ProfileView />;
}
