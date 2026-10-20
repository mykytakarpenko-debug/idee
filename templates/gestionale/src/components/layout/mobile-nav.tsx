"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { copy } from "@/content/it";
import { isActivePath, mobileTabs, navigation, settingsItem } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { useDataStore } from "@/store/data-store";
import { useUiStore } from "@/store/ui-store";
import { Dialog, SheetContent } from "@/components/ui/dialog";
import { Logo } from "./logo";

/** Barra inferiore su smartphone: le 4 sezioni più usate + "Altro". */
export function MobileTabBar() {
  return (
    <Suspense fallback={<TabBar pathname={null} />}>
      <TabBarWithPath />
    </Suspense>
  );
}

function TabBarWithPath() {
  return <TabBar pathname={usePathname()} />;
}

function TabBar({ pathname }: { pathname: string | null }) {
  const setMobileNavOpen = useUiStore((state) => state.setMobileNavOpen);
  const mobileNavOpen = useUiStore((state) => state.mobileNavOpen);
  const inTabs = pathname === null || mobileTabs.some((tab) => isActivePath(pathname, tab.href));

  return (
    <nav
      aria-label={copy.a11y.mobileNavigation}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-5">
        {mobileTabs.map((tab) => {
          const active = pathname !== null && isActivePath(pathname, tab.href);
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  active ? "text-accent-text" : "text-fg-muted",
                )}
              >
                <Icon aria-hidden className="size-[22px]" strokeWidth={active ? 2.2 : 1.8} />
                {tab.label}
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-expanded={mobileNavOpen}
            aria-haspopup="dialog"
            className={cn(
              "flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-medium",
              !inTabs ? "text-accent-text" : "text-fg-muted",
            )}
          >
            <Menu aria-hidden className="size-[22px]" strokeWidth={1.8} />
            {copy.nav.more}
          </button>
        </li>
      </ul>
    </nav>
  );
}

/** Menu completo a scomparsa (mobile). */
export function MobileNavSheet() {
  return (
    <Suspense fallback={null}>
      <MobileNavSheetWithPath />
    </Suspense>
  );
}

function MobileNavSheetWithPath() {
  const pathname = usePathname();
  const open = useUiStore((state) => state.mobileNavOpen);
  const setOpen = useUiStore((state) => state.setMobileNavOpen);
  const businessName = useDataStore((state) => (state.ready ? state.settings.name : ""));
  const items = [...navigation.flatMap((group) => group.items), settingsItem];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <SheetContent title={copy.a11y.mainNavigation} side="left">
        <div className="flex h-16 items-center border-b border-line px-5">
          <Logo subtitle={businessName || " "} />
        </div>
        <nav aria-label={copy.a11y.mainNavigation} className="flex-1 overflow-y-auto p-3">
          <ul className="flex flex-col gap-0.5">
            {items.map((item) => {
              const active = isActivePath(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-11 items-center gap-3 rounded-lg px-3 text-[15px] font-medium",
                      active ? "bg-accent-soft text-accent-soft-fg" : "text-fg hover:bg-surface-2",
                    )}
                  >
                    <Icon aria-hidden className="size-5 text-current" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </SheetContent>
    </Dialog>
  );
}
