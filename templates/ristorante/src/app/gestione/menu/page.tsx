import type { Metadata } from "next";
import { copy } from "@/content/it";
import { MenuAdminView } from "@/features/panel/menu-admin-view";

export const metadata: Metadata = { title: copy.menuAdmin.title };

export default function Page() {
  return <MenuAdminView />;
}
