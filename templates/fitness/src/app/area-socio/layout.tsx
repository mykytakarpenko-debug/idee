import type { Metadata } from "next";
import { MemberShell } from "@/components/member/member-shell";

/**
 * Area socio. In demo l'accesso è simulato (vedi /accedi): in produzione
 * proteggi queste pagine con l'autenticazione (docs/architettura.md).
 */
export const metadata: Metadata = {
  title: { default: "Area socio", template: "%s · Area socio" },
  robots: { index: false, follow: false },
};

export default function MemberLayout({ children }: LayoutProps<"/area-socio">) {
  return <MemberShell>{children}</MemberShell>;
}
