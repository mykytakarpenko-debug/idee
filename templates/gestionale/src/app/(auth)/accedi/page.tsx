import type { Metadata } from "next";
import { copy } from "@/content/it";
import { LoginView } from "@/features/auth/login-view";

export const metadata: Metadata = { title: copy.auth.submit };

export default function LoginPage() {
  return <LoginView />;
}
