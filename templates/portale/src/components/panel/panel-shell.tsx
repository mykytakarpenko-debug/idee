"use client";

import { ChevronDown, LogOut, Menu, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";
import { copy } from "@/content/it";
import {
  adminNavigation,
  isActivePath,
  portalNavigation,
  routes,
  type NavItem,
} from "@/config/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useData } from "@/hooks/use-data";
import { can, homeFor, isStaff, type Permission } from "@/lib/domain/rbac";
import type { User } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { useDataStore } from "@/store/data-store";
import { useSessionStore } from "@/store/session-store";
import { useUiStore } from "@/store/ui-store";
import { Avatar } from "@/components/ui/avatar";
import { buttonClasses } from "@/components/ui/button";
import { Dialog, SheetContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DataBootstrap } from "@/components/layout/data-bootstrap";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export type Area = "portal" | "admin";

/** Classi statiche (Tailwind non genera classi composte a runtime). */
const COLUMNS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
};

/** Esce dopo il tempo di inattività previsto dalle impostazioni. */
function useIdleTimeout(user: User | null) {
  const router = useRouter();
  const minutes = useData((state) => state.settings.sessionTimeoutMinutes);
  useEffect(() => {
    if (!user) return;
    const { touch, signOut } = useSessionStore.getState();
    let last = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - last > 15_000) {
        last = now;
        touch(now);
      }
    };
    const events = ["pointerdown", "keydown", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    const check = () => {
      const idle = Date.now() - useSessionStore.getState().lastActivity;
      if (idle > minutes * 60_000) {
        signOut("expired");
        router.replace(routes.login);
      }
    };
    // Controllo subito (pagina riaperta dopo ore) e poi ogni 30 secondi.
    check();
    const timer = setInterval(check, 30_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      clearInterval(timer);
    };
  }, [user, minutes, router]);
}

/** Struttura di portale e amministrazione: sidebar, intestazione con account, barra mobile. */
export function PanelShell({ area, children }: { area: Area; children: ReactNode }) {
  const router = useRouter();
  const { user, org, loading } = useAuth();
  const signOut = useSessionStore((state) => state.signOut);
  const providerName = useData((state) => state.settings.providerName);
  useIdleTimeout(user);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace(routes.login);
    else if (user.status !== "active" || org?.active === false) {
      signOut();
      router.replace(routes.login);
    }
  }, [loading, user, org, router, signOut]);

  const nav = (area === "admin" ? adminNavigation : portalNavigation).filter(
    (item) => user && can(user.role, item.permission),
  );
  const wrongArea = user ? (area === "admin") !== isStaff(user.role) : false;
  const title = area === "admin" ? providerName : (org?.name ?? "");
  const areaLabel = area === "admin" ? copy.nav.adminArea : copy.nav.portalArea;

  return (
    <TooltipProvider delayDuration={300}>
      <a
        href="#main"
        className="fixed top-2 left-2 z-[100] -translate-y-20 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg shadow-md transition-transform focus:translate-y-0"
      >
        {copy.a11y.skipToContent}
      </a>
      <DataBootstrap />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-surface md:flex">
        <div className="flex h-16 items-center px-5">
          <Link
            href={area === "admin" ? routes.admin : routes.portal}
            className="min-w-0 rounded-md"
          >
            <span className="block truncate text-[15px] font-semibold text-fg">{title || " "}</span>
            <span className="block text-xs text-fg-muted">{areaLabel}</span>
          </Link>
        </div>
        <Suspense fallback={<SideNav items={nav} pathname={null} />}>
          <SideNavWithPath items={nav} />
        </Suspense>
      </aside>

      <div className="flex min-h-dvh flex-col md:pl-60">
        <header className="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-2 px-4 sm:px-6 lg:px-8">
            <span className="truncate text-[15px] font-semibold text-fg md:hidden">{title}</span>
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <ThemeToggle />
              {user ? (
                <AccountMenu user={user} area={area} orgName={org?.name ?? providerName} />
              ) : null}
            </div>
          </div>
        </header>
        <main
          id="main"
          tabIndex={-1}
          className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] outline-none md:pb-0"
        >
          {loading || !user ? (
            <div
              className="mx-auto max-w-[1400px] space-y-4 px-4 py-8 sm:px-6 lg:px-8"
              aria-busy="true"
            >
              <Skeleton className="h-9 w-64" />
              <Skeleton className="h-64 rounded-xl" />
            </div>
          ) : wrongArea ? (
            <Forbidden home={homeFor(user.role)} />
          ) : (
            children
          )}
        </main>
      </div>

      <Suspense fallback={null}>
        <MobileNavWithPath items={nav} />
      </Suspense>
      <Toaster />
    </TooltipProvider>
  );
}

/** Contenuto riservato a chi ha il permesso; altrimenti avviso (in produzione: 403 dal server). */
export function RequirePermission({
  permission,
  children,
}: {
  permission: Permission;
  children: ReactNode;
}) {
  const { user } = useAuth();
  if (!user) return null;
  if (!can(user.role, permission)) return <Forbidden home={homeFor(user.role)} />;
  return children;
}

function Forbidden({ home }: { home: string }) {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="sr-only">{copy.auth.forbiddenTitle}</h1>
      <EmptyState
        icon={ShieldCheck}
        title={copy.auth.forbiddenTitle}
        description={copy.auth.forbiddenText}
        action={
          <Link href={home} className={buttonClasses({})}>
            {copy.auth.goHome}
          </Link>
        }
      />
    </div>
  );
}

function AccountMenu({ user, area, orgName }: { user: User; area: Area; orgName: string }) {
  const router = useRouter();
  const signOut = useSessionStore((state) => state.signOut);
  const log = useDataStore((state) => state.log);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={buttonClasses({ variant: "ghost", className: "gap-2 px-2" })}>
        <span aria-hidden>
          <Avatar name={user.name} size="sm" />
        </span>
        <span className="sr-only">{copy.a11y.accountMenu}: </span>
        <span className="sr-only text-sm text-fg sm:not-sr-only">{user.name}</span>
        <ChevronDown aria-hidden className="size-4 text-fg-muted" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <span className="block text-sm font-medium text-fg">{user.name}</span>
          <span className="block text-xs font-normal text-fg-muted">
            {copy.roles[user.role]} · {orgName}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {area === "portal" ? (
          <DropdownMenuItem onSelect={() => router.push(routes.security)}>
            <ShieldCheck aria-hidden />
            {copy.nav.security}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          onSelect={() => {
            log(user.id, "auth.logout", user.email, user.orgId);
            signOut();
            router.push(routes.login);
          }}
        >
          <LogOut aria-hidden />
          {copy.nav.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SideNavWithPath({ items }: { items: NavItem[] }) {
  return <SideNav items={items} pathname={usePathname()} />;
}

function SideNav({ items, pathname }: { items: NavItem[]; pathname: string | null }) {
  return (
    <nav aria-label={copy.a11y.panelNavigation} className="flex-1 overflow-y-auto px-3 py-2">
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => {
          const active = pathname !== null && isActivePath(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent-soft text-accent-soft-fg"
                    : "text-fg-muted hover:bg-surface-2 hover:text-fg",
                )}
              >
                <Icon aria-hidden className="size-[18px]" strokeWidth={active ? 2.2 : 1.9} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function MobileNavWithPath({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const open = useUiStore((state) => state.mobileNavOpen);
  const setOpen = useUiStore((state) => state.setMobileNavOpen);
  if (items.length === 0) return null;
  const tabs = items.slice(0, 4);
  const rest = items.slice(4);
  return (
    <>
      <nav
        aria-label={copy.a11y.mobileNavigation}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <ul className={cn("grid", COLUMNS[rest.length > 0 ? 5 : tabs.length])}>
          {tabs.map((tab) => {
            const active = isActivePath(pathname, tab.href);
            const Icon = tab.icon;
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium",
                    active ? "text-accent-text" : "text-fg-muted",
                  )}
                >
                  <Icon aria-hidden className="size-[22px]" strokeWidth={active ? 2.2 : 1.8} />
                  {tab.label}
                </Link>
              </li>
            );
          })}
          {rest.length > 0 ? (
            <li>
              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={open}
                className="flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-medium text-fg-muted"
              >
                <Menu aria-hidden className="size-[22px]" strokeWidth={1.8} />
                {copy.nav.more}
              </button>
            </li>
          ) : null}
        </ul>
      </nav>
      <Dialog open={open} onOpenChange={setOpen}>
        <SheetContent title={copy.a11y.panelNavigation} side="left">
          <nav aria-label={copy.a11y.panelNavigation} className="flex flex-col gap-1 p-3 pt-6">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex h-11 items-center gap-3 rounded-lg px-3 text-[15px] font-medium text-fg hover:bg-surface-2"
                >
                  <Icon aria-hidden className="size-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Dialog>
    </>
  );
}
