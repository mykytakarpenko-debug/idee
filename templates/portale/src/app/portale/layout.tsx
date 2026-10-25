import { PanelShell } from "@/components/panel/panel-shell";

/**
 * Portale clienti. In produzione proteggi /portale lato server (proxy.ts) e
 * filtra ogni dato per l'organizzazione dell'utente: vedi docs/architettura.md.
 */
export default function PortalLayout({ children }: LayoutProps<"/portale">) {
  return <PanelShell area="portal">{children}</PanelShell>;
}
