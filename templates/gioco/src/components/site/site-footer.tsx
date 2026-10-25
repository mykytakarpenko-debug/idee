import Link from "next/link";
import { copy, HELPLINE } from "@/content/it";
import { env } from "@/config/env";
import { routes } from "@/config/navigation";
import { DEMO_SETTINGS } from "@/lib/demo/seed";
import { Logo } from "./logo";

export function SiteFooter() {
  const f = copy.site.footer;
  const s = DEMO_SETTINGS;
  const links = [
    [routes.rules, f.rules],
    [routes.responsible, f.responsible],
    [routes.terms, f.terms],
    [routes.privacy, f.privacy],
  ] as const;
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <Logo name={s.name} />
          <p className="mt-4 text-sm text-fg-muted">{f.licenseNote}</p>
          {/* Segnaposto: in produzione logo ADM e contrassegno della concessione reali. */}
          <p className="mt-4 inline-flex items-center gap-2 rounded-md border border-line-strong px-2.5 py-1.5 text-xs font-medium text-fg">
            {s.license}
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-fg">{f.legal}</h2>
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
        <div>
          <h2 className="text-sm font-semibold text-fg">{f.help}</h2>
          <p className="mt-3 text-sm text-fg-muted">{f.helpText}</p>
          <p className="mt-3 text-sm text-fg">
            {HELPLINE.name} ({HELPLINE.owner}):{" "}
            <a
              href={`tel:${HELPLINE.number}`}
              className="font-semibold whitespace-nowrap text-accent-text hover:underline"
            >
              {HELPLINE.display}
            </a>
            , {HELPLINE.hours}.
          </p>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-5 text-xs text-fg-muted sm:px-6">
          <span className="rounded border border-fg px-1 font-bold text-fg">{copy.site.adult}</span>
          <span>{copy.site.warning}</span>
          <span className="w-full sm:ml-auto sm:w-auto">© {f.company(s.company, s.vatNumber)}</span>
        </div>
      </div>
    </footer>
  );
}
