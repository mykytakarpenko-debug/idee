"use client";

import { addMonths, endOfMonth, isSameMonth, startOfDay, startOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { copy } from "@/content/it";
import { useData } from "@/hooks/use-data";
import { availableDays, availableSlots, type Slot } from "@/lib/domain/availability";
import { isoWeekday, parseISODate, toISODate } from "@/lib/domain/dates";
import type { Service } from "@/lib/domain/types";
import { capitalize, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const t = copy.booking.slot;

/**
 * Calendario mensile con i giorni disponibili + orari del giorno scelto.
 * Usato nella prenotazione, nel widget e per spostare un appuntamento.
 */
export function SlotPicker({
  service,
  staffId,
  now,
  value,
  onChange,
  ignoreAppointmentId,
  compact = false,
}: {
  service: Service;
  staffId: string;
  now: Date;
  value: string | null;
  onChange: (slot: Slot) => void;
  ignoreAppointmentId?: string;
  compact?: boolean;
}) {
  const { services, hours, timeOff, appointments, staff, settings } = useData((state) => ({
    services: state.services,
    hours: state.hours,
    timeOff: state.timeOff,
    appointments: state.appointments,
    staff: state.staff,
    settings: state.settings,
  }));
  const data = useMemo(
    () => ({ services, hours, timeOff, appointments }),
    [services, hours, timeOff, appointments],
  );
  const days = useMemo(
    () =>
      availableDays(
        { service, staffId, data, booking: settings.booking, now, ignoreAppointmentId },
        settings.booking.horizonDays,
      ),
    [service, staffId, data, settings.booking, now, ignoreAppointmentId],
  );
  const firstAvailable = [...days].sort()[0] ?? null;
  const [pickedDate, setPickedDate] = useState<string | null>(
    value ? toISODate(new Date(value)) : null,
  );
  const date = pickedDate ?? firstAvailable;
  const [month, setMonth] = useState(() => startOfMonth(date ? parseISODate(date) : now));

  const slots = useMemo(
    () =>
      date
        ? availableSlots({
            service,
            staffId,
            date,
            data,
            booking: settings.booking,
            now,
            ignoreAppointmentId,
          })
        : [],
    [service, staffId, date, data, settings.booking, now, ignoreAppointmentId],
  );

  const lastMonth = startOfMonth(addMonths(now, Math.ceil(settings.booking.horizonDays / 30)));
  const canPrev = month.getTime() > startOfMonth(now).getTime();
  const canNext = month.getTime() < lastMonth.getTime();
  const cells = monthCells(month);
  const staffName = (id: string) => staff.find((s) => s.id === id)?.name ?? "";

  return (
    <div className={cn("grid gap-6", !compact && "md:grid-cols-[minmax(0,320px)_1fr]")}>
      <div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-fg" aria-live="polite">
            {capitalize(formatDate(month, "monthYear"))}
          </p>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t.previousMonth}
              disabled={!canPrev}
              onClick={() => setMonth((m) => addMonths(m, -1))}
            >
              <ChevronLeft aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t.nextMonth}
              disabled={!canNext}
              onClick={() => setMonth((m) => addMonths(m, 1))}
            >
              <ChevronRight aria-hidden />
            </Button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1 text-center" role="group" aria-label={t.month}>
          {copy.weekdays.map((name, i) => (
            <span key={name} aria-hidden className="py-1 text-xs font-medium text-fg-muted">
              {copy.weekdaysShort[i]}
            </span>
          ))}
          {cells.map((day, i) => {
            if (!day) return <span key={`empty-${i}`} aria-hidden />;
            const iso = toISODate(day);
            const available = days.has(iso);
            const selected = iso === date;
            const label = `${capitalize(formatDate(day, "weekdayLong"))}, ${available ? t.available : t.unavailable}`;
            return (
              <button
                key={iso}
                type="button"
                disabled={!available}
                aria-pressed={selected}
                aria-label={label}
                onClick={() => setPickedDate(iso)}
                className={cn(
                  "flex aspect-square min-h-9 items-center justify-center rounded-lg text-sm tabular-nums transition-colors",
                  selected
                    ? "bg-accent font-semibold text-accent-fg"
                    : available
                      ? "bg-accent-soft font-medium text-accent-soft-fg hover:bg-accent/15"
                      : "text-fg-subtle",
                )}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-fg">
          {date ? t.times(formatDate(parseISODate(date), "weekdayLong")) : t.pickDay}
        </p>
        {date && slots.length === 0 ? <p className="mt-3 text-sm text-fg-muted">{t.none}</p> : null}
        {slots.length > 0 ? (
          <div
            role="radiogroup"
            aria-label={date ? t.times(formatDate(parseISODate(date), "weekdayLong")) : t.title}
            className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4"
          >
            {slots.map((slot) => {
              const iso = slot.start.toISOString();
              const checked = value === iso;
              const time = formatDate(slot.start, "time");
              return (
                <button
                  key={iso}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  aria-label={
                    staffId === "any" ? `${time}, ${slot.staffIds.map(staffName).join(", ")}` : time
                  }
                  onClick={() => onChange(slot)}
                  className={cn(
                    "h-11 rounded-lg border text-sm font-medium tabular-nums transition-colors",
                    checked
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-line bg-surface text-fg hover:border-accent/50 hover:bg-accent-soft",
                  )}
                >
                  {time}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Celle del mese (lunedì → domenica), con null per i giorni fuori mese. */
function monthCells(month: Date): (Date | null)[] {
  const first = startOfMonth(month);
  const last = endOfMonth(month);
  const cells: (Date | null)[] = Array.from({ length: isoWeekday(first) - 1 }, () => null);
  for (let d = first; d <= last; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    if (isSameMonth(d, month)) cells.push(startOfDay(d));
  }
  return cells;
}
