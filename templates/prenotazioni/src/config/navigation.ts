import { CalendarClock, CalendarDays, Settings, Tags, type LucideIcon } from "lucide-react";
import { copy } from "@/content/it";

export const routes = {
  home: "/",
  book: "/prenota",
  manage: "/prenotazione",
  appointment: (code: string) => `/prenotazione/${encodeURIComponent(code)}`,
  widget: "/widget",
  privacy: "/privacy",
  panel: "/gestione",
  availability: "/gestione/disponibilita",
  services: "/gestione/servizi",
  settings: "/gestione/impostazioni",
} as const;

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const siteNavigation = [
  { href: "/#servizi", label: copy.site.nav.services },
  { href: "/#studio", label: copy.site.nav.team },
  { href: "/#domande", label: copy.site.nav.faq },
  { href: routes.manage, label: copy.site.nav.manage },
] as const;

export const panelNavigation: NavItem[] = [
  { href: routes.panel, label: copy.panel.nav.agenda, icon: CalendarDays },
  { href: routes.availability, label: copy.panel.nav.availability, icon: CalendarClock },
  { href: routes.services, label: copy.panel.nav.services, icon: Tags },
  { href: routes.settings, label: copy.panel.nav.settings, icon: Settings },
];

export function isActivePath(pathname: string, href: string): boolean {
  if (href === routes.panel || href === routes.home) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
