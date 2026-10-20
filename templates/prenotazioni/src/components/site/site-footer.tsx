"use client";

import Link from "next/link";
import { copy } from "@/content/it";
import { env } from "@/config/env";
import { routes } from "@/config/navigation";
import { useSiteData } from "@/hooks/use-site-data";
import { Logo } from "./logo";

export function SiteFooter() {
  const { settings } = useSiteData();
  const f = copy.site.footer;
  const links = [
    [routes.book, copy.site.cta],
    [routes.manage, copy.site.nav.manage],
    [routes.widget, f.widget],
    [routes.privacy, f.privacy],
  ] as const;
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Logo name={settings.name} />
          <p className="mt-3 max-w-md text-sm text-fg-muted">{settings.tagline}</p>
          <address className="mt-4 text-sm leading-relaxed text-fg not-italic">
            {settings.address}, {settings.postalCode} {settings.city}
            <br />
            <a
              href={`tel:${settings.phone.replace(/\s/g, "")}`}
              className="text-accent-text hover:underline"
            >
              {settings.phone}
            </a>
            {" · "}
            <a href={`mailto:${settings.email}`} className="text-accent-text hover:underline">
              {settings.email}
            </a>
          </address>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-fg">{f.info}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {links.map(([href, label]) => (
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
          © {settings.name} · {f.vat} {settings.vatNumber} · {f.rights}
        </p>
      </div>
    </footer>
  );
}
