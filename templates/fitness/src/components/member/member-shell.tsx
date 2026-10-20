"use client";

import { ExternalLink, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";
import { copy } from "@/content/it";
import { isActivePath, memberNavigation, routes } from "@/config/navigation";
import { useDataReady } from "@/hooks/use-data";
import { useCurrentMember } from "@/hooks/use-member";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/store/session-store";
import { DataBootstrap } from "@/components/layout/data-bootstrap";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Logo } from "@/components/site/logo";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/toast";

/**
 * Struttura dell'area socio: barra superiore con navigazione (desktop) e
 * barra inferiore (mobile). Senza accesso rimanda alla pagina di login.
 */
export function MemberShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hydrated = useSessionStore((state) => state.hydrated);
  const memberId = useSessionStore((state) => state.memberId);
  const ready = useDataReady();
  const member = useCurrentMember();

  useEffect(() => {
    if (hydrated && !memberId) router.replace(routes.login);
  }, [hydrated, memberId, router]);

  return (
    <>
      <a
        href="#main"
        className="fixed top-2 left-2 z-[100] -translate-y-20 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg shadow-md transition-transform focus:translate-y-0"
      >
        {copy.a11y.skipToContent}
      </a>
      <DataBootstrap />
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-6 px-4 sm:px-6">
          <Link href={routes.member} className="rounded-md">
            <Logo name={copy.demo.member} />
          </Link>
          <Suspense fallback={<TopNav pathname={null} />}>
            <TopNavWithPath />
          </Suspense>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            {member ? (
              <AccountMenu name={`${member.firstName} ${member.lastName}`} email={member.email} />
            ) : null}
          </div>
        </div>
      </header>
      <main
        id="main"
        tabIndex={-1}
        className="min-h-[calc(100dvh-4rem)] pb-[calc(5rem+env(safe-area-inset-bottom))] outline-none md:pb-12"
      >
        {ready && member ? (
          children
        ) : (
          <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6" aria-busy="true">
            <Skeleton className="h-9 w-56" />
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        )}
      </main>
      <Suspense fallback={null}>
        <BottomNavWithPath />
      </Suspense>
      <Toaster />
    </>
  );
}

function TopNavWithPath() {
  return <TopNav pathname={usePathname()} />;
}

function TopNav({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label={copy.a11y.memberNavigation} className="hidden md:block">
      <ul className="flex items-center gap-1">
        {memberNavigation.map((item) => {
          const active = pathname !== null && isActivePath(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-accent-soft text-accent-soft-fg" : "text-fg-muted hover:text-fg",
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

function BottomNavWithPath() {
  const pathname = usePathname();
  return (
    <nav
      aria-label={copy.a11y.mobileNavigation}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-4">
        {memberNavigation.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium",
                  active ? "text-accent-text" : "text-fg-muted",
                )}
              >
                <Icon aria-hidden className="size-[22px]" strokeWidth={active ? 2.2 : 1.8} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function AccountMenu({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const signOut = useSessionStore((state) => state.signOut);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar name={name} size="sm" />
          <span className="sr-only">{name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <span className="block truncate text-sm font-medium text-fg">{name}</span>
          <span className="block truncate text-xs font-normal text-fg-muted">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push(routes.home)}>
          <ExternalLink aria-hidden />
          {copy.member.nav.site}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            signOut();
            router.push(routes.home);
          }}
        >
          <LogOut aria-hidden />
          {copy.member.nav.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
