"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { brand } from "@/config/brand";
import { copy } from "@/content/it";
import { isActivePath, navigation, settingsItem, type NavItem } from "@/config/navigation";
import { useDataStore } from "@/store/data-store";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";
import { Logo, LogoMark } from "./logo";

/**
 * Navigazione laterale.
 * - ≥ 1024 px: sidebar completa con etichette.
 * - 768–1023 px: barra compatta a icone con suggerimenti.
 * - < 768 px: nascosta (si usano barra inferiore e menu a scomparsa).
 */
export function Sidebar() {
  const businessName = useDataStore((state) => (state.ready ? state.settings.name : ""));

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[72px] flex-col border-r border-line bg-surface md:flex lg:w-64">
      <div className="flex h-16 shrink-0 items-center px-5 max-lg:justify-center max-lg:px-0">
        <Link href="/dashboard" className="rounded-md">
          <Logo className="hidden lg:flex" subtitle={businessName || " "} />
          <LogoMark className="lg:hidden" />
          <span className="sr-only">
            <span className="lg:hidden">{brand.name}</span>, {copy.a11y.goToDashboard}
          </span>
        </Link>
      </div>
      {/* La voce attiva dipende dall'URL: su rotte dinamiche si risolve dopo il prerender. */}
      <Suspense fallback={<SidebarNav pathname={null} />}>
        <SidebarNavWithPath />
      </Suspense>
    </aside>
  );
}

function SidebarNavWithPath() {
  return <SidebarNav pathname={usePathname()} />;
}

function SidebarNav({ pathname }: { pathname: string | null }) {
  return (
    <>
      <nav aria-label={copy.a11y.mainNavigation} className="flex-1 overflow-y-auto px-3 py-2">
        {navigation.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-1.5 hidden px-3 text-[11px] font-medium tracking-wide text-fg-subtle uppercase lg:block">
              {group.label}
            </p>
            <div className="mx-auto mb-2 h-px w-6 bg-line lg:hidden" aria-hidden />
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <SidebarLink
                    item={item}
                    active={pathname !== null && isActivePath(pathname, item.href)}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-line px-3 py-3">
        <SidebarLink
          item={settingsItem}
          active={pathname !== null && isActivePath(pathname, settingsItem.href)}
        />
      </div>
    </>
  );
}

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Tooltip content={item.label} side="right" contentClassName="lg:hidden">
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150",
          "max-lg:justify-center max-lg:px-0",
          active
            ? "bg-accent-soft text-accent-soft-fg"
            : "text-fg-muted hover:bg-surface-2 hover:text-fg",
        )}
      >
        <Icon aria-hidden className="size-[18px] shrink-0" strokeWidth={active ? 2.2 : 1.9} />
        <span className="max-lg:sr-only">{item.label}</span>
      </Link>
    </Tooltip>
  );
}
