"use client";

import Link from "next/link";
import { copy } from "@/content/it";
import { env } from "@/config/env";
import { routes } from "@/config/navigation";
import { useCatalog } from "@/hooks/use-catalog";
import { Logo } from "./logo";

export function SiteFooter() {
  const { settings, categories } = useCatalog();
  const f = copy.site.footer;
  const help = [
    [routes.shipping, f.shipping],
    [routes.conditions, f.conditions],
    [routes.withdrawal, f.withdrawal],
    [routes.privacy, f.privacy],
  ] as const;
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo name={settings.name} />
          <p className="mt-3 max-w-sm text-sm text-fg-muted">{settings.tagline}</p>
          <p className="mt-4 text-sm text-fg-muted">{f.payments}</p>
          <address className="mt-4 text-sm leading-relaxed text-fg not-italic">
            {settings.legal.address}
            <br />
            <a
              href={`mailto:${settings.legal.email}`}
              className="inline-flex min-h-6 items-center text-accent-text hover:underline"
            >
              {settings.legal.email}
            </a>
          </address>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-fg">{f.shop}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {categories.map((category) => (
              <li key={category.id}>
                <Link href={routes.category(category.id)} className="text-fg-muted hover:text-fg">
                  {category.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href={routes.sellers} className="text-fg-muted hover:text-fg">
                {copy.site.nav.sellers}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-fg">{f.help}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {help.map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-fg-muted hover:text-fg">
                  {label}
                </Link>
              </li>
            ))}
            {env.demoMode ? (
              <li>
                <Link href={routes.panel} className="font-medium text-accent-text hover:underline">
                  {f.panel}
                </Link>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-fg-muted sm:px-6">
          © {settings.name} ·{" "}
          {f.company(settings.legal.company, settings.legal.vatNumber, settings.legal.rea)}
        </p>
      </div>
    </footer>
  );
}
