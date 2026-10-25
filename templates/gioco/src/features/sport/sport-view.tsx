"use client";

import { CalendarX2, Receipt } from "lucide-react";
import { useMemo, useState } from "react";
import { copy } from "@/content/it";
import { useData } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { toISODate } from "@/lib/domain/dates";
import { formatOdds } from "@/lib/domain/betting";
import type { Sport, SportEvent } from "@/lib/domain/types";
import { capitalize, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useSlipStore } from "@/store/slip-store";
import { useUiStore } from "@/store/ui-store";
import { Container, SectionHeading } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { BetSlip } from "./bet-slip";

const t = copy.sport;
const SPORTS = Object.keys(copy.sports) as Sport[];

/** Prossimi eventi a quota fissa, raggruppati per giorno, con la schedina. */
export function SportView() {
  const now = useNow();
  const events = useData((state) => state.events);
  const ready = useData((state) => state.ready);
  const [sport, setSport] = useState<Sport | "all">("all");
  const picks = useSlipStore((state) => state.picks);
  const slipOpen = useUiStore((state) => state.slipOpen);
  const setSlipOpen = useUiStore((state) => state.setSlipOpen);

  const days = useMemo(() => {
    if (!now) return [];
    const upcoming = events
      .filter((e) => e.status === "scheduled" && new Date(e.startsAt) > now)
      .filter((e) => sport === "all" || e.sport === sport)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    const groups = new Map<string, SportEvent[]>();
    for (const event of upcoming) {
      const day = toISODate(new Date(event.startsAt));
      groups.set(day, [...(groups.get(day) ?? []), event]);
    }
    return [...groups.entries()];
  }, [events, sport, now]);

  const dayLabel = (day: string) => {
    if (!now) return day;
    const today = toISODate(now);
    const tomorrow = toISODate(new Date(now.getTime() + 86_400_000));
    if (day === today) return t.today;
    if (day === tomorrow) return t.tomorrow;
    return capitalize(formatDate(`${day}T12:00:00`, "weekdayLong"));
  };

  return (
    <Container className="animate-page-in py-10 sm:py-12">
      <SectionHeading as="h1" title={t.title} description={t.description} />
      <div className="mt-8 grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <SegmentedControl
            ariaLabel={t.filter}
            value={sport}
            onChange={setSport}
            options={[
              { value: "all", label: copy.common.all },
              ...SPORTS.map((s) => ({ value: s, label: copy.sports[s] })),
            ]}
          />
          {!ready || !now ? (
            <div className="mt-6 grid gap-3" aria-busy="true">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : days.length === 0 ? (
            <EmptyState className="mt-8" icon={CalendarX2} title={t.empty} />
          ) : (
            <div className="mt-6 grid gap-8">
              {days.map(([day, list]) => (
                <section key={day} aria-labelledby={`giorno-${day}`}>
                  <h2 id={`giorno-${day}`} className="font-display text-lg font-bold text-fg">
                    {dayLabel(day)}
                  </h2>
                  <ul className="mt-3 grid gap-3">
                    {list.map((event) => (
                      <li key={event.id}>
                        <EventCard event={event} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
        <aside className="sticky top-24 hidden lg:block">
          <BetSlip />
        </aside>
      </div>

      {picks.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
          <Button
            size="lg"
            className="w-full"
            onClick={() => setSlipOpen(true)}
            aria-haspopup="dialog"
          >
            <Receipt aria-hidden />
            {copy.slip.open(picks.length)}
          </Button>
        </div>
      ) : null}
      <Dialog open={slipOpen} onOpenChange={setSlipOpen}>
        {slipOpen ? (
          <DialogContent title={copy.slip.title} hideHeader>
            <DialogBody className="px-0 pt-0 pb-0 sm:px-0">
              <BetSlip className="rounded-none border-0" />
            </DialogBody>
          </DialogContent>
        ) : null}
      </Dialog>
    </Container>
  );
}

function EventCard({ event }: { event: SportEvent }) {
  const picks = useSlipStore((state) => state.picks);
  const toggle = useSlipStore((state) => state.toggle);
  const name = `${event.home} – ${event.away}`;
  return (
    <article className="rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="text-[13px] text-fg-muted tabular-nums">
          {formatDate(event.startsAt, "time")} · {copy.sports[event.sport]} · {event.competition}
        </p>
      </div>
      <h3 className="mt-1 text-[15px] font-semibold text-fg">{name}</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {event.markets.map((market) => (
          <div key={market.id} role="group" aria-label={copy.markets[market.kind]}>
            <p className="mb-1.5 text-[12px] font-medium text-fg-muted">
              {t.marketsShort[market.kind]}
            </p>
            <div className="flex gap-1.5">
              {market.selections.map((selection) => {
                const active = picks.some((p) => p.selectionId === selection.id);
                const odds = formatOdds(selection.odds);
                return (
                  <button
                    key={selection.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      toggle({ eventId: event.id, marketId: market.id, selectionId: selection.id })
                    }
                    className={cn(
                      "flex min-h-11 flex-1 flex-col items-center justify-center rounded-lg border px-2 py-1 transition-colors",
                      active
                        ? "border-accent bg-accent text-accent-fg"
                        : "border-line-strong/50 bg-surface-2 text-fg hover:border-accent",
                    )}
                  >
                    <span className="sr-only">
                      {name}, {copy.markets[market.kind]}:{" "}
                    </span>
                    <span
                      className={cn("text-[11px]", active ? "text-accent-fg" : "text-fg-muted")}
                    >
                      {selection.label}
                    </span>
                    <span className="sr-only"> {t.oddsWord} </span>
                    <span className="font-display text-sm font-bold tabular-nums">{odds}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
