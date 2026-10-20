import type { Metadata } from "next";
import { copy } from "@/content/it";
import { RecoveryView } from "@/features/auth/recovery-view";

export const metadata: Metadata = { title: copy.auth.recovery.title };

export default function RecoveryPage() {
  return <RecoveryView />;
}
