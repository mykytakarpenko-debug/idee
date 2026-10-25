import type { Metadata } from "next";
import { RequirePermission } from "@/components/panel/panel-shell";
import { SettingsView } from "@/features/admin/settings-view";

export const metadata: Metadata = { title: "Impostazioni" };

export default function AdminImpostazioniPage() {
  return (
    <RequirePermission permission="settings.manage">
      <SettingsView />
    </RequirePermission>
  );
}
