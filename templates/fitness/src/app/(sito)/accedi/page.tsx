import type { Metadata } from "next";
import { copy } from "@/content/it";
import { LoginView } from "@/features/site/login-view";

export const metadata: Metadata = { title: copy.login.title, description: copy.login.description };

export default function Page() {
  return <LoginView />;
}
