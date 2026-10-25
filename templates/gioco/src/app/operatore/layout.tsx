import { PanelShell } from "@/components/panel/panel-shell";

/**
 * Pannello operatore. In demo è aperto; in produzione va protetto con
 * autenticazione dello staff, ruoli e registro degli accessi (docs/architettura.md).
 */
export default function OperatorLayout({ children }: LayoutProps<"/operatore">) {
  return <PanelShell>{children}</PanelShell>;
}
