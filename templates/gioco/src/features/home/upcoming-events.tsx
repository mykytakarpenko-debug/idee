"use client";

import { useMemo } from "react";
import { copy } from "@/content/it";
import { useData } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { formatOdds } from "@/lib/domain/betting";
import { formatDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

/** Prossimi eventi con le quote 1X2 / 1-2 (solo consultazione: si gioca dalla pagina Scommesse). */
export function UpcomingEvents() {
  const now = useNow();
  const events = useData((state) => state.events);
  const ready = useData((state) => state.ready);
  const next = useMemo(
    () =>
      now
        ? events
            .filter((e) => e.status === "scheduled" && new Date(e.startsAt) > now)
            .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
            .slice(0, 5)
        : [],
    [events, now],
  );
  if (!ready || !now) return <Skeleton className="mt-6 h-64" aria-busy="true" />;
  return (
    <ul className="mt-6 divide-y divide-line rounded-xl border border-line bg-surface">
      {next.map((event) => {
        const market = event.markets[0]!;
        return (
          <li
            key={event.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-fg-muted tabular-nums">
                {formatDate(event.startsAt, "weekdayShort")} {formatDate(event.startsAt, "time")} ·{" "}
                {copy.sports[event.sport]}
              </p>
              <p className="text-[15px] font-semibold text-fg">
                {event.home} – {event.away}
              </p>
            </div>
            <dl className="flex gap-2">
              {market.selections.map((s) => (
                <div key={s.id} className="min-w-14 rounded-lg bg-surface-2 px-2 py-1 text-center">
                  <dt className="text-[11px] text-fg-muted">{s.label}</dt>
                  <dd className="font-display text-sm font-bold text-fg tabular-nums">
                    {formatOdds(s.odds)}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        );
      })}
    </ul>
  );
}
