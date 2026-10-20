import {
  CalendarCheck,
  ClipboardList,
  LayoutGrid,
  Settings,
  Sun,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { copy } from "@/content/it";

export const routes = {
  home: "/",
  menu: "/menu",
  book: "/prenota",
  order: "/ordina",
  checkout: "/ordina/checkout",
  tracking: (number: string) => `/ordine/${encodeURIComponent(number)}`,
  privacy: "/privacy",
  panel: "/gestione",
  reservations: "/gestione/prenotazioni",
  floor: "/gestione/sala",
  orders: "/gestione/ordini",
  menuAdmin: "/gestione/menu",
  settings: "/gestione/impostazioni",
} as const;

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const siteNavigation = [
  { href: routes.menu, label: copy.site.nav.menu },
  { href: routes.book, label: copy.site.nav.book },
  { href: routes.order, label: copy.site.nav.order },
] as const;

export const panelNavigation: NavItem[] = [
  { href: routes.panel, label: copy.panel.nav.dashboard, icon: Sun },
  { href: routes.reservations, label: copy.panel.nav.reservations, icon: CalendarCheck },
  { href: routes.floor, label: copy.panel.nav.floor, icon: LayoutGrid },
  { href: routes.orders, label: copy.panel.nav.orders, icon: ClipboardList },
  { href: routes.menuAdmin, label: copy.panel.nav.menu, icon: UtensilsCrossed },
  { href: routes.settings, label: copy.panel.nav.settings, icon: Settings },
];

export function isActivePath(pathname: string, href: string): boolean {
  if (href === routes.panel || href === routes.home) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
