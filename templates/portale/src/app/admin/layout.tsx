import { PanelShell } from "@/components/panel/panel-shell";

/** Area amministrativa del fornitore (ruoli staff). */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <PanelShell area="admin">{children}</PanelShell>;
}
