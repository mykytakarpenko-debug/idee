"use client";

import { Menu, UserRound, Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { copy } from "@/content/it";
import { routes, siteNavigation } from "@/config/navigation";
import { usePlayer } from "@/hooks/use-player";
import { DEMO_SETTINGS } from "@/lib/demo/seed";
import { formatCurrency } from "@/lib/format";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button, buttonClasses } from "@/components/ui/button";
import { Dialog, SheetContent } from "@/components/ui/dialog";
import { Logo } from "./logo";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { player } = usePlayer();

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6 lg:gap-6">
        <Link href={routes.home} className="shrink-0 rounded-md">
          <Logo name={DEMO_SETTINGS.name} />
        </Link>
        <nav aria-label={copy.a11y.mainNavigation} className="hidden md:block">
          <ul className="flex items-center gap-1">
            {siteNavigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-fg-muted transition-colors hover:text-fg"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          {player ? (
            <Link
              href={routes.account}
              className={buttonClasses({ variant: "secondary", className: "gap-2 tabular-nums" })}
              aria-label={`${copy.site.account}. ${copy.site.balanceLabel(formatCurrency(player.balance))}`}
            >
              <Wallet aria-hidden />
              {formatCurrency(player.balance)}
            </Link>
          ) : (
            <>
              <Link
                href={routes.login}
                className={buttonClasses({ variant: "ghost", className: "max-sm:hidden" })}
              >
                {copy.site.login}
              </Link>
              <Link
                href={routes.register}
                className={buttonClasses({ className: "max-sm:hidden" })}
              >
                {copy.site.register}
              </Link>
              <Link
                href={routes.login}
                className={buttonClasses({
                  variant: "ghost",
                  size: "icon",
                  className: "sm:hidden",
                })}
                aria-label={copy.site.login}
              >
                <UserRound aria-hidden />
              </Link>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen(true)}
            aria-label={copy.a11y.openMenu}
          >
            <Menu aria-hidden />
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <SheetContent title={copy.a11y.mainNavigation} side="right">
          <div className="flex h-16 items-center border-b border-line px-5">
            <Logo name={DEMO_SETTINGS.name} />
          </div>
          <nav aria-label={copy.a11y.mainNavigation} className="flex flex-col gap-1 p-3">
            {[
              ...siteNavigation,
              { href: routes.rules, label: copy.site.nav.rules },
              player
                ? { href: routes.account, label: copy.site.account }
                : { href: routes.register, label: copy.site.register },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-[15px] font-medium text-fg hover:bg-surface-2"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Dialog>
    </header>
  );
}
