"use client";

import { addDays, startOfDay } from "date-fns";
import { CalendarPlus, LogOut, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { copy } from "@/content/it";
import { useData, useDataReady } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { isActiveReservation } from "@/lib/domain/booking";
import { minutesToTime, servicesOn, timeToMinutes, upcomingServiceTime } from "@/lib/domain/hours";
import type { DiningTable, Reservation, TableZone } from "@/lib/domain/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDataStore } from "@/store/data-store";
import { openDialog } from "@/store/ui-store";
import { ReservationStatusBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Select } from "@/components/ui/input";
import { Page, PageHeader, Toolbar } from "@/components/ui/page";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";

const f = copy.floor;
type TableState = "free" | "reserved" | "seated";

interface TableInfo {
  table: DiningTable;
  state: TableState;
  current: Reservation | null;
  next: Reservation | null;
}

/** Stato di ogni tavolo in un istante: occupato, prenotato o libero (con la prossima prenotazione). */
function tableInfo(tables: DiningTable[], reservations: Reservation[], at: Date): TableInfo[] {
  const atMs = at.getTime();
  const endOfDay = addDays(startOfDay(at), 1).getTime();
  return tables.map((table) => {
    const own = reservations
      .filter((r) => r.tableId === table.id && isActiveReservation(r))
      .sort((a, b) => a.start.localeCompare(b.start));
    const current =
      own.find((r) => {
        const start = new Date(r.start).getTime();
        return start <= atMs && atMs < start + r.durationMin * 60_000;
      }) ?? null;
    const next =
      own.find((r) => {
        const start = new Date(r.start).getTime();
        return start > atMs && start < endOfDay;
      }) ?? null;
    const state: TableState = current
      ? current.status === "seated"
        ? "seated"
        : "reserved"
      : "free";
    return { table, state, current, next };
  });
}

export function FloorView() {
  const ready = useDataReady();
  const now = useNow();
  const { tables, reservations, settings } = useData((state) => ({
    tables: state.tables,
    reservations: state.reservations,
    settings: state.settings,
  }));
  const [zone, setZone] = useState<TableZone>("sala");
  const [picked, setPicked] = useState<string | null>(null);
  // A locale chiuso, la mappa parte dal prossimo servizio invece che da "adesso".
  const time = picked ?? (now ? (upcomingServiceTime(settings.hours, now) ?? "now") : "now");
  const [selected, setSelected] = useState<string | null>(null);

  const times = useMemo(() => {
    if (!now) return [];
    const list: string[] = [];
    for (const { window } of servicesOn(settings.hours, now)) {
      for (let m = timeToMinutes(window.from); m < timeToMinutes(window.to); m += 30)
        list.push(minutesToTime(m));
    }
    return list;
  }, [now, settings.hours]);

  const at = useMemo(() => {
    if (!now) return null;
    if (time === "now") return now;
    const date = startOfDay(now);
    date.setMinutes(timeToMinutes(time));
    return date;
  }, [now, time]);

  const infos = useMemo(
    () => (at ? tableInfo(tables, reservations, at) : []),
    [tables, reservations, at],
  );
  const zoneInfos = infos.filter((info) => info.table.zone === zone);
  const zones = [...new Set(tables.map((t) => t.zone))];
  const selectedInfo = infos.find((info) => info.table.id === selected) ?? null;
  const counts = {
    free: zoneInfos.filter((i) => i.state === "free").length,
    reserved: zoneInfos.filter((i) => i.state === "reserved").length,
    seated: zoneInfos.filter((i) => i.state === "seated").length,
  };

  return (
    <Page>
      <PageHeader title={f.title} description={f.description} />
      <Toolbar>
        <SegmentedControl<TableZone>
          ariaLabel={f.title}
          value={zone}
          onChange={setZone}
          options={zones.map((z) => ({ value: z, label: copy.zones[z] }))}
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-fg-muted">{f.at}</span>
          <div className="w-32">
            <Select aria-label={f.at} value={time} onChange={(e) => setPicked(e.target.value)}>
              <option value="now">{f.now}</option>
              {times.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Toolbar>

      <ul className="-mt-2 flex flex-wrap gap-4 text-[13px] text-fg-muted" aria-label="Legenda">
        <li className="flex items-center gap-2">
          <span aria-hidden className="size-3 rounded-sm border border-dashed border-line-strong" />
          {f.legend.free} ({counts.free})
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden className="size-3 rounded-sm bg-accent" />
          {f.legend.reserved} ({counts.reserved})
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden className="size-3 rounded-sm bg-info" />
          {f.legend.seated} ({counts.seated})
        </li>
      </ul>

      <Card className="p-4 sm:p-6">
        {!ready || !at ? (
          <Skeleton className="h-80" />
        ) : (
          <ul
            className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
            aria-label={copy.zones[zone]}
          >
            {zoneInfos.map(({ table, state, current, next }) => (
              <li key={table.id} className={cn(table.shape === "rect" && "sm:col-span-2")}>
                <button
                  type="button"
                  onClick={() => setSelected(table.id)}
                  className={cn(
                    "flex h-32 w-full flex-col justify-between border p-3 text-left transition-[box-shadow,transform] duration-150 hover:shadow-md active:scale-[0.99]",
                    table.shape === "round" ? "rounded-[2rem]" : "rounded-xl",
                    state === "free" && "border-dashed border-line-strong/60 bg-surface",
                    state === "reserved" && "border-accent/40 bg-accent-soft",
                    state === "seated" && "border-info/40 bg-info-soft",
                  )}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="font-display text-2xl font-semibold text-fg">
                      {table.name}
                    </span>
                    <span className="text-xs text-fg-muted">{f.seats(table.seats)}</span>
                  </span>
                  <span className="text-[13px] leading-snug">
                    <span
                      className={cn(
                        "block font-medium",
                        state === "free" ? "text-fg-muted" : "text-fg",
                      )}
                    >
                      {state === "free"
                        ? f.free
                        : state === "seated"
                          ? f.legend.seated
                          : f.legend.reserved}
                    </span>
                    <span className="block truncate text-fg-muted">
                      {current
                        ? `${current.name} · ${copy.common.people(current.partySize)}`
                        : next
                          ? `${f.nextReservation}: ${formatDate(next.start, "time")}`
                          : " "}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Dialog open={selectedInfo !== null} onOpenChange={(open) => !open && setSelected(null)}>
        {selectedInfo ? (
          <TableDialog info={selectedInfo} onClose={() => setSelected(null)} />
        ) : null}
      </Dialog>
    </Page>
  );
}

function TableDialog({ info, onClose }: { info: TableInfo; onClose: () => void }) {
  const now = useNow();
  const reservations = useDataStore((state) => state.reservations);
  const setStatus = useDataStore((state) => state.setReservationStatus);
  const { table, state, current } = info;
  const today = now ? startOfDay(now) : null;
  const todays = today
    ? reservations
        .filter((r) => r.tableId === table.id && r.status !== "cancelled")
        .filter((r) => {
          const ms = new Date(r.start).getTime();
          return ms >= today.getTime() && ms < addDays(today, 1).getTime();
        })
        .sort((a, b) => a.start.localeCompare(b.start))
    : [];

  return (
    <DialogContent
      title={f.tableDetails(table.name)}
      description={`${copy.zones[table.zone]} · ${f.seats(table.seats)}`}
    >
      <DialogBody>
        <p className="text-sm font-medium text-fg">
          {current
            ? state === "seated"
              ? f.seated(current.name)
              : f.reserved(current.name, formatDate(current.start, "time"))
            : f.free}
        </p>
        <h3 className="mt-5 text-[13px] font-medium text-fg-muted">{copy.common.today}</h3>
        {todays.length === 0 ? (
          <p className="mt-2 text-sm text-fg-muted">{f.noReservation}</p>
        ) : (
          <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
            {todays.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-3.5 py-2.5 text-sm">
                <span className="w-12 font-semibold tabular-nums">
                  {formatDate(r.start, "time")}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {r.name} · {copy.common.people(r.partySize)}
                </span>
                <ReservationStatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        )}
      </DialogBody>
      <DialogFooter>
        <Button
          variant="secondary"
          onClick={() => {
            onClose();
            openDialog({
              type: "reservation",
              defaults: { tableId: table.id, date: now ? formatDate(now, "inputDate") : undefined },
            });
          }}
        >
          <CalendarPlus aria-hidden />
          {copy.panel.newReservation}
        </Button>
        {state === "seated" && current ? (
          <Button
            onClick={() => {
              setStatus(current.id, "completed");
              toast.success(f.released, {
                description: `${copy.reservations.table} ${table.name}`,
              });
              onClose();
            }}
          >
            <LogOut aria-hidden />
            {f.release}
          </Button>
        ) : state === "free" ? (
          <Button
            onClick={() => {
              onClose();
              openDialog({ type: "walk-in", tableId: table.id });
            }}
          >
            <UserPlus aria-hidden />
            {copy.panel.walkIn}
          </Button>
        ) : current ? (
          <Button
            onClick={() => {
              setStatus(current.id, "seated");
              toast.success(copy.reservations.statusChanged(copy.status.reservation.seated), {
                description: current.name,
              });
              onClose();
            }}
          >
            {copy.reservations.actions.seat}
          </Button>
        ) : null}
      </DialogFooter>
    </DialogContent>
  );
}
