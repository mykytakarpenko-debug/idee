import {
  LayoutDashboard,
  Package,
  Settings,
  ShoppingBag,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react";
import { copy } from "@/content/it";

export const routes = {
  home: "/",
  shop: "/catalogo",
  offers: "/catalogo?offerte=1",
  category: (id: string) => `/catalogo?categoria=${encodeURIComponent(id)}`,
  product: (slug: string) => `/prodotto/${encodeURIComponent(slug)}`,
  sellers: "/laboratori",
  seller: (slug: string) => `/laboratori/${encodeURIComponent(slug)}`,
  cart: "/carrello",
  checkout: "/checkout",
  order: (number: string) => `/ordine/${encodeURIComponent(number)}`,
  login: "/accedi",
  account: "/account",
  conditions: "/condizioni-di-vendita",
  withdrawal: "/recesso",
  shipping: "/spedizioni",
  privacy: "/privacy",
  panel: "/gestione",
  orders: "/gestione/ordini",
  products: "/gestione/prodotti",
  customers: "/gestione/clienti",
  sellersPanel: "/gestione/laboratori",
  settings: "/gestione/impostazioni",
} as const;

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const siteNavigation = [
  { href: routes.shop, label: copy.site.nav.shop },
  { href: routes.sellers, label: copy.site.nav.sellers },
  { href: routes.offers, label: copy.site.nav.offers },
] as const;

export const panelNavigation: NavItem[] = [
  { href: routes.panel, label: copy.panel.nav.dashboard, icon: LayoutDashboard },
  { href: routes.orders, label: copy.panel.nav.orders, icon: ShoppingBag },
  { href: routes.products, label: copy.panel.nav.products, icon: Package },
  { href: routes.customers, label: copy.panel.nav.customers, icon: Users },
  { href: routes.sellersPanel, label: copy.panel.nav.sellers, icon: Store },
  { href: routes.settings, label: copy.panel.nav.settings, icon: Settings },
];

export function isActivePath(pathname: string, href: string): boolean {
  const path = href.split("?")[0] ?? href;
  if (path === routes.panel || path === routes.home) return pathname === path;
  return pathname === path || pathname.startsWith(`${path}/`);
}
