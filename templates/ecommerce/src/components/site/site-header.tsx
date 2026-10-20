"use client";

import { Menu, Search, ShoppingBag, UserRound } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { useState } from "react";
import { copy } from "@/content/it";
import { routes, siteNavigation } from "@/config/navigation";
import { useCatalog } from "@/hooks/use-catalog";
import { cartCount } from "@/lib/domain/cart";
import { useCartStore } from "@/store/cart-store";
import { useSessionStore } from "@/store/session-store";
import { useUiStore } from "@/store/ui-store";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button, buttonClasses } from "@/components/ui/button";
import { Dialog, SheetContent } from "@/components/ui/dialog";
import { controlClasses } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

function SearchForm({ className, id }: { className?: string; id: string }) {
  return (
    <Form action={routes.shop} role="search" className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        {copy.site.searchLabel}
      </label>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle"
      />
      <input
        id={id}
        name="q"
        type="search"
        placeholder={copy.site.searchPlaceholder}
        className={cn(controlClasses, "h-10 pl-9 text-sm [&::-webkit-search-cancel-button]:hidden")}
      />
    </Form>
  );
}

export function SiteHeader() {
  const { settings } = useCatalog();
  const [open, setOpen] = useState(false);
  const count = useCartStore((state) => cartCount(state.lines));
  const signedIn = useSessionStore((state) => state.customerId !== null);
  const openCart = useUiStore((state) => state.setCartOpen);

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6 lg:gap-6">
        <Link href={routes.home} className="shrink-0 rounded-md">
          <Logo name={settings.name} />
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
        <SearchForm id="ricerca-intestazione" className="ml-auto hidden w-full max-w-64 lg:block" />
        <div className="ml-auto flex items-center gap-0.5 sm:gap-1 lg:ml-0">
          <Link
            href={routes.shop}
            className={buttonClasses({ variant: "ghost", size: "icon", className: "lg:hidden" })}
            aria-label={copy.site.searchLabel}
          >
            <Search aria-hidden />
          </Link>
          <ThemeToggle />
          <Link
            href={signedIn ? routes.account : routes.login}
            className={buttonClasses({ variant: "ghost", size: "icon" })}
            aria-label={copy.site.account}
          >
            <UserRound aria-hidden />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openCart(true)}
            aria-label={copy.site.cartWithCount(count)}
            aria-haspopup="dialog"
          >
            <ShoppingBag aria-hidden />
            {count > 0 ? (
              <span
                aria-hidden
                className="absolute -top-0.5 -right-0.5 min-w-5 rounded-full bg-accent px-1 text-center text-[11px] leading-5 font-semibold text-accent-fg tabular-nums"
              >
                {count}
              </span>
            ) : null}
          </Button>
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
          <div className="p-4 pb-0">
            <SearchForm id="ricerca-menu" />
          </div>
          <nav aria-label={copy.a11y.mainNavigation} className="flex flex-col gap-1 p-3">
            {[
              ...siteNavigation,
              { href: signedIn ? routes.account : routes.login, label: copy.site.account },
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
