import Link from "next/link";
import { copy } from "@/content/it";
import { site } from "@/content/site";
import { routes } from "@/config/navigation";
import { CookiePreferencesButton } from "./cookie-consent";
import { Logo } from "./logo";

export function SiteFooter() {
  const f = copy.footer;
  const columns = [
    {
      title: f.product,
      links: [
        [routes.features, "Funzionalità"],
        [routes.pricing, "Prezzi"],
        [routes.blog, "Blog"],
      ],
    },
    {
      title: f.company,
      links: [
        [routes.about, "Chi siamo"],
        [routes.contact, "Contatti"],
      ],
    },
    {
      title: f.legal,
      links: [
        [routes.privacy, copy.legal.privacy],
        [routes.cookies, copy.legal.cookies],
        [routes.terms, copy.legal.terms],
      ],
    },
  ] as const;
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo name={site.name} />
          <p className="mt-3 max-w-xs text-sm text-fg-muted">{site.tagline}</p>
          <a
            href={`mailto:${site.email}`}
            className="mt-3 inline-flex min-h-6 items-center text-sm font-medium text-accent-text hover:underline"
          >
            {site.email}
          </a>
        </div>
        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="text-sm font-semibold text-fg">{column.title}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {column.links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-fg-muted hover:text-fg">
                    {label}
                  </Link>
                </li>
              ))}
              {column.title === f.legal ? (
                <li>
                  <CookiePreferencesButton />
                </li>
              ) : null}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-fg-muted sm:px-6">
          © {site.name} · {f.rights(site.company, site.vatNumber, site.rea)} · {site.address}
        </p>
      </div>
    </footer>
  );
}
