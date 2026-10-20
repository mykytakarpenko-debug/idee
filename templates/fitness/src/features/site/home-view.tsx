"use client";

import { ArrowRight, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useData } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { useSiteData } from "@/hooks/use-site-data";
import { sessionStats } from "@/lib/domain/booking";
import { isoWeekday, timeToMinutes, toISODate } from "@/lib/domain/dates";
import { sessionIdFor } from "@/lib/domain/schedule";
import { COURSE_CATEGORIES } from "@/lib/domain/types";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CategoryLabel, categoryColor, IntensityMeter } from "@/components/course-badges";
import { Container, SectionHeading } from "@/components/site/section";
import { Avatar } from "@/components/ui/avatar";
import { buttonClasses } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OpenStatus } from "./open-status";

const h = copy.home;

export function HomeView() {
  const { settings, courses, instructors, plans, slots } = useSiteData();
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${settings.name} ${settings.address} ${settings.city}`,
  )}`;
  const monthly = plans.filter((p) => p.active && p.billing === "monthly");

  return (
    <div className="animate-page-in">
      <section className="border-b border-line">
        <Container className="grid gap-12 py-16 sm:py-24 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <OpenStatus />
            <p className="mt-8 text-sm font-semibold tracking-wide text-accent-text uppercase">
              {h.eyebrow}
            </p>
            <h1 className="mt-3 font-display text-5xl leading-[1.02] font-extrabold tracking-tight text-balance text-fg [font-stretch:110%] sm:text-7xl">
              {h.title}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-fg-muted">{settings.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={routes.trial} className={buttonClasses({ size: "lg" })}>
                {copy.site.cta.trial}
              </Link>
              <Link
                href={routes.schedule}
                className={buttonClasses({ size: "lg", variant: "secondary" })}
              >
                {copy.site.cta.schedule}
              </Link>
            </div>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6">
              {(
                [
                  [String(slots.length), h.stats.classes],
                  [String(instructors.length), h.stats.instructors],
                  [String(Math.max(...slots.map((slot) => slot.capacity), 0)), h.stats.capacity],
                ] as const
              ).map(([value, label]) => (
                <div key={label} className="flex flex-col">
                  <dt className="text-[13px] text-fg-muted">{label}</dt>
                  <dd className="order-first font-display text-3xl font-bold text-fg">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <TodayCard />
        </Container>
      </section>

      <section aria-labelledby="home-categories">
        <Container className="py-16 sm:py-20">
          <SectionHeading
            id="home-categories"
            title={h.categoriesTitle}
            description={h.categoriesHint}
          />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {COURSE_CATEGORIES.map((category) => {
              const list = courses.filter((c) => c.category === category);
              return (
                <li
                  key={category}
                  className="flex flex-col rounded-2xl border border-line bg-surface p-6 shadow-xs"
                  style={{ borderTopColor: categoryColor(category), borderTopWidth: 3 }}
                >
                  <CategoryLabel category={category} />
                  <p className="mt-3 font-display text-xl font-bold text-fg">
                    {copy.categories[category]}
                  </p>
                  <p className="text-sm text-fg-muted">{h.coursesCount(list.length)}</p>
                  <ul className="mt-4 flex-1 space-y-1 text-sm text-fg">
                    {list.map((course) => (
                      <li key={course.id}>{course.name}</li>
                    ))}
                  </ul>
                  <Link
                    href={routes.courses}
                    className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-accent-text hover:underline"
                  >
                    {copy.site.nav.courses}
                    <span className="sr-only"> · {copy.categories[category]}</span>
                    <ArrowRight aria-hidden className="size-4" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="home-plans" className="border-y border-line bg-surface">
        <Container className="py-16 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading id="home-plans" title={h.plansTitle} description={h.plansHint} />
            <Link href={routes.pricing} className={buttonClasses({ variant: "secondary" })}>
              {copy.site.cta.pricing}
            </Link>
          </div>
          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {monthly.map((plan) => (
              <li
                key={plan.id}
                className={cn(
                  "rounded-2xl border p-6",
                  plan.featured ? "border-accent bg-accent-soft" : "border-line bg-canvas",
                )}
              >
                <p className="font-display text-lg font-bold text-fg">{plan.name}</p>
                <p className="mt-1 text-sm text-fg-muted">{plan.description}</p>
                <p className="mt-5 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold text-fg tabular-nums">
                    {formatCurrency(plan.price, { round: true })}
                  </span>
                  <span className="text-sm text-fg-muted">{copy.pricing.perMonth}</span>
                </p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="home-team">
        <Container className="py-16 sm:py-20">
          <SectionHeading id="home-team" title={h.teamTitle} description={h.teamHint} />
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {instructors.map((person) => (
              <li key={person.id} className="flex gap-4">
                <Avatar name={person.name} size="lg" />
                <div>
                  <p className="font-semibold text-fg">{person.name}</p>
                  <p className="text-sm text-accent-text">{person.role}</p>
                  <p className="mt-1 text-sm text-fg-muted">{person.bio}</p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="home-visit" className="border-t border-line bg-surface">
        <Container className="grid gap-10 py-16 sm:py-20 lg:grid-cols-2">
          <div className="rounded-2xl bg-fg p-8 text-canvas">
            <h2 className="font-display text-3xl font-bold">{h.trialTitle}</h2>
            <p className="mt-3 opacity-90">{h.trialText}</p>
            <Link
              href={routes.trial}
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-canvas px-5 text-[15px] font-semibold text-fg transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {copy.site.cta.trial}
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
          <div>
            <h2 id="home-visit" className="font-display text-3xl font-bold text-fg">
              {h.visitTitle}
            </h2>
            <ul className="mt-6 space-y-4 text-fg">
              <li className="flex gap-3">
                <MapPin aria-hidden className="mt-0.5 size-5 shrink-0 text-accent-text" />
                <span>
                  {settings.address}, {settings.postalCode} {settings.city}
                  <br />
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-accent-text hover:underline"
                  >
                    {h.directions}
                  </a>
                </span>
              </li>
              <li className="flex gap-3">
                <Phone aria-hidden className="mt-0.5 size-5 shrink-0 text-accent-text" />
                <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="hover:underline">
                  {settings.phone}
                </a>
              </li>
            </ul>
          </div>
        </Container>
      </section>
    </div>
  );
}

/** Le prossime lezioni di oggi, con posti liberi quando i dati sono caricati. */
function TodayCard() {
  const now = useNow();
  const { slots, courses, instructors, ready } = useSiteData();
  const { sessions, bookings, trials } = useData((state) => ({
    sessions: state.sessions,
    bookings: state.bookings,
    trials: state.trials,
  }));

  const upcoming = useMemo(() => {
    if (!now) return [];
    const minutes = now.getHours() * 60 + now.getMinutes();
    const date = toISODate(now);
    return slots
      .filter((s) => s.weekday === isoWeekday(now) && timeToMinutes(s.time) > minutes)
      .sort((a, b) => a.time.localeCompare(b.time))
      .slice(0, 4)
      .map((slot) => {
        const session = sessions.find((s) => s.id === sessionIdFor(slot.id, date));
        return {
          slot,
          course: courses.find((c) => c.id === slot.courseId),
          instructor: instructors.find((i) => i.id === slot.instructorId),
          free: session && ready ? sessionStats(session, bookings, trials).free : null,
        };
      });
  }, [now, slots, sessions, bookings, trials, courses, instructors, ready]);

  return (
    <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
      <p className="font-display text-lg font-bold text-fg">{h.todayTitle}</p>
      <p className="text-sm text-fg-muted">{h.todayHint}</p>
      {!now ? (
        <div className="mt-5 space-y-3" aria-hidden>
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : upcoming.length === 0 ? (
        <p className="mt-5 text-sm text-fg-muted">{h.todayEmpty}</p>
      ) : (
        <ul className="mt-5 divide-y divide-line">
          {upcoming.map(({ slot, course, instructor, free }) =>
            course ? (
              <li key={slot.id} className="flex items-center gap-4 py-3">
                <span className="w-12 font-display text-lg font-bold text-fg tabular-nums">
                  {slot.time}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-fg">{course.name}</span>
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <IntensityMeter value={course.intensity} />
                    {instructor ? (
                      <span className="text-xs text-fg-muted">{instructor.name}</span>
                    ) : null}
                  </span>
                </span>
                {free !== null ? (
                  <span
                    className={cn(
                      "text-xs font-medium whitespace-nowrap",
                      free === 0 ? "text-warning" : "text-fg-muted",
                    )}
                  >
                    {h.seatsLeft(free)}
                  </span>
                ) : null}
              </li>
            ) : null,
          )}
        </ul>
      )}
      <Link
        href={routes.schedule}
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent-text hover:underline"
      >
        {copy.site.cta.schedule}
        <ArrowRight aria-hidden className="size-4" />
      </Link>
    </div>
  );
}
