import type { Metadata } from "next";
import { copy } from "@/content/it";
import { AccountView } from "@/features/account/account-view";

export const metadata: Metadata = {
  title: copy.account.title,
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return <AccountView />;
}
