"use client";

import { ExternalLink, Menu, UserPlus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { copy } from "@/content/it";
import { isActivePath, panelNavigation, routes, type NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { useDataStore } from "@/store/data-store";
import { openDialog, useUiStore } from "@/store/ui-store";
import { Button, buttonClasses } from "@/components/ui/button";
import { Dialog, SheetContent } from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DataBootstrap } from "@/components/layout/data-bootstrap";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { PanelDialogs } from "./panel-dialogs";
import { useNavCounts } from "./nav-counts";

/** Struttura del pannello: sidebar (desktop), barra superiore, barra inferiore (mobile). */
export function PanelShell({ children }: { children: ReactNode }) {
  const name = useDataStore((state) => (state.ready ? state.settings.name : ""));
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
          <Link href={routes.panel} className="min-w-0 rounded-md">
            <span className="block truncate font-display text-lg font-bold text-fg">
              {name || " "}
            </span>
            <span className="block text-xs text-fg-muted">{copy.panel.area}</span>
          </Link>
        </div>
        <Suspense fallback={<SideNav pathname={null} />}>
          <SideNavWithPath />
        </Suspense>
        <div className="border-t border-line p-3">
          <Link
            href={routes.home}
            className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-fg-muted hover:bg-surface-2 hover:text-fg"
          >
            <ExternalLink aria-hidden className="size-[18px]" />
            {copy.panel.nav.site}
          </Link>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-col md:pl-60">
        <header className="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-2 px-4 sm:px-6 lg:px-8">
            <span className="truncate font-display text-lg font-bold text-fg md:hidden">
              {name}
            </span>
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <ThemeToggle />
              <Link
                href={routes.home}
                className={buttonClasses({ variant: "ghost", className: "max-md:hidden" })}
              >
                <ExternalLink aria-hidden />
                {copy.panel.nav.site}
              </Link>
              <Button
                onClick={() => openDialog({ type: "member" })}
                className="max-sm:size-10 max-sm:px-0"
              >
                <UserPlus aria-hidden />
                <span className="max-sm:sr-only">{copy.panel.newMember}</span>
              </Button>
            </div>
          </div>
        </header>
        <main
          id="main"
          tabIndex={-1}
          className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] outline-none md:pb-0"
        >
          {children}
        </main>
      </div>

      <Suspense fallback={null}>
        <MobileNavWithPath />
      </Suspense>
      <PanelDialogs />
      <Toaster />
    </TooltipProvider>
  );
}

function SideNavWithPath() {
  return <SideNav pathname={usePathname()} />;
}

function SideNav({ pathname }: { pathname: string | null }) {
  const counts = useNavCounts();
  return (
    <nav aria-label={copy.a11y.panelNavigation} className="flex-1 overflow-y-auto px-3 py-2">
      <ul className="flex flex-col gap-0.5">
        {panelNavigation.map((item) => (
          <li key={item.href}>
            <NavLink
              item={item}
              active={pathname !== null && isActivePath(pathname, item.href)}
              count={counts[item.href] ?? 0}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function NavLink({ item, active, count }: { item: NavItem; active: boolean; count: number }) {
  const Icon = item.icon;
  return (
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
      <span className="flex-1">{item.label}</span>
      {count > 0 ? (
        <span className="rounded-full bg-accent px-1.5 text-[11px] leading-5 font-semibold text-accent-fg tabular-nums">
          {count}
        </span>
      ) : null}
    </Link>
  );
}

function MobileNavWithPath() {
  const pathname = usePathname();
  const counts = useNavCounts();
  const open = useUiStore((state) => state.mobileNavOpen);
  const setOpen = useUiStore((state) => state.setMobileNavOpen);
  const tabs = panelNavigation.slice(0, 4);
  const rest = panelNavigation.slice(4);
  return (
    <>
      <nav
        aria-label={copy.a11y.mobileNavigation}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <ul className="grid grid-cols-5">
          {tabs.map((tab) => {
            const active = isActivePath(pathname, tab.href);
            const Icon = tab.icon;
            const count = counts[tab.href] ?? 0;
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium",
                    active ? "text-accent-text" : "text-fg-muted",
                  )}
                >
                  <Icon aria-hidden className="size-[22px]" strokeWidth={active ? 2.2 : 1.8} />
                  {tab.label}
                  {count > 0 ? (
                    <span className="absolute top-2 left-1/2 ml-2 rounded-full bg-accent px-1.5 text-[10px] leading-4 font-semibold text-accent-fg">
                      {count}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={open}
              className="flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-medium text-fg-muted"
            >
              <Menu aria-hidden className="size-[22px]" strokeWidth={1.8} />
              {copy.panel.nav.more}
            </button>
          </li>
        </ul>
      </nav>
      <Dialog open={open} onOpenChange={setOpen}>
        <SheetContent title={copy.a11y.panelNavigation} side="left">
          <nav aria-label={copy.a11y.panelNavigation} className="flex flex-col gap-1 p-3 pt-6">
            {[...rest, ...panelNavigation.slice(0, 4)].map((item) => {
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
            <Link
              href={routes.home}
              onClick={() => setOpen(false)}
              className="flex h-11 items-center gap-3 rounded-lg px-3 text-[15px] font-medium text-fg hover:bg-surface-2"
            >
              <ExternalLink aria-hidden className="size-5" />
              {copy.panel.nav.site}
            </Link>
          </nav>
        </SheetContent>
      </Dialog>
    </>
  );
}
