"use client";

import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { copy } from "@/content/it";
import { useData, useDataReady } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { layoutOverlappingEvents } from "@/lib/domain/calendar-layout";
import { fullName } from "@/lib/domain/clients";
import { minutesOfDay, openingFor, visibleHourRange } from "@/lib/domain/scheduling";
import type { Appointment, Client, Service, StaffMember } from "@/lib/domain/types";
import { capitalize, formatDate, formatTimeRange } from "@/lib/format";
import { cn } from "@/lib/utils";
import { usePrefsStore, type CalendarView as View } from "@/store/prefs-store";
import { openDialog } from "@/store/ui-store";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Page, PageHeader } from "@/components/ui/page";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";

const t = copy.calendar;
const HOUR_HEIGHT = 64;
const PX_PER_MIN = HOUR_HEIGHT / 60;
const WEEK = { weekStartsOn: 1 } as const;

interface Lookups {
  clients: Map<string, Client>;
  services: Map<string, Service>;
  staff: Map<string, StaffMember>;
}

export function CalendarView() {
  const ready = useDataReady();
  const now = useNow();
  if (!ready || !now) {
    return (
      <Page>
        <PageHeader title={t.title} description={t.description} />
        <Skeleton className="h-[640px] rounded-xl" />
      </Page>
    );
  }
  return <Calendar now={now} />;
}

function Calendar({ now }: { now: Date }) {
  const { appointments, clients, services, staff, settings } = useData((state) => ({
    appointments: state.appointments,
    clients: state.clients,
    services: state.services,
    staff: state.staff,
    settings: state.settings,
  }));
  const savedView = usePrefsStore((state) => state.calendarView);
  const setSavedView = usePrefsStore((state) => state.setCalendarView);
  const hiddenStaffIds = usePrefsStore((state) => state.hiddenStaffIds);
  const toggleStaff = usePrefsStore((state) => state.toggleStaffVisibility);
  const [cursor, setCursor] = useState<Date | null>(null);

  // Vista Giorno predefinita: colonne per operatore, lo schema più leggibile per i servizi.
  const view: View = savedView ?? "day";
  const anchor = cursor ?? now;
  const activeStaff = staff.filter((member) => member.active);
  const visibleStaff = activeStaff.filter((member) => !hiddenStaffIds.includes(member.id));
  const { startHour, endHour } = visibleHourRange(settings.hours);

  const lookups: Lookups = useMemo(
    () => ({
      clients: new Map(clients.map((c) => [c.id, c])),
      services: new Map(services.map((s) => [s.id, s])),
      staff: new Map(staff.map((m) => [m.id, m])),
    }),
    [clients, services, staff],
  );

  // Intervallo visibile
  const range = useMemo(() => {
    if (view === "day") return { start: startOfDay(anchor), end: addDays(startOfDay(anchor), 1) };
    if (view === "week") {
      const start = startOfWeek(anchor, WEEK);
      return { start, end: addDays(start, 7) };
    }
    const start = startOfWeek(startOfMonth(anchor), WEEK);
    const end = addDays(startOfWeek(endOfMonth(anchor), WEEK), 7);
    return { start, end };
  }, [view, anchor]);

  const events = useMemo(() => {
    const startMs = range.start.getTime();
    const endMs = range.end.getTime();
    const visibleIds = new Set(
      staff.filter((m) => m.active && !hiddenStaffIds.includes(m.id)).map((m) => m.id),
    );
    return appointments
      .filter((a) => {
        const ms = new Date(a.start).getTime();
        return ms >= startMs && ms < endMs && a.status !== "cancelled" && visibleIds.has(a.staffId);
      })
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [appointments, range, hiddenStaffIds, staff]);

  const move = (direction: 1 | -1) => {
    const base = cursor ?? now;
    setCursor(
      view === "day"
        ? addDays(base, direction)
        : view === "week"
          ? addWeeks(base, direction)
          : addMonths(base, direction),
    );
  };

  const title =
    view === "day"
      ? capitalize(formatDate(anchor, "long"))
      : view === "month"
        ? capitalize(formatDate(anchor, "monthYear"))
        : weekLabel(range.start);

  const onSlot = (date: Date, minutes: number, staffId?: string) => {
    const start = new Date(date);
    start.setHours(0, minutes, 0, 0);
    openDialog({ type: "appointment", defaults: { start: start.toISOString(), staffId } });
  };
  const onEvent = (id: string) => openDialog({ type: "appointment-details", id });

  return (
    <Page className="max-w-none lg:max-w-[1600px]">
      <PageHeader
        title={t.title}
        description={t.description}
        actions={
          <Button onClick={() => openDialog({ type: "appointment" })}>
            <CalendarPlus aria-hidden />
            {copy.appointments.new}
          </Button>
        }
      />

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setCursor(null)}>
            {copy.common.today}
          </Button>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => move(-1)} aria-label={t.previous}>
              <ChevronLeft aria-hidden />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => move(1)} aria-label={t.next}>
              <ChevronRight aria-hidden />
            </Button>
          </div>
          <h2 className="truncate text-base font-semibold text-fg sm:text-lg" aria-live="polite">
            {title}
          </h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div role="group" aria-label={t.staffFilter} className="flex flex-wrap gap-1.5">
            {activeStaff.map((member) => {
              const visible = !hiddenStaffIds.includes(member.id);
              return (
                <button
                  key={member.id}
                  type="button"
                  aria-pressed={visible}
                  onClick={() => toggleStaff(member.id)}
                  className={cn(
                    "inline-flex h-8 items-center gap-2 rounded-full border px-3 text-[13px] font-medium transition-colors",
                    visible
                      ? "border-line bg-surface text-fg shadow-xs"
                      : "border-dashed border-line-strong/50 text-fg-muted",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn("size-2.5 rounded-full", !visible && "opacity-40")}
                    style={{ backgroundColor: `var(--series-${member.color})` }}
                  />
                  {member.name.split(" ")[0]}
                </button>
              );
            })}
          </div>
          <SegmentedControl<View>
            ariaLabel={t.viewLabel}
            value={view}
            onChange={setSavedView}
            options={[
              { value: "day", label: t.views.day },
              { value: "week", label: t.views.week },
              { value: "month", label: t.views.month },
            ]}
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        {visibleStaff.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-fg-muted">{t.noStaff}</p>
        ) : view === "month" ? (
          <MonthGrid
            anchor={anchor}
            range={range}
            events={events}
            now={now}
            lookups={lookups}
            hours={settings.hours}
            onDay={(date) => {
              setCursor(date);
              setSavedView("day");
            }}
            onEvent={onEvent}
          />
        ) : (
          <TimeGrid
            key={view}
            now={now}
            startHour={startHour}
            endHour={endHour}
            lookups={lookups}
            onSlot={onSlot}
            onEvent={onEvent}
            columns={
              view === "week"
                ? Array.from({ length: 7 }, (_, i) => {
                    const date = addDays(range.start, i);
                    const opening = openingFor(settings.hours, date);
                    return {
                      key: date.toISOString(),
                      date,
                      closed: !opening?.open,
                      header: <DayHeader date={date} now={now} />,
                      events: events.filter((e) => isSameDay(new Date(e.start), date)),
                    };
                  })
                : visibleStaff.map((member) => {
                    const opening = openingFor(settings.hours, range.start);
                    return {
                      key: member.id,
                      date: range.start,
                      staffId: member.id,
                      closed: !opening?.open,
                      header: (
                        <span className="flex items-center justify-center gap-2 py-2">
                          <Avatar name={member.name} size="sm" color={member.color} />
                          <span className="truncate text-[13px] font-medium text-fg">
                            {member.name.split(" ")[0]}
                          </span>
                        </span>
                      ),
                      events: events.filter((e) => e.staffId === member.id),
                    };
                  })
            }
          />
        )}
      </Card>
    </Page>
  );
}

function weekLabel(start: Date): string {
  const end = addDays(start, 6);
  if (isSameMonth(start, end)) {
    return `${start.getDate()} – ${formatDate(end, "dayMonthLong")} ${end.getFullYear()}`;
  }
  return `${formatDate(start, "dayMonthLong")} – ${formatDate(end, "dayMonthLong")} ${end.getFullYear()}`;
}

function DayHeader({ date, now }: { date: Date; now: Date }) {
  const today = isSameDay(date, now);
  return (
    <span className="flex flex-col items-center gap-0.5 py-2">
      <span
        className={cn(
          "text-[11px] font-medium uppercase",
          today ? "text-accent-text" : "text-fg-muted",
        )}
      >
        {formatDate(date, "weekdayNarrow")}
      </span>
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-full text-[15px] font-semibold tabular-nums",
          today ? "bg-accent text-accent-fg" : "text-fg",
        )}
        aria-current={today ? "date" : undefined}
      >
        {date.getDate()}
      </span>
    </span>
  );
}

interface Column {
  key: string;
  date: Date;
  staffId?: string;
  closed: boolean;
  header: ReactNode;
  events: Appointment[];
}

function TimeGrid({
  columns,
  now,
  startHour,
  endHour,
  lookups,
  onSlot,
  onEvent,
}: {
  columns: Column[];
  now: Date;
  startHour: number;
  endHour: number;
  lookups: Lookups;
  onSlot: (date: Date, minutes: number, staffId?: string) => void;
  onEvent: (id: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const gridHeight = hours.length * HOUR_HEIGHT;
  const nowMinutes = minutesOfDay(now);
  const showNow = nowMinutes >= startHour * 60 && nowMinutes <= endHour * 60;

  // All'apertura porta in vista l'ora attuale.
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const target = (minutesOfDay(new Date()) - startHour * 60 - 60) * PX_PER_MIN;
    element.scrollTop = Math.max(0, target);
  }, [startHour]);

  // Colonne mai più strette di 104 px: su schermi piccoli il calendario scorre in orizzontale.
  const minWidth = columns.length * 104 + 56;

  return (
    <div
      ref={scrollRef}
      className="max-h-[calc(100dvh-17rem)] min-h-[420px] overflow-auto overscroll-contain"
    >
      <div style={{ minWidth }}>
        {/* Intestazione colonne */}
        <div className="sticky top-0 z-20 flex border-b border-line bg-surface/95 backdrop-blur">
          <div className="sticky left-0 z-10 w-14 shrink-0 bg-surface/95" />
          {columns.map((column) => (
            <div
              key={column.key}
              className={cn(
                "min-w-0 flex-1 border-l border-line",
                column.closed && "bg-surface-2/40",
              )}
            >
              {column.header}
            </div>
          ))}
        </div>

        <div className="relative flex" style={{ height: gridHeight }}>
          {/* Orari */}
          <div aria-hidden className="sticky left-0 z-10 w-14 shrink-0 bg-surface">
            {hours.map((hour, i) => (
              <span
                key={hour}
                className="absolute right-2 -translate-y-1/2 text-[11px] text-fg-muted tabular-nums"
                style={{ top: i * HOUR_HEIGHT }}
              >
                {i === 0 ? "" : `${String(hour).padStart(2, "0")}:00`}
              </span>
            ))}
          </div>

          {columns.map((column) => {
            const layout = layoutOverlappingEvents(
              column.events.map((e) => ({
                id: e.id,
                startMin: minutesOfDay(new Date(e.start)),
                endMin: minutesOfDay(new Date(e.end)) || 24 * 60,
              })),
            );
            const isToday = isSameDay(column.date, now);
            const dateLabel = formatDate(column.date, "weekdayLong");
            return (
              <div
                key={column.key}
                className={cn(
                  "relative min-w-0 flex-1 border-l border-line",
                  column.closed &&
                    "bg-[repeating-linear-gradient(135deg,transparent,transparent_8px,var(--surface-2)_8px,var(--surface-2)_9px)]",
                )}
              >
                {/* Linee delle ore */}
                {hours.map((hour, i) => (
                  <div
                    key={hour}
                    aria-hidden
                    className="absolute inset-x-0 border-t border-grid"
                    style={{ top: i * HOUR_HEIGHT }}
                  >
                    <div
                      className="absolute inset-x-0 border-t border-dashed border-grid/60"
                      style={{ top: HOUR_HEIGHT / 2 }}
                    />
                  </div>
                ))}

                {/* Slot cliccabili (30 minuti): raggiungibili anche con lo screen reader */}
                {hours.flatMap((hour) =>
                  [0, 30].map((offset) => {
                    const minutes = hour * 60 + offset;
                    return (
                      <button
                        key={minutes}
                        type="button"
                        tabIndex={-1}
                        aria-label={t.slotLabel(
                          dateLabel,
                          `${String(hour).padStart(2, "0")}:${String(offset).padStart(2, "0")}`,
                        )}
                        onClick={() => onSlot(column.date, minutes, column.staffId)}
                        className="absolute inset-x-0 transition-colors hover:bg-accent-soft/50"
                        style={{
                          top: (minutes - startHour * 60) * PX_PER_MIN,
                          height: 30 * PX_PER_MIN,
                        }}
                      />
                    );
                  }),
                )}

                {/* Appuntamenti */}
                {column.events.map((event) => {
                  const position = layout.get(event.id);
                  const startMin = minutesOfDay(new Date(event.start));
                  const endMin = minutesOfDay(new Date(event.end)) || 24 * 60;
                  const top = Math.max(0, (startMin - startHour * 60) * PX_PER_MIN);
                  const height = Math.max(22, (endMin - startMin) * PX_PER_MIN - 2);
                  const columns = position?.columns ?? 1;
                  const index = position?.column ?? 0;
                  return (
                    <EventBlock
                      key={event.id}
                      event={event}
                      lookups={lookups}
                      showStaff={!column.staffId}
                      onClick={() => onEvent(event.id)}
                      style={{
                        top,
                        height,
                        left: `calc(${(index / columns) * 100}% + 2px)`,
                        width: `calc(${100 / columns}% - 4px)`,
                      }}
                    />
                  );
                })}

                {isToday && showNow ? (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
                    style={{ top: (nowMinutes - startHour * 60) * PX_PER_MIN }}
                  >
                    <span className="-ml-1 size-2 rounded-full bg-danger-solid" />
                    <span className="h-[2px] flex-1 bg-danger-solid" />
                    <span className="sr-only">
                      {t.now}: {formatDate(now, "time")}
                    </span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EventBlock({
  event,
  lookups,
  showStaff,
  onClick,
  style,
}: {
  event: Appointment;
  lookups: Lookups;
  showStaff: boolean;
  onClick: () => void;
  style: CSSProperties;
}) {
  const client = lookups.clients.get(event.clientId);
  const service = lookups.services.get(event.serviceId);
  const member = lookups.staff.get(event.staffId);
  const color = `var(--series-${member?.color ?? 1})`;
  const name = client ? fullName(client) : copy.common.deletedClient;
  const time = formatTimeRange(event.start, event.end);
  const compact = typeof style.height === "number" && style.height < 44;

  const label = `${name}, ${time}, ${service?.name ?? ""}, ${member?.name ?? ""}, ${copy.status.appointment[event.status]}`;
  const noShow = event.status === "no_show";

  // Il contenuto visibile si adatta alla larghezza del blocco (container query):
  // stretto → solo orario; medio → nome; ampio → nome, orario e servizio.
  // Il nome accessibile è sempre la descrizione completa (testo sr-only).
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        "@container absolute z-[5] flex flex-col overflow-hidden rounded-md border-l-[3px] px-1 py-1 text-left shadow-xs transition-shadow duration-150 hover:z-[6] hover:shadow-md focus-visible:z-[6] @[72px]:px-1.5 @[90px]:px-2",
        noShow
          ? "bg-surface-2"
          : "bg-[color-mix(in_oklab,var(--event-color)_13%,var(--surface))] dark:bg-[color-mix(in_oklab,var(--event-color)_24%,var(--surface))]",
        event.status === "pending" &&
          "outline-1 -outline-offset-1 outline-[color-mix(in_oklab,var(--event-color)_55%,transparent)] outline-dashed",
      )}
      style={{ ...style, borderLeftColor: color, ["--event-color" as string]: color }}
    >
      <span className="sr-only">{label}</span>
      <span
        aria-hidden
        className="text-[10px] leading-tight font-semibold tracking-tight text-fg tabular-nums @[72px]:hidden"
      >
        {formatDate(event.start, "time")}
      </span>
      <span
        aria-hidden
        className={cn(
          "hidden truncate text-[12px] leading-tight font-semibold @[72px]:block",
          noShow ? "text-fg-muted line-through" : "text-fg",
        )}
      >
        {compact ? `${formatDate(event.start, "time")} ${name}` : name}
      </span>
      {!compact ? (
        <>
          <span
            aria-hidden
            className="hidden truncate text-[11px] leading-snug text-fg-muted tabular-nums @[72px]:block"
          >
            {time}
          </span>
          <span
            aria-hidden
            className="hidden truncate text-[11px] leading-snug text-fg-muted @[120px]:block"
          >
            {service?.name}
            {showStaff && member ? ` · ${member.name.split(" ")[0]}` : ""}
          </span>
        </>
      ) : null}
    </button>
  );
}

function MonthGrid({
  anchor,
  range,
  events,
  now,
  lookups,
  hours,
  onDay,
  onEvent,
}: {
  anchor: Date;
  range: { start: Date; end: Date };
  events: Appointment[];
  now: Date;
  lookups: Lookups;
  hours: Parameters<typeof openingFor>[0];
  onDay: (date: Date) => void;
  onEvent: (id: string) => void;
}) {
  const days: Date[] = [];
  for (let d = range.start; d < range.end; d = addDays(d, 1)) days.push(d);
  const byDay = new Map<string, Appointment[]>();
  for (const event of events) {
    const key = formatDate(event.start, "inputDate");
    const list = byDay.get(key);
    if (list) list.push(event);
    else byDay.set(key, [event]);
  }
  const weekdays = days.slice(0, 7);

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-line">
        {weekdays.map((day) => (
          <div
            key={day.toISOString()}
            className="py-2 text-center text-[11px] font-medium text-fg-muted uppercase"
          >
            {formatDate(day, "weekdayNarrow")}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = formatDate(day, "inputDate");
          const list = byDay.get(key) ?? [];
          const inMonth = isSameMonth(day, anchor);
          const today = isSameDay(day, now);
          const closed = !openingFor(hours, day)?.open;
          return (
            <div
              key={key}
              className={cn(
                "flex min-h-[72px] flex-col gap-1 border-b border-l border-line p-1.5 first:border-l-0 sm:min-h-[116px] sm:p-2 [&:nth-child(7n+1)]:border-l-0",
                !inMonth && "bg-surface-2/40",
                closed && inMonth && "bg-surface-2/25",
              )}
            >
              <button
                type="button"
                onClick={() => onDay(day)}
                aria-label={`${capitalize(formatDate(day, "weekdayLong"))}: ${copy.appointments.count(list.length)}`}
                className={cn(
                  "flex size-7 items-center justify-center self-start rounded-full text-[13px] font-medium tabular-nums transition-colors hover:bg-surface-2",
                  today
                    ? "bg-accent text-accent-fg hover:bg-accent-hover"
                    : inMonth
                      ? "text-fg"
                      : "text-fg-subtle",
                )}
                aria-current={today ? "date" : undefined}
              >
                {day.getDate()}
              </button>
              {/* Mobile: solo il conteggio */}
              {list.length > 0 ? (
                <span className="text-[11px] font-medium text-fg-muted sm:hidden">
                  {list.length}
                </span>
              ) : null}
              <ul className="hidden flex-col gap-0.5 sm:flex">
                {list.slice(0, 3).map((event) => {
                  const client = lookups.clients.get(event.clientId);
                  const member = lookups.staff.get(event.staffId);
                  return (
                    <li key={event.id}>
                      <button
                        type="button"
                        onClick={() => onEvent(event.id)}
                        className="flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-[11px] text-fg hover:bg-surface-2"
                      >
                        <span
                          aria-hidden
                          className="size-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: `var(--series-${member?.color ?? 1})` }}
                        />
                        <span className="text-fg-muted tabular-nums">
                          {formatDate(event.start, "time")}
                        </span>
                        <span className="truncate">
                          {client ? client.lastName : copy.common.deletedClient}
                        </span>
                      </button>
                    </li>
                  );
                })}
                {list.length > 3 ? (
                  <li>
                    <button
                      type="button"
                      onClick={() => onDay(day)}
                      className="px-1 text-[11px] font-medium text-accent-text hover:underline"
                    >
                      {t.more(list.length - 3)}
                    </button>
                  </li>
                ) : null}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
