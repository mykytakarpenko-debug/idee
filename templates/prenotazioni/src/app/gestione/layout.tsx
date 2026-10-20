import type { Metadata } from "next";
import { PanelShell } from "@/components/panel/panel-shell";

/**
 * Pannello di gestione. In produzione proteggi /gestione con autenticazione
 * (vedi docs/architettura.md): in demo è accessibile a tutti.
 */
export const metadata: Metadata = {
  title: { default: "Gestione", template: "%s · Gestione" },
  robots: { index: false, follow: false },
};

export default function PanelLayout({ children }: LayoutProps<"/gestione">) {
  return <PanelShell>{children}</PanelShell>;
}
