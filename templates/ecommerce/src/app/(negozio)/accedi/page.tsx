import type { Metadata } from "next";
import { copy } from "@/content/it";
import { LoginView } from "@/features/account/login-view";

export const metadata: Metadata = { title: copy.account.loginTitle, robots: { index: false } };

export default function LoginPage() {
  return <LoginView />;
}
