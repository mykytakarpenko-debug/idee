import {
  Building2,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  Receipt,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import { copy } from "@/content/it";
import type { Permission } from "@/lib/domain/rbac";

export const routes = {
  login: "/",
  privacy: "/privacy",
  portal: "/portale",
  projects: "/portale/progetti",
  documents: "/portale/documenti",
  tickets: "/portale/assistenza",
  ticket: (id: string) => `/portale/assistenza/${encodeURIComponent(id)}`,
  invoices: "/portale/fatture",
  team: "/portale/team",
  security: "/portale/sicurezza",
  admin: "/admin",
  clients: "/admin/clienti",
  users: "/admin/utenti",
  roles: "/admin/ruoli",
  adminTickets: "/admin/ticket",
  adminTicket: (id: string) => `/admin/ticket/${encodeURIComponent(id)}`,
  audit: "/admin/registro",
  settings: "/admin/impostazioni",
} as const;

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: Permission;
}

export const portalNavigation: NavItem[] = [
  {
    href: routes.portal,
    label: copy.nav.portal.overview,
    icon: LayoutDashboard,
    permission: "portal.access",
  },
  {
    href: routes.projects,
    label: copy.nav.portal.projects,
    icon: FolderKanban,
    permission: "projects.view",
  },
  {
    href: routes.tickets,
    label: copy.nav.portal.tickets,
    icon: LifeBuoy,
    permission: "tickets.view",
  },
  {
    href: routes.documents,
    label: copy.nav.portal.documents,
    icon: FileText,
    permission: "documents.view",
  },
  {
    href: routes.invoices,
    label: copy.nav.portal.invoices,
    icon: Receipt,
    permission: "invoices.view",
  },
  { href: routes.team, label: copy.nav.portal.team, icon: Users, permission: "team.view" },
  {
    href: routes.security,
    label: copy.nav.portal.security,
    icon: ShieldCheck,
    permission: "portal.access",
  },
];

export const adminNavigation: NavItem[] = [
  {
    href: routes.admin,
    label: copy.nav.admin.dashboard,
    icon: LayoutDashboard,
    permission: "admin.access",
  },
  {
    href: routes.adminTickets,
    label: copy.nav.admin.tickets,
    icon: LifeBuoy,
    permission: "tickets.manage",
  },
  {
    href: routes.clients,
    label: copy.nav.admin.clients,
    icon: Building2,
    permission: "clients.manage",
  },
  { href: routes.users, label: copy.nav.admin.users, icon: UserCog, permission: "users.manage" },
  { href: routes.roles, label: copy.nav.admin.roles, icon: ListChecks, permission: "users.manage" },
  { href: routes.audit, label: copy.nav.admin.audit, icon: ShieldCheck, permission: "audit.view" },
  {
    href: routes.settings,
    label: copy.nav.admin.settings,
    icon: Settings,
    permission: "settings.manage",
  },
];

export function isActivePath(pathname: string, href: string): boolean {
  if (href === routes.portal || href === routes.admin) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
