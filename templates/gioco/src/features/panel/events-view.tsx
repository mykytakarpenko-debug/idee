"use client";

import { CalendarX2 } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { copy } from "@/content/it";
import { useData } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import type { SportEvent } from "@/lib/domain/types";
import { formatDate } from "@/lib/format";
import { useDataStore } from "@/store/data-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Page, PageHeader, Toolbar } from "@/components/ui/page";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { toast } from "@/components/ui/toast";

const t = copy.panel.events;

/** Refertazione: inserendo il risultato si liquidano le scommesse aperte. */
export function EventsView() {
  const now = useNow();
  const { events, bets } = useData((state) => ({ events: state.events, bets: state.bets }));
  const [filter, setFilter] = useState<"open" | "upcoming" | "finished">("open");

  const rows = useMemo(() => {
    if (!now) return [];
    return events
      .filter((e) => {
        const started = new Date(e.startsAt) <= now;
        if (filter === "finished") return e.status !== "scheduled";
        return e.status === "scheduled" && (filter === "open" ? started : !started);
      })
      .sort((a, b) =>
        filter === "finished"
          ? b.startsAt.localeCompare(a.startsAt)
          : a.startsAt.localeCompare(b.startsAt),
      )
      .slice(0, 40);
  }, [events, filter, now]);

  const openBets = (eventId: string) =>
    bets.filter((b) => b.status === "open" && b.lines.some((l) => l.eventId === eventId)).length;

  return (
    <Page>
      <PageHeader title={t.title} description={t.description} />
      <Toolbar>
        <SegmentedControl
          ariaLabel={t.title}
          value={filter}
          onChange={setFilter}
          options={[
            { value: "open", label: t.filters.open },
            { value: "upcoming", label: t.filters.upcoming },
            { value: "finished", label: t.filters.finished },
          ]}
        />
      </Toolbar>
      <Card>
        {rows.length === 0 ? (
          <EmptyState icon={CalendarX2} title={t.empty} />
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((event) => (
              <li key={event.id}>
                <EventRow event={event} openBets={openBets(event.id)} now={now!} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Page>
  );
}

function EventRow({ event, openBets, now }: { event: SportEvent; openBets: number; now: Date }) {
  const id = useId();
  const settle = useDataStore((state) => state.settleEvent);
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const started = new Date(event.startsAt) <= now;
  const valid =
    /^\d{1,3}$/.test(home) && /^\d{1,3}$/.test(away) && (event.sport === "calcio" || home !== away);
  const name = `${event.home} – ${event.away}`;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4 sm:px-6">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-fg-muted">
          {formatDate(event.startsAt, "dateTime")} · {copy.sports[event.sport]}
        </p>
        <p className="text-sm font-semibold text-fg">{name}</p>
        {openBets > 0 ? (
          <p className="mt-0.5 text-[13px] text-fg-muted">{t.openBets(openBets)}</p>
        ) : null}
      </div>
      {event.status === "scheduled" && !started ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[13px] text-fg-muted">{t.notStarted}</span>
          <Button
            type="button"
            size="sm"
            variant="danger-ghost"
            onClick={() => setCancelling(true)}
          >
            {t.cancel}
          </Button>
        </div>
      ) : event.status === "scheduled" ? (
        <form
          className="flex flex-wrap items-center gap-2"
          aria-label={`${t.result}: ${name}`}
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            const settled = settle(event.id, { home: Number(home), away: Number(away) });
            toast.success(t.settled(settled));
          }}
        >
          <label htmlFor={`${id}-h`} className="sr-only">
            {t.home}: {event.home}
          </label>
          <Input
            id={`${id}-h`}
            value={home}
            onChange={(e) => setHome(e.target.value)}
            inputMode="numeric"
            className="w-16 text-center"
          />
          <span aria-hidden className="text-fg-muted">
            –
          </span>
          <label htmlFor={`${id}-a`} className="sr-only">
            {t.away}: {event.away}
          </label>
          <Input
            id={`${id}-a`}
            value={away}
            onChange={(e) => setAway(e.target.value)}
            inputMode="numeric"
            className="w-16 text-center"
          />
          <Button type="submit" size="sm" disabled={!valid}>
            {t.settle}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="danger-ghost"
            onClick={() => setCancelling(true)}
          >
            {t.cancel}
          </Button>
        </form>
      ) : event.status === "cancelled" ? (
        <Badge tone="warning">{copy.betStatus.void}</Badge>
      ) : (
        <p className="font-display text-lg font-bold text-fg tabular-nums">
          {event.score?.home} – {event.score?.away}
        </p>
      )}
      <ConfirmDialog
        open={cancelling}
        onOpenChange={setCancelling}
        title={t.cancelTitle}
        description={t.cancelText}
        confirmLabel={t.cancel}
        onConfirm={() => {
          settle(event.id, null);
          toast.success(t.cancelled);
          setCancelling(false);
        }}
      />
    </div>
  );
}
