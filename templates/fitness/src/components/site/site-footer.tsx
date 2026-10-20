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
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <Logo name={settings.name} />
          <p className="mt-3 text-sm text-fg-muted">{settings.tagline}</p>
          <address className="mt-4 text-sm leading-relaxed text-fg not-italic">
            {settings.address}
            <br />
            {settings.postalCode} {settings.city}
            <br />
            <a
              href={`tel:${settings.phone.replace(/\s/g, "")}`}
              className="text-accent-text hover:underline"
            >
              {settings.phone}
            </a>
            <br />
            <a href={`mailto:${settings.email}`} className="text-accent-text hover:underline">
              {settings.email}
            </a>
          </address>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-fg">{f.hours}</h2>
          <dl className="mt-3 space-y-1.5 text-sm">
            {settings.hours.map((day) => (
              <div key={day.day} className="flex justify-between gap-4">
                <dt className="text-fg-muted">{copy.weekdays[day.day - 1]}</dt>
                <dd className="text-right text-fg tabular-nums">
                  {day.open ? `${day.from}–${day.to}` : f.closed}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-fg">{f.info}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {[
              [routes.courses, copy.site.nav.courses],
              [routes.schedule, copy.site.nav.schedule],
              [routes.pricing, copy.site.nav.pricing],
              [routes.trial, copy.site.nav.trial],
              [routes.login, copy.site.login],
              [routes.privacy, f.privacy],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href!} className="text-fg-muted hover:text-fg">
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
