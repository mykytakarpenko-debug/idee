"use client";

import { Menu, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { copy } from "@/content/it";
import { isActivePath, routes, siteNavigation } from "@/config/navigation";
import { useSiteData } from "@/hooks/use-site-data";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button, buttonClasses } from "@/components/ui/button";
import { Dialog, SheetContent } from "@/components/ui/dialog";
import { Logo } from "./logo";

export function SiteHeader() {
  const { settings } = useSiteData();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href={routes.home} className="rounded-md">
          <Logo name={settings.name} />
        </Link>
        <Suspense fallback={<SiteNav pathname={null} />}>
          <SiteNavWithPath />
        </Suspense>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Link
            href={routes.login}
            className={buttonClasses({ variant: "ghost", className: "max-md:hidden" })}
          >
            <UserRound aria-hidden />
            {copy.site.login}
          </Link>
          <Link href={routes.trial} className={buttonClasses({ className: "max-sm:hidden" })}>
            {copy.site.cta.trial}
          </Link>
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
            <Logo name={settings.name} />
          </div>
          <nav aria-label={copy.a11y.mainNavigation} className="flex flex-col gap-1 p-3">
            {siteNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-[15px] font-medium text-fg hover:bg-surface-2"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={routes.login}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-[15px] font-medium text-fg hover:bg-surface-2"
            >
              {copy.site.login}
            </Link>
          </nav>
          <div className="mt-auto p-4">
            <Link
              href={routes.trial}
              onClick={() => setOpen(false)}
              className={buttonClasses({ size: "lg", className: "w-full" })}
            >
              {copy.site.cta.trial}
            </Link>
          </div>
        </SheetContent>
      </Dialog>
    </header>
  );
}

function SiteNavWithPath() {
  return <SiteNav pathname={usePathname()} />;
}

function SiteNav({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label={copy.a11y.mainNavigation} className="hidden md:block">
      <ul className="flex items-center gap-1">
        {siteNavigation.map((item) => {
          const active = pathname !== null && isActivePath(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "text-fg" : "text-fg-muted hover:text-fg",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
