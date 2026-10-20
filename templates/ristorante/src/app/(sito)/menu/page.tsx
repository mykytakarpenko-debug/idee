import type { Metadata } from "next";
import { copy } from "@/content/it";
import { MenuView } from "@/features/site/menu-view";

export const metadata: Metadata = { title: copy.menu.title, description: copy.menu.description };

export default function MenuPage() {
  return <MenuView />;
}
