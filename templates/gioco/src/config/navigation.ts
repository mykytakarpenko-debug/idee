import { CalendarCheck, LayoutDashboard, Users, type LucideIcon } from "lucide-react";
import { copy } from "@/content/it";

export const routes = {
  home: "/",
  sport: "/sport",
  games: "/giochi",
  game: (slug: string) => `/giochi/${encodeURIComponent(slug)}`,
  responsible: "/gioco-responsabile",
  rules: "/regole",
  account: "/conto",
  login: "/accedi",
  register: "/registrazione",
  terms: "/termini",
  privacy: "/privacy",
  minors: "/minori",
  panel: "/operatore",
  players: "/operatore/giocatori",
  events: "/operatore/eventi",
} as const;

export const siteNavigation = [
  { href: routes.sport, label: copy.site.nav.sport },
  { href: routes.games, label: copy.site.nav.games },
  { href: routes.responsible, label: copy.site.nav.responsible },
] as const;

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const panelNavigation: NavItem[] = [
  { href: routes.panel, label: copy.panel.nav.dashboard, icon: LayoutDashboard },
  { href: routes.players, label: copy.panel.nav.players, icon: Users },
  { href: routes.events, label: copy.panel.nav.events, icon: CalendarCheck },
];

export function isActivePath(pathname: string, href: string): boolean {
  if (href === routes.panel || href === routes.home) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
