"use client";

import { ArrowRight, Clock, Hourglass, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useSiteData } from "@/hooks/use-site-data";
import { cn } from "@/lib/utils";
import { Container, SectionHeading } from "@/components/site/section";
import { Avatar } from "@/components/ui/avatar";
import { buttonClasses } from "@/components/ui/button";
import { modeIcon, priceLabel } from "./booking-wizard";

const h = copy.home;

export function HomeView() {
  const { settings, services, categories, staff, hours } = useSiteData();
  const active = services.filter((s) => s.active);

  return (
    <div className="animate-page-in">
      <section className="border-b border-line">
        <Container className="grid gap-10 py-16 sm:py-24 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold tracking-wide text-accent-text uppercase">
              {h.eyebrow}
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance text-fg sm:text-6xl">
              {settings.name}
            </h1>
            <p className="mt-4 max-w-xl text-lg text-fg-muted">{settings.tagline}</p>
            <p className="mt-3 max-w-xl text-fg-muted">{settings.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={routes.book} className={buttonClasses({ size: "lg" })}>
                {copy.site.cta}
              </Link>
              <Link
                href={routes.manage}
                className={buttonClasses({ size: "lg", variant: "secondary" })}
              >
                {copy.site.nav.manage}
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
            <p className="text-sm font-semibold text-fg">{h.hoursTitle}</p>
            <ul className="mt-4 space-y-4">
              {staff.map((person) => (
                <li key={person.id} className="flex gap-3">
                  <Avatar name={person.name} />
                  <div className="min-w-0 text-sm">
                    <p className="font-medium text-fg">{person.name}</p>
                    <p className="text-fg-muted">
                      {hours
                        .filter((entry) => entry.staffId === person.id && entry.ranges.length > 0)
                        .sort((a, b) => a.day - b.day)
                        .map((entry) => copy.weekdays[entry.day - 1]?.slice(0, 3))
                        .join(", ")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-5 flex items-start gap-2 border-t border-line pt-4 text-sm text-fg">
              <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-text" />
              {settings.address}, {settings.postalCode} {settings.city}
            </p>
          </div>
        </Container>
      </section>

      <section id="servizi" aria-labelledby="servizi-title" className="scroll-mt-20">
        <Container className="py-16 sm:py-20">
          <SectionHeading id="servizi-title" title={h.servicesTitle} description={h.servicesHint} />
          <div className="mt-10 flex flex-col gap-10">
            {categories.map((category) => {
              const list = active.filter((s) => s.categoryId === category.id);
              if (list.length === 0) return null;
              return (
                <div key={category.id}>
                  <h3 className="text-sm font-semibold text-fg-muted">{category.name}</h3>
                  <ul className="mt-3 grid gap-3 md:grid-cols-2">
                    {list.map((service) => (
                      <li
                        key={service.id}
                        className="flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <p className="font-semibold text-fg">{service.name}</p>
                          <p className="font-semibold whitespace-nowrap text-fg tabular-nums">
                            {priceLabel(service)}
                          </p>
                        </div>
                        <p className="mt-1 flex-1 text-sm text-fg-muted">{service.description}</p>
                        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-fg-muted">
                          <span className="inline-flex items-center gap-1">
                            <Clock aria-hidden className="size-3.5" />
                            {copy.common.minutes(service.durationMin)}
                          </span>
                          {service.modes.map((m) => {
                            const Icon = modeIcon[m];
                            return (
                              <span key={m} className="inline-flex items-center gap-1">
                                <Icon aria-hidden className="size-3.5" />
                                {copy.modes[m]}
                              </span>
                            );
                          })}
                          {service.requiresApproval ? (
                            <span className="inline-flex items-center gap-1 text-warning">
                              <Hourglass aria-hidden className="size-3.5" />
                              {copy.booking.service.approval}
                            </span>
                          ) : null}
                        </p>
                        <Link
                          href={routes.book}
                          className="mt-4 inline-flex items-center gap-1 self-start text-sm font-medium text-accent-text hover:underline"
                        >
                          {h.book}
                          <span className="sr-only"> · {service.name}</span>
                          <ArrowRight aria-hidden className="size-4" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      <section
        id="studio"
        aria-labelledby="studio-title"
        className="scroll-mt-20 border-y border-line bg-surface"
      >
        <Container className="py-16 sm:py-20">
          <SectionHeading id="studio-title" title={h.teamTitle} />
          <ul className="mt-10 grid gap-8 md:grid-cols-3">
            {staff.map((person) => (
              <li key={person.id}>
                <Avatar name={person.name} size="lg" />
                <p className="mt-4 font-semibold text-fg">{person.name}</p>
                <p className="text-sm text-accent-text">{person.role}</p>
                <p className="mt-2 text-sm text-fg-muted">{person.bio}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section id="domande" aria-labelledby="domande-title" className="scroll-mt-20">
        <Container className="grid gap-10 py-16 sm:py-20 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <SectionHeading id="domande-title" title={h.faqTitle} />
            <div className="mt-8 divide-y divide-line rounded-xl border border-line bg-surface">
              {h.faq.map((item) => (
                <details key={item.q} className="group px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-fg">
                    {item.q}
                    <span
                      aria-hidden
                      className="text-xl leading-none text-fg-muted transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-fg-muted">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
          <div className="self-start rounded-2xl bg-fg p-8 text-canvas">
            <h2 className="text-2xl font-semibold">{h.manageTitle}</h2>
            <p className="mt-2 opacity-90">{h.manageText}</p>
            <Link
              href={routes.manage}
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-canvas px-5 text-[15px] font-semibold text-fg"
            >
              {copy.site.nav.manage}
              <ArrowRight aria-hidden className="size-4" />
            </Link>
            <p className={cn("mt-6 flex items-center gap-2 text-sm opacity-90")}>
              <Phone aria-hidden className="size-4" />
              <a
                href={`tel:${settings.phone.replace(/\s/g, "")}`}
                className="underline underline-offset-2"
              >
                {settings.phone}
              </a>
            </p>
          </div>
        </Container>
      </section>
    </div>
  );
}
