"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { copy } from "@/content/it";
import { useUiStore } from "@/store/ui-store";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { LogoMark } from "./logo";
import { NotificationsMenu } from "./notifications-menu";
import { QuickCreate } from "./quick-create";
import { UserMenu } from "./user-menu";

export function Topbar() {
  const setCommandOpen = useUiStore((state) => state.setCommandOpen);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur-md supports-[backdrop-filter]:bg-canvas/70">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="rounded-md md:hidden" aria-label={copy.nav.dashboard}>
          <LogoMark />
        </Link>

        {/* Ricerca rapida: campo su desktop, icona su mobile */}
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          className="hidden h-9 w-full max-w-md items-center gap-2.5 rounded-lg border border-line bg-surface px-3 text-left text-sm text-fg-subtle shadow-xs transition-colors hover:border-line-strong/50 sm:flex"
          aria-keyshortcuts="Control+K Meta+K"
        >
          <Search aria-hidden className="size-4 shrink-0" />
          <span className="flex-1 truncate">{copy.topbar.searchPlaceholder}</span>
          <span className="flex gap-0.5" aria-hidden>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => setCommandOpen(true)}
            aria-label={copy.topbar.searchShortcut}
          >
            <Search aria-hidden />
          </Button>
          <QuickCreate />
          <NotificationsMenu />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
