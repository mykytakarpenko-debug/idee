import {
  CalendarDays,
  CalendarPlus,
  CreditCard,
  Gauge,
  Home,
  ScanLine,
  Settings,
  Tags,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { copy } from "@/content/it";

export const routes = {
  home: "/",
  courses: "/corsi",
  schedule: "/orari",
  pricing: "/prezzi",
  trial: "/prova-gratuita",
  privacy: "/privacy",
  login: "/accedi",
  member: "/area-socio",
  memberBook: "/area-socio/prenota",
  memberMembership: "/area-socio/abbonamento",
  memberProfile: "/area-socio/profilo",
  panel: "/gestione",
  members: "/gestione/iscritti",
  classes: "/gestione/lezioni",
  checkin: "/gestione/check-in",
  plans: "/gestione/piani",
  settings: "/gestione/impostazioni",
} as const;

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const siteNavigation = [
  { href: routes.courses, label: copy.site.nav.courses },
  { href: routes.schedule, label: copy.site.nav.schedule },
  { href: routes.pricing, label: copy.site.nav.pricing },
] as const;

export const memberNavigation: NavItem[] = [
  { href: routes.member, label: copy.member.nav.overview, icon: Home },
  { href: routes.memberBook, label: copy.member.nav.book, icon: CalendarPlus },
  { href: routes.memberMembership, label: copy.member.nav.membership, icon: CreditCard },
  { href: routes.memberProfile, label: copy.member.nav.profile, icon: UserRound },
];

export const panelNavigation: NavItem[] = [
  { href: routes.panel, label: copy.panel.nav.dashboard, icon: Gauge },
  { href: routes.members, label: copy.panel.nav.members, icon: Users },
  { href: routes.classes, label: copy.panel.nav.classes, icon: CalendarDays },
  { href: routes.checkin, label: copy.panel.nav.checkin, icon: ScanLine },
  { href: routes.plans, label: copy.panel.nav.plans, icon: Tags },
  { href: routes.settings, label: copy.panel.nav.settings, icon: Settings },
];

/** Radici delle aree: attive solo sul percorso esatto. */
const ROOTS = new Set<string>([routes.home, routes.member, routes.panel]);

export function isActivePath(pathname: string, href: string): boolean {
  if (ROOTS.has(href)) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
