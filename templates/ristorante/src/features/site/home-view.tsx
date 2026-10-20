"use client";

import { ArrowRight, Bike, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useSiteData } from "@/hooks/use-site-data";
import { formatCurrency } from "@/lib/format";
import { buttonClasses } from "@/components/ui/button";
import { Container, SectionHeading } from "@/components/site/section";
import { formatHours } from "@/components/site/hours-format";
import { AllergenList, DietBadges } from "./dish-badges";
import { OpenStatus } from "./open-status";

const h = copy.home;

export function HomeView() {
  const { settings, dishes } = useSiteData();
  const featured = dishes.filter((d) => d.featured).slice(0, 4);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${settings.name} ${settings.address} ${settings.city}`,
  )}`;

  return (
    <div className="animate-page-in">
      {/* Hero */}
      <section className="border-b border-line">
        <Container className="grid gap-12 py-16 sm:py-24 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div>
            <OpenStatus />
            <p className="mt-8 text-sm font-medium tracking-wide text-accent-text uppercase">
              {h.eyebrow} · {settings.city}
            </p>
            <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight text-fg sm:text-7xl">
              {settings.name}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-fg-muted sm:text-xl">{settings.tagline}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={routes.book} className={buttonClasses({ size: "lg" })}>
                {copy.site.cta.book}
              </Link>
              <Link
                href={routes.order}
                className={buttonClasses({ size: "lg", variant: "secondary" })}
              >
                <Bike aria-hidden />
                {copy.site.cta.order}
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
            <p className="text-sm font-semibold text-fg">{h.hours}</p>
            <dl className="mt-4 space-y-2 text-sm">
              {settings.hours.map((day) => (
                <div
                  key={day.day}
                  className="flex justify-between gap-4 border-b border-line/60 pb-2 last:border-0"
                >
                  <dt className="text-fg-muted">{copy.settings.hours.days[day.day - 1]}</dt>
                  <dd className="text-right text-fg tabular-nums">
                    {formatHours(day) ?? copy.site.footer.closed}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </section>

      {/* Valori */}
      <section aria-label={h.eyebrow}>
        <Container className="grid gap-8 py-16 sm:grid-cols-3">
          {h.values.map((value, i) => (
            <div key={value.title}>
              <p className="font-display text-3xl text-accent-text" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </p>
              <h2 className="mt-3 text-lg font-semibold text-fg">{value.title}</h2>
              <p className="mt-2 text-fg-muted">{value.text}</p>
            </div>
          ))}
        </Container>
      </section>

      {/* Piatti consigliati */}
      <section className="border-t border-line bg-surface-2/50">
        <Container className="py-16 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading title={h.featured} description={h.featuredHint} />
            <Link
              href={routes.menu}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-text hover:underline"
            >
              {copy.site.cta.menu}
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((dish) => (
              <li
                key={dish.id}
                className="flex flex-col rounded-2xl border border-line bg-surface p-6 shadow-xs"
              >
                <h3 className="font-display text-xl font-semibold text-fg">{dish.name}</h3>
                <p className="mt-2 flex-1 text-sm text-fg-muted">{dish.description}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <DietBadges dish={dish} />
                </div>
                <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-4">
                  <AllergenList dish={dish} />
                  <p className="shrink-0 text-lg font-semibold text-fg tabular-nums">
                    {formatCurrency(dish.price)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Consegna */}
      <section className="bg-accent-soft">
        <Container className="flex flex-col items-start justify-between gap-6 py-12 md:flex-row md:items-center">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl font-semibold text-accent-soft-fg">
              {h.deliveryTitle}
            </h2>
            <p className="mt-2 text-accent-soft-fg">
              {h.deliveryText(
                formatCurrency(settings.delivery.minOrder, { round: true }),
                formatCurrency(settings.delivery.freeAbove, { round: true }),
              )}
            </p>
          </div>
          <Link href={routes.order} className={buttonClasses({ size: "lg" })}>
            {copy.site.cta.order}
          </Link>
        </Container>
      </section>

      {/* Visita */}
      <section id="contatti">
        <Container className="grid gap-10 py-16 sm:py-20 md:grid-cols-2">
          <SectionHeading title={h.visit} description={settings.description} />
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-fg">
                <MapPin aria-hidden className="size-4 text-accent-text" />
                {h.address}
              </p>
              <p className="mt-2 text-fg-muted">
                {settings.address}
                <br />
                {settings.postalCode} {settings.city}
              </p>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex text-sm font-medium text-accent-text hover:underline"
              >
                {h.directions} ↗
              </a>
            </div>
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-fg">
                <Phone aria-hidden className="size-4 text-accent-text" />
                {h.phone}
              </p>
              <a
                href={`tel:${settings.phone.replace(/\s/g, "")}`}
                className="mt-2 block text-fg-muted hover:text-fg"
              >
                {settings.phone}
              </a>
              <a
                href={`mailto:${settings.email}`}
                className="mt-1 block text-fg-muted hover:text-fg"
              >
                {settings.email}
              </a>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
