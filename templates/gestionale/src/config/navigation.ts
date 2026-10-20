import {
  CalendarCheck,
  CalendarDays,
  ChartColumn,
  House,
  LayoutDashboard,
  Layers,
  Settings,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { copy } from "@/content/it";

/**
 * Mappa di navigazione. Aggiungi o rimuovi voci qui: sidebar, menu mobile e
 * ricerca rapida si aggiornano automaticamente.
 */
export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const routes = {
  dashboard: "/dashboard",
  appointments: "/appuntamenti",
  calendar: "/calendario",
  clients: "/clienti",
  client: (id: string) => `/clienti/${encodeURIComponent(id)}`,
  services: "/servizi",
  payments: "/pagamenti",
  reports: "/report",
  settings: "/impostazioni",
  login: "/accedi",
  passwordRecovery: "/recupera-password",
} as const;

export const navigation: NavGroup[] = [
  {
    label: copy.nav.groups.overview,
    items: [{ href: routes.dashboard, label: copy.nav.dashboard, icon: LayoutDashboard }],
  },
  {
    label: copy.nav.groups.operations,
    items: [
      { href: routes.appointments, label: copy.nav.appointments, icon: CalendarCheck },
      { href: routes.calendar, label: copy.nav.calendar, icon: CalendarDays },
      { href: routes.clients, label: copy.nav.clients, icon: Users },
      { href: routes.services, label: copy.nav.services, icon: Layers },
    ],
  },
  {
    label: copy.nav.groups.administration,
    items: [
      { href: routes.payments, label: copy.nav.payments, icon: Wallet },
      { href: routes.reports, label: copy.nav.reports, icon: ChartColumn },
    ],
  },
];

export const settingsItem: NavItem = {
  href: routes.settings,
  label: copy.nav.settings,
  icon: Settings,
};

/** Voci della barra inferiore su smartphone (la quinta apre il menu completo). */
export const mobileTabs: NavItem[] = [
  { href: routes.dashboard, label: copy.nav.home, icon: House },
  { href: routes.calendar, label: copy.nav.calendar, icon: CalendarDays },
  { href: routes.clients, label: copy.nav.clients, icon: Users },
  { href: routes.payments, label: copy.nav.payments, icon: Wallet },
];

export const allNavItems: NavItem[] = [...navigation.flatMap((group) => group.items), settingsItem];

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
