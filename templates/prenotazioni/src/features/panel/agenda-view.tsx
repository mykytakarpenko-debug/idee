"use client";

import { addDays, startOfDay } from "date-fns";
import {
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Hourglass,
  Inbox,
} from "lucide-react";
import { useMemo, useState } from "react";
import { copy } from "@/content/it";
import { useData, useDataReady } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { occupancy } from "@/lib/domain/availability";
import { parseISODate, toISODate, weekStart } from "@/lib/domain/dates";
import type { Appointment } from "@/lib/domain/types";
import { capitalize, formatDate, formatNumber, formatPercent, formatTimeRange } from "@/lib/format";
import { cn } from "@/lib/utils";
import { openDialog } from "@/store/ui-store";
import { StatusBadge } from "@/components/status-badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { Page, PageHeader, Toolbar } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { modeIcon } from "@/features/site/booking-wizard";
import { useAppointmentActions } from "./appointment-actions";

const a = copy.agenda;

export function AgendaView() {
  const ready = useDataReady();
  const now = useNow();
  if (!ready || !now) {
    return (
      <Page aria-busy="true">
        <Skeleton className="h-9 w-48" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[118px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </Page>
    );
  }
  return <Agenda now={now} />;
}

const notCancelled = (x: Appointment) => x.status !== "cancelled";

function Agenda({ now }: { now: Date }) {
  const { appointments, services, staff, hours, timeOff } = useData((state) => ({
    appointments: state.appointments,
    services: state.services,
    staff: state.staff,
    hours: state.hours,
    timeOff: state.timeOff,
  }));
  const actions = useAppointmentActions();
  const [picked, setPicked] = useState<string | null>(null);
  const [staffFilter, setStaffFilter] = useState("");
  const date = picked ?? toISODate(now);

  const stats = useMemo(() => {
    const today = toISODate(now);
    const monday = weekStart(now);
    const sunday = addDays(monday, 7);
    // Conta tutto ciò che non è stato cancellato (anche i conclusi della giornata).
    const active = appointments.filter(notCancelled);
    return {
      today: active.filter((x) => toISODate(new Date(x.start)) === today).length,
      week: active.filter((x) => {
        const ms = new Date(x.start).getTime();
        return ms >= monday.getTime() && ms < sunday.getTime();
      }).length,
      pending: appointments
        .filter((x) => x.status === "pending" && new Date(x.start).getTime() > now.getTime())
        .sort((x, y) => x.start.localeCompare(y.start)),
      occupancy: occupancy({ staff, hours, timeOff, appointments }, startOfDay(now), 7),
    };
  }, [appointments, staff, hours, timeOff, now]);

  const list = useMemo(
    () =>
      appointments
        .filter((x) => toISODate(new Date(x.start)) === date)
        .filter((x) => !staffFilter || x.staffId === staffFilter)
        .sort((x, y) => x.start.localeCompare(y.start)),
    [appointments, date, staffFilter],
  );

  const serviceName = (id: string) => services.find((s) => s.id === id)?.name ?? "";
  const staffName = (id: string) => staff.find((p) => p.id === id)?.name ?? "";
  const shift = (days: number) => setPicked(toISODate(addDays(parseISODate(date), days)));

  return (
    <Page>
      <PageHeader title={a.title} description={capitalize(formatDate(now, "long"))} />

      <section aria-label={a.title} className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label={a.kpi.today} value={formatNumber(stats.today)} icon={<CalendarDays />} />
        <StatCard label={a.kpi.week} value={formatNumber(stats.week)} icon={<CalendarCheck />} />
        <StatCard
          label={a.kpi.pending}
          value={formatNumber(stats.pending.length)}
          icon={<Hourglass />}
        />
        <StatCard
          label={a.kpi.occupancy}
          value={formatPercent(stats.occupancy, 0)}
          hint={a.kpi.occupancyHint}
          icon={<Gauge />}
        />
      </section>

      <Card>
        <CardHeader title={a.pending} />
        {stats.pending.length === 0 ? (
          <EmptyState compact icon={Inbox} title={a.pendingEmpty} />
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {stats.pending.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-3 px-5 py-3 sm:px-6">
                <div className="min-w-56 flex-1">
                  <p className="truncate text-sm font-medium text-fg">{item.customer.name}</p>
                  <p className="text-xs text-fg-muted">
                    <span className="font-medium text-fg">
                      {capitalize(formatDate(item.start, "weekdayShort"))}{" "}
                      {formatDate(item.start, "time")}
                    </span>{" "}
                    · {serviceName(item.serviceId)} · {staffName(item.staffId)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openDialog({ type: "appointment", id: item.id })}
                  >
                    {a.details}
                    <span className="sr-only"> · {item.customer.name}</span>
                  </Button>
                  <Button size="sm" onClick={() => actions.confirm(item)}>
                    {a.actions.confirm}
                    <span className="sr-only"> · {item.customer.name}</span>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Toolbar>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => setPicked(null)}>
            {copy.common.today}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={copy.common.previous}
            onClick={() => shift(-1)}
          >
            <ChevronLeft aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={copy.common.next}
            onClick={() => shift(1)}
          >
            <ChevronRight aria-hidden />
          </Button>
          <Input
            type="date"
            value={date}
            onChange={(e) => e.target.value && setPicked(e.target.value)}
            aria-label={copy.booking.summaryWhen}
            className="w-auto"
          />
        </div>
        <div className="sm:w-60">
          <Select
            aria-label={a.allStaff}
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
          >
            <option value="">{a.allStaff}</option>
            {staff.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </Select>
        </div>
      </Toolbar>

      <p className="-mt-2 text-sm text-fg-muted" aria-live="polite">
        <span className="font-medium text-fg">
          {capitalize(formatDate(parseISODate(date), "weekdayLong"))}
        </span>{" "}
        · {copy.common.appointments(list.filter(notCancelled).length)}
      </p>

      <Card>
        {list.length === 0 ? (
          <EmptyState icon={CalendarDays} title={a.empty} description={a.emptyHint} />
        ) : (
          <ul className="divide-y divide-line">
            {list.map((item) => (
              <AppointmentRow
                key={item.id}
                item={item}
                serviceName={serviceName(item.serviceId)}
                staffName={staffName(item.staffId)}
              />
            ))}
          </ul>
        )}
      </Card>
    </Page>
  );
}

function AppointmentRow({
  item,
  serviceName,
  staffName,
}: {
  item: Appointment;
  serviceName: string;
  staffName: string;
}) {
  const Icon = modeIcon[item.mode];
  const inactive = item.status === "cancelled";
  return (
    <li className="relative flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 hover:bg-surface-2/60 sm:flex-nowrap sm:px-6">
      <span
        className={cn(
          "w-28 text-sm font-semibold tabular-nums",
          inactive ? "text-fg-muted line-through" : "text-fg",
        )}
      >
        {formatTimeRange(item.start, item.end)}
      </span>
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => openDialog({ type: "appointment", id: item.id })}
          className="block truncate text-left text-sm font-medium text-fg after:absolute after:inset-0 hover:underline"
        >
          {item.customer.name}
        </button>
        <p className="flex items-center gap-1.5 truncate text-xs text-fg-muted">
          <Icon aria-hidden className="size-3.5 shrink-0" />
          {serviceName}
        </p>
      </div>
      <span className="hidden items-center gap-2 text-sm text-fg-muted md:flex">
        <Avatar name={staffName} size="sm" />
        {staffName}
      </span>
      <span className="w-36 text-right">
        <StatusBadge status={item.status} />
      </span>
    </li>
  );
}
