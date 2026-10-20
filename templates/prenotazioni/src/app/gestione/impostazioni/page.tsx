import type { Metadata } from "next";
import { copy } from "@/content/it";
import { SettingsView } from "@/features/panel/settings-view";

export const metadata: Metadata = { title: copy.settings.title };

export default function Page() {
  return <SettingsView />;
}
