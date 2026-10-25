import type { Metadata } from "next";
import { copy } from "@/content/it";
import { RegisterView } from "@/features/account/register-view";

export const metadata: Metadata = {
  title: copy.register.title,
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return <RegisterView />;
}
