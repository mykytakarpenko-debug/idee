"use client";

import { addDays } from "date-fns";
import {
  Ban,
  CalendarX2,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Ellipsis,
  Pencil,
  RotateCcw,
  Users,
  Utensils,
  UserX,
} from "lucide-react";
import { useMemo, useState } from "react";
import { copy } from "@/content/it";
import { useData, useDataReady } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { freeTables } from "@/lib/domain/booking";
import { combineDateAndTime, serviceOf, type ServiceKind } from "@/lib/domain/hours";
import type { DiningTable, Reservation, ReservationStatus } from "@/lib/domain/types";
import { capitalize, formatDate } from "@/lib/format";
import { groupBy } from "@/lib/utils";
import { useDataStore } from "@/store/data-store";
import { openDialog } from "@/store/ui-store";
import { ReservationStatusBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { Page, PageHeader, Toolbar } from "@/components/ui/page";
import { SearchInput } from "@/components/ui/search-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";

const t = copy.reservations;
type ServiceFilter = "all" | ServiceKind;
const STATUSES: ReservationStatus[] = [
  "requested",
  "confirmed",
  "seated",
  "completed",
  "no_show",
  "cancelled",
];

export function ReservationsView() {
  const ready = useDataReady();
  const now = useNow();
  const { reservations, tables, settings } = useData((state) => ({
    reservations: state.reservations,
    tables: state.tables,
    settings: state.settings,
  }));
  const [picked, setPicked] = useState<string | null>(null);
  const [service, setService] = useState<ServiceFilter>("all");
  const [status, setStatus] = useState<"" | ReservationStatus>("");
  const [query, setQuery] = useState("");

  const date = picked ?? (now ? formatDate(now, "inputDate") : "");
  const shift = (days: number) =>
    setPicked(formatDate(addDays(combineDateAndTime(date, "12:00"), days), "inputDate"));

  const list = useMemo(() => {
    if (!date) return [];
    const q = query.trim().toLowerCase();
    return reservations
      .filter((r) => formatDate(r.start, "inputDate") === date)
      .filter((r) => service === "all" || serviceOf(new Date(r.start)) === service)
      .filter((r) => !status || r.status === status)
      .filter((r) => !q || `${r.name} ${r.phone} ${r.code}`.toLowerCase().includes(q))
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [reservations, date, service, status, query]);
  const covers = list
    .filter((r) => r.status !== "cancelled")
    .reduce((acc, r) => acc + r.partySize, 0);
  const groups = groupBy(list, (r) => formatDate(r.start, "time"));

  return (
    <Page>
      <PageHeader title={t.title} description={t.description} />

      <Toolbar>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => setPicked(null)}>
            {copy.common.today}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => shift(-1)}
            aria-label={copy.common.previous}
            disabled={!date}
          >
            <ChevronLeft aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => shift(1)}
            aria-label={copy.common.next}
            disabled={!date}
          >
            <ChevronRight aria-hidden />
          </Button>
          <Input
            type="date"
            value={date}
            onChange={(e) => e.target.value && setPicked(e.target.value)}
            aria-label={t.form.date}
            className="w-auto"
          />
          <SegmentedControl<ServiceFilter>
            ariaLabel={t.allServices}
            value={service}
            onChange={setService}
            options={[
              { value: "all", label: copy.common.all },
              { value: "lunch", label: copy.service.lunch },
              { value: "dinner", label: copy.service.dinner },
            ]}
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <SearchInput
            value={query}
            onValueChange={setQuery}
            label={copy.common.search}
            placeholder={t.searchPlaceholder}
            className="sm:w-64"
          />
          <div className="sm:w-44">
            <Select
              aria-label={t.allStatuses}
              value={status}
              onChange={(e) => setStatus(e.target.value as "" | ReservationStatus)}
            >
              <option value="">{t.allStatuses}</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {copy.status.reservation[s]}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Toolbar>

      {date ? (
        <p className="-mt-2 flex items-center gap-2 text-sm text-fg-muted" aria-live="polite">
          <span className="font-medium text-fg">
            {capitalize(formatDate(combineDateAndTime(date, "12:00"), "weekdayLong"))}
          </span>
          · {t.count(list.length)} · {copy.common.covers(covers)}
        </p>
      ) : null}

      {!ready || !now ? (
        <Card className="space-y-3 p-6" aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </Card>
      ) : list.length === 0 ? (
        <Card>
          <EmptyState icon={CalendarX2} title={t.empty} description={t.emptyHint} />
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {[...groups.entries()].map(([time, items]) => (
            <section key={time} aria-label={time}>
              <h2 className="mb-2 px-1 text-sm font-semibold text-fg tabular-nums">{time}</h2>
              <Card>
                <ul className="divide-y divide-line">
                  {items.map((reservation) => (
                    <ReservationRow
                      key={reservation.id}
                      reservation={reservation}
                      tables={tables}
                      reservations={reservations}
                      durationMin={settings.booking.durationMin}
                    />
                  ))}
                </ul>
              </Card>
            </section>
          ))}
        </div>
      )}
    </Page>
  );
}

function ReservationRow({
  reservation,
  tables,
  reservations,
  durationMin,
}: {
  reservation: Reservation;
  tables: DiningTable[];
  reservations: Reservation[];
  durationMin: number;
}) {
  const setStatus = useDataStore((state) => state.setReservationStatus);
  const updateReservation = useDataStore((state) => state.updateReservation);
  const free = new Set(
    freeTables(
      tables,
      reservations,
      new Date(reservation.start),
      durationMin,
      reservation.partySize,
      reservation.id,
    ).map((t) => t.id),
  );
  const change = (status: ReservationStatus) => {
    const previous = reservation.status;
    setStatus(reservation.id, status);
    toast.success(t.statusChanged(copy.status.reservation[status]), {
      description: reservation.name,
      action: { label: copy.common.cancel, onClick: () => setStatus(reservation.id, previous) },
    });
  };
  const closed =
    reservation.status === "cancelled" ||
    reservation.status === "no_show" ||
    reservation.status === "completed";

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:flex-nowrap sm:px-6">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg">
          {reservation.name}
          <span className="ml-2 font-mono text-xs text-fg-subtle">{reservation.code}</span>
        </p>
        <p className="truncate text-xs text-fg-muted">
          {reservation.phone || copy.source.walk_in} · {copy.source[reservation.source]}
          {reservation.notes ? ` · ${reservation.notes}` : ""}
        </p>
      </div>
      <span className="flex items-center gap-1.5 text-sm text-fg tabular-nums">
        <Users aria-hidden className="size-4 text-fg-muted" />
        {reservation.partySize}
      </span>
      <div className="w-36">
        <Select
          aria-label={`${t.table}: ${reservation.name}`}
          value={reservation.tableId ?? ""}
          disabled={closed}
          onChange={(e) => updateReservation(reservation.id, { tableId: e.target.value || null })}
        >
          <option value="">{t.noTable}</option>
          {tables.map((table) => (
            <option
              key={table.id}
              value={table.id}
              disabled={!free.has(table.id) && table.id !== reservation.tableId}
            >
              {t.table} {table.name} ({table.seats})
            </option>
          ))}
        </Select>
      </div>
      <span className="w-32">
        <ReservationStatusBadge status={reservation.status} />
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`${copy.common.moreActions}: ${reservation.name}`}
          >
            <Ellipsis aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          {reservation.status === "requested" ? (
            <DropdownMenuItem onSelect={() => change("confirmed")}>
              <CircleCheck aria-hidden />
              {t.actions.confirm}
            </DropdownMenuItem>
          ) : null}
          {reservation.status === "requested" || reservation.status === "confirmed" ? (
            <>
              <DropdownMenuItem onSelect={() => change("seated")}>
                <Utensils aria-hidden />
                {t.actions.seat}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => change("no_show")}>
                <UserX aria-hidden />
                {t.actions.noShow}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => change("cancelled")}>
                <Ban aria-hidden />
                {t.actions.cancel}
              </DropdownMenuItem>
            </>
          ) : null}
          {reservation.status === "seated" ? (
            <DropdownMenuItem onSelect={() => change("completed")}>
              <Check aria-hidden />
              {t.actions.complete}
            </DropdownMenuItem>
          ) : null}
          {reservation.status === "cancelled" || reservation.status === "no_show" ? (
            <DropdownMenuItem onSelect={() => change("confirmed")}>
              <RotateCcw aria-hidden />
              {t.actions.reopen}
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => openDialog({ type: "reservation", id: reservation.id })}
          >
            <Pencil aria-hidden />
            {copy.common.edit}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
