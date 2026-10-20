"use client";

import { addDays, endOfWeek, isSameDay, startOfDay, startOfWeek } from "date-fns";
import { CalendarPlus, CalendarX2, Check } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useData, useDataReady } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { fullName } from "@/lib/domain/clients";
import type { Appointment, AppointmentStatus } from "@/lib/domain/types";
import { capitalize, formatCurrency, formatDate, formatTimeRange } from "@/lib/format";
import { groupBy, matchesQuery } from "@/lib/utils";
import { openDialog } from "@/store/ui-store";
import { AppointmentStatusBadge } from "@/components/status-badges";
import { ColorDot } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/input";
import { Page, PageHeader, Toolbar } from "@/components/ui/page";
import { SearchInput } from "@/components/ui/search-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentActionsMenu } from "./appointment-actions";

const t = copy.appointments;
const STEP = 60;

type RangeKey = "upcoming" | "today" | "week" | "past";
const STATUSES: AppointmentStatus[] = ["pending", "confirmed", "completed", "cancelled", "no_show"];

export function AppointmentsView() {
  const ready = useDataReady();
  const now = useNow();
  const { appointments, clients, services, staff, payments } = useData((state) => ({
    appointments: state.appointments,
    clients: state.clients,
    services: state.services,
    staff: state.staff,
    payments: state.payments,
  }));
  const [range, setRange] = useState<RangeKey>("upcoming");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"" | AppointmentStatus>("");
  const [staffId, setStaffId] = useState("");
  const [limit, setLimit] = useState(STEP);

  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const serviceById = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);
  const staffById = useMemo(() => new Map(staff.map((m) => [m.id, m])), [staff]);
  const paid = useMemo(
    () => new Set(payments.filter((p) => p.status !== "refunded").map((p) => p.appointmentId)),
    [payments],
  );

  const filtered = useMemo(() => {
    if (!now) return [];
    const nowMs = now.getTime();
    const today = startOfDay(now);
    const inRange = (a: Appointment) => {
      const start = new Date(a.start).getTime();
      switch (range) {
        case "upcoming":
          return new Date(a.end).getTime() > nowMs;
        case "today":
          return start >= today.getTime() && start < addDays(today, 1).getTime();
        case "week":
          return (
            start >= startOfWeek(now, { weekStartsOn: 1 }).getTime() &&
            start <= endOfWeek(now, { weekStartsOn: 1 }).getTime()
          );
        case "past":
          return new Date(a.end).getTime() <= nowMs;
      }
    };
    const result = appointments.filter((a) => {
      if (!inRange(a)) return false;
      if (status && a.status !== status) return false;
      if (staffId && a.staffId !== staffId) return false;
      if (query) {
        const client = clientById.get(a.clientId);
        const service = serviceById.get(a.serviceId);
        return matchesQuery(`${client ? fullName(client) : ""} ${service?.name ?? ""}`, query);
      }
      return true;
    });
    return result.sort((a, b) =>
      range === "past" ? b.start.localeCompare(a.start) : a.start.localeCompare(b.start),
    );
  }, [appointments, range, status, staffId, query, now, clientById, serviceById]);

  const visible = filtered.slice(0, limit);
  const days = groupBy(visible, (a) => formatDate(a.start, "inputDate"));
  const reset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setLimit(STEP);
    };

  const dayLabel = (iso: string) => {
    if (!now) return "";
    const date = new Date(iso);
    const label = capitalize(formatDate(date, "weekdayLong"));
    if (isSameDay(date, now)) return `${copy.common.today} · ${label}`;
    if (isSameDay(date, addDays(now, 1))) return `${copy.common.tomorrow} · ${label}`;
    if (isSameDay(date, addDays(now, -1))) return `${copy.common.yesterday} · ${label}`;
    return date.getFullYear() === now.getFullYear() ? label : capitalize(formatDate(date, "long"));
  };

  return (
    <Page>
      <PageHeader
        title={t.title}
        description={t.description}
        actions={
          <Button onClick={() => openDialog({ type: "appointment" })}>
            <CalendarPlus aria-hidden />
            {t.new}
          </Button>
        }
      />

      <Toolbar>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SegmentedControl<RangeKey>
            ariaLabel={copy.reports.period}
            value={range}
            onChange={reset(setRange)}
            options={[
              { value: "upcoming", label: t.ranges.upcoming },
              { value: "today", label: t.ranges.today },
              { value: "week", label: t.ranges.week },
              { value: "past", label: t.ranges.past },
            ]}
          />
          <SearchInput
            value={query}
            onValueChange={reset(setQuery)}
            label={copy.common.search}
            placeholder={t.searchPlaceholder}
            className="sm:w-64"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 lg:flex">
          <div className="lg:w-44">
            <Select
              aria-label={t.form.status}
              value={status}
              onChange={(event) => reset(setStatus)(event.target.value as "" | AppointmentStatus)}
            >
              <option value="">{t.allStatuses}</option>
              {STATUSES.map((value) => (
                <option key={value} value={value}>
                  {copy.status.appointment[value]}
                </option>
              ))}
            </Select>
          </div>
          <div className="lg:w-44">
            <Select
              aria-label={t.form.staff}
              value={staffId}
              onChange={(event) => reset(setStaffId)(event.target.value)}
            >
              <option value="">{t.allStaff}</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Toolbar>

      {!ready || !now ? (
        <Card className="space-y-4 p-6" aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarX2}
            title={t.empty}
            description={t.emptyHint}
            action={
              <Button onClick={() => openDialog({ type: "appointment" })}>
                <CalendarPlus aria-hidden />
                {t.new}
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          <p className="sr-only" aria-live="polite">
            {t.count(filtered.length)}
          </p>
          {[...days.entries()].map(([day, items]) => (
            <section key={day} aria-label={dayLabel(items[0]!.start)}>
              <h2 className="mb-2 flex items-baseline justify-between px-1 text-sm font-semibold text-fg">
                {dayLabel(items[0]!.start)}
                <span className="text-[13px] font-normal text-fg-muted">
                  {t.count(items.length)}
                </span>
              </h2>
              <Card>
                <ul className="divide-y divide-line">
                  {items.map((appointment) => {
                    const client = clientById.get(appointment.clientId);
                    const service = serviceById.get(appointment.serviceId);
                    const member = staffById.get(appointment.staffId);
                    const hasPayment = paid.has(appointment.id);
                    return (
                      <li
                        key={appointment.id}
                        className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 sm:flex-nowrap sm:px-6"
                      >
                        <span className="w-24 shrink-0 text-[13px] font-medium text-fg tabular-nums">
                          {formatTimeRange(appointment.start, appointment.end)}
                        </span>
                        <div className="order-3 w-full min-w-0 sm:order-none sm:w-auto sm:flex-1">
                          {client ? (
                            <Link
                              href={routes.client(client.id)}
                              className="text-sm font-medium text-fg hover:underline"
                            >
                              {fullName(client)}
                            </Link>
                          ) : (
                            <span className="text-sm text-fg-muted">
                              {copy.common.deletedClient}
                            </span>
                          )}
                          <p className="flex items-center gap-1.5 truncate text-[13px] text-fg-muted">
                            {member ? <ColorDot color={member.color} className="size-2" /> : null}
                            {service?.name} · {member?.name}
                          </p>
                        </div>
                        <span className="order-2 ml-auto hidden text-sm text-fg tabular-nums sm:order-none sm:ml-0 sm:block">
                          {formatCurrency(appointment.price)}
                        </span>
                        <div className="order-2 ml-auto flex items-center gap-2 sm:order-none sm:ml-0 sm:w-44 sm:justify-end">
                          {appointment.status === "completed" && hasPayment ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                              <Check aria-hidden className="size-3.5" />
                              {t.paid}
                            </span>
                          ) : null}
                          <AppointmentStatusBadge status={appointment.status} />
                        </div>
                        <div className="order-2 sm:order-none">
                          <AppointmentActionsMenu
                            appointment={appointment}
                            hasPayment={hasPayment}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </section>
          ))}
          {filtered.length > limit ? (
            <div className="flex justify-center">
              <Button variant="secondary" onClick={() => setLimit((value) => value + STEP)}>
                {copy.common.showMore} · {copy.common.showing(1, limit, filtered.length)}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </Page>
  );
}
