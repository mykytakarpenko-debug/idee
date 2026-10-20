"use client";

import { addDays, addMinutes } from "date-fns";
import { CalendarPlus, CircleCheck, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { copy } from "@/content/it";
import { useData } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { useSiteData } from "@/hooks/use-site-data";
import { useZodForm } from "@/hooks/use-zod-form";
import { assignTable, bookingSlots, reservationCode, type Slot } from "@/lib/domain/booking";
import { combineDateAndTime } from "@/lib/domain/hours";
import { bookingFormSchema } from "@/lib/domain/schemas";
import type { Reservation } from "@/lib/domain/types";
import { downloadFile } from "@/lib/csv";
import { createIcsEvent } from "@/lib/ics";
import { capitalize, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDataStore } from "@/store/data-store";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Checkbox, Input, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { Container, SectionHeading } from "@/components/site/section";

const b = copy.booking;

export function BookingView() {
  const now = useNow();
  const { settings, ready } = useSiteData();
  const { tables, reservations } = useData((state) => ({
    tables: state.tables,
    reservations: state.reservations,
  }));
  const createReservation = useDataStore((state) => state.createReservation);

  const [party, setParty] = useState(2);
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<Reservation | null>(null);
  const form = useZodForm(bookingFormSchema, {
    name: "",
    phone: "",
    email: "",
    notes: "",
    privacy: false,
    marketing: false,
  });

  const today = now ? formatDate(now, "inputDate") : "";
  const date = pickedDate ?? today;
  const slots = useMemo<Slot[]>(
    () =>
      now && ready && date ? bookingSlots(date, party, settings, tables, reservations, now) : [],
    [now, ready, date, party, settings, tables, reservations],
  );
  const selectedSlot = slots.find((slot) => slot.time === time && slot.available);
  const dateLabel = date
    ? capitalize(formatDate(combineDateAndTime(date, "12:00"), "weekdayLong"))
    : "";
  const maxParty = settings.booking.maxPartySize;

  const onSubmit = form.handleSubmit((data) => {
    if (!selectedSlot || !date) {
      toast.error(b.pickTime);
      return;
    }
    const start = combineDateAndTime(date, selectedSlot.time);
    const table = assignTable(tables, reservations, start, settings.booking.durationMin, party);
    if (!table) {
      setTime(null);
      toast.error(b.slotTaken);
      return;
    }
    const prefix =
      settings.name
        .replace(/[^A-Za-z]/g, "")
        .slice(0, 2)
        .toUpperCase() || "TV";
    const reservation = createReservation({
      code: reservationCode(prefix, Math.random),
      name: data.name,
      phone: data.phone,
      email: data.email,
      partySize: party,
      start: start.toISOString(),
      durationMin: settings.booking.durationMin,
      status: "confirmed",
      tableId: table.id,
      source: "online",
      notes: data.notes || undefined,
      marketingConsent: data.marketing,
    });
    setConfirmed(reservation);
    window.scrollTo({ top: 0 });
  });

  if (confirmed) {
    const start = new Date(confirmed.start);
    return (
      <Container className="max-w-2xl animate-page-in py-16 sm:py-24">
        <div role="status" className="rounded-2xl border border-line bg-surface p-8 shadow-sm">
          <span className="flex size-12 items-center justify-center rounded-full bg-success-soft text-success">
            <CircleCheck aria-hidden className="size-6" />
          </span>
          <h1 className="mt-6 font-display text-3xl font-semibold text-fg">{b.confirmedTitle}</h1>
          <p className="mt-2 text-fg-muted">
            {b.confirmedText(confirmed.name.split(" ")[0] ?? "")}
          </p>
          <dl className="mt-6 grid gap-4 rounded-xl bg-surface-2 p-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-fg-muted">{b.code}</dt>
              <dd className="mt-1 font-mono text-lg font-semibold tracking-wider text-fg">
                {confirmed.code}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-fg-muted">{b.summary}</dt>
              <dd className="mt-1 text-sm font-medium text-fg">
                {b.selected(
                  copy.common.people(confirmed.partySize),
                  capitalize(formatDate(start, "weekdayLong")),
                  formatDate(start, "time"),
                )}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-fg-muted">{b.changeInfo}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              onClick={() =>
                downloadFile(
                  `prenotazione-${confirmed.code}.ics`,
                  createIcsEvent({
                    uid: `${confirmed.id}@tavola`,
                    start,
                    end: addMinutes(start, confirmed.durationMin),
                    title: `${settings.name} · ${copy.common.people(confirmed.partySize)}`,
                    location: `${settings.address}, ${settings.postalCode} ${settings.city}`,
                    description: `${b.code}: ${confirmed.code}`,
                  }),
                  "text/calendar;charset=utf-8",
                )
              }
            >
              <CalendarPlus aria-hidden />
              {b.addToCalendar}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setConfirmed(null);
                setTime(null);
              }}
            >
              {b.another}
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  const lunch = slots.filter((s) => s.service === "lunch");
  const dinner = slots.filter((s) => s.service === "dinner");

  return (
    <Container className="animate-page-in py-12 sm:py-16">
      <SectionHeading as="h1" title={b.title} description={b.description} />
      <form onSubmit={onSubmit} noValidate className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-10">
          <fieldset>
            <legend className="text-sm font-semibold text-fg">{b.party}</legend>
            <div role="radiogroup" aria-label={b.party} className="mt-3 flex flex-wrap gap-2">
              {Array.from({ length: maxParty }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={party === n}
                  aria-label={copy.common.people(n)}
                  onClick={() => {
                    setParty(n);
                    setTime(null);
                  }}
                  className={cn(
                    "flex size-11 items-center justify-center rounded-full border text-sm font-medium tabular-nums transition-colors",
                    party === n
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-line bg-surface text-fg hover:bg-surface-2",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-2 text-[13px] text-fg-muted">
              <Users aria-hidden className="size-4" />
              {b.partyLarge(maxParty)}
            </p>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold text-fg">{b.date}</legend>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {now
                ? [0, 1].map((offset) => {
                    const value = formatDate(addDays(now, offset), "inputDate");
                    return (
                      <button
                        key={offset}
                        type="button"
                        aria-pressed={date === value}
                        onClick={() => {
                          setPickedDate(value);
                          setTime(null);
                        }}
                        className={cn(
                          "h-10 rounded-full border px-4 text-sm font-medium transition-colors",
                          date === value
                            ? "border-accent bg-accent-soft text-accent-soft-fg"
                            : "border-line bg-surface text-fg hover:bg-surface-2",
                        )}
                      >
                        {offset === 0 ? copy.common.today : copy.common.tomorrow}
                      </button>
                    );
                  })
                : null}
              <Input
                type="date"
                aria-label={b.date}
                value={date}
                min={today}
                max={now ? formatDate(addDays(now, 60), "inputDate") : undefined}
                onChange={(event) => {
                  setPickedDate(event.target.value);
                  setTime(null);
                }}
                className="w-auto"
              />
            </div>
            {dateLabel ? <p className="mt-2 text-[13px] text-fg-muted">{dateLabel}</p> : null}
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold text-fg">{b.time}</legend>
            {!ready || !now ? (
              <div className="mt-3 flex gap-2">
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-10 w-20 rounded-full" />
                ))}
              </div>
            ) : slots.length === 0 ? (
              <p className="mt-3 text-sm text-fg-muted">{b.closedDay}</p>
            ) : slots.every((s) => !s.available) ? (
              <p className="mt-3 text-sm text-fg-muted">{b.noSlots}</p>
            ) : (
              <div className="mt-3 flex flex-col gap-5">
                {(
                  [
                    [copy.service.lunch, lunch],
                    [copy.service.dinner, dinner],
                  ] as const
                )
                  .filter(([, list]) => list.length > 0)
                  .map(([label, list]) => (
                    <div key={label}>
                      <p className="mb-2 text-[13px] font-medium text-fg-muted">{label}</p>
                      <div
                        role="radiogroup"
                        aria-label={`${b.time} · ${label}`}
                        className="flex flex-wrap gap-2"
                      >
                        {list.map((slot) => (
                          <button
                            key={slot.time}
                            type="button"
                            role="radio"
                            aria-checked={time === slot.time}
                            disabled={!slot.available}
                            aria-label={
                              slot.available ? slot.time : `${slot.time}, ${b.unavailable}`
                            }
                            onClick={() => setTime(slot.time)}
                            className={cn(
                              "h-10 min-w-20 rounded-full border px-4 text-sm font-medium tabular-nums transition-colors",
                              time === slot.time
                                ? "border-accent bg-accent text-accent-fg"
                                : "border-line bg-surface text-fg hover:bg-surface-2",
                              "disabled:cursor-not-allowed disabled:border-dashed disabled:bg-transparent disabled:text-fg-subtle disabled:line-through",
                            )}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-1 text-sm font-semibold text-fg">{b.details}</legend>
            <Field label={b.name} name="name" error={form.errors.name} className="sm:col-span-2">
              {(props) => <Input {...props} {...form.text("name")} autoComplete="name" />}
            </Field>
            <Field label={b.phone} name="phone" error={form.errors.phone}>
              {(props) => (
                <Input
                  {...props}
                  {...form.text("phone")}
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                />
              )}
            </Field>
            <Field label={b.email} name="email" error={form.errors.email} hint={b.emailHint}>
              {(props) => (
                <Input
                  {...props}
                  {...form.text("email")}
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                />
              )}
            </Field>
            <Field
              label={b.notes}
              name="notes"
              error={form.errors.notes}
              hint={b.notesHint}
              optional
              className="sm:col-span-2"
            >
              {(props) => <Textarea {...props} {...form.text("notes")} rows={2} />}
            </Field>
            <div className="flex flex-col gap-3 sm:col-span-2">
              <label className="flex items-start gap-3 text-sm text-fg">
                <Checkbox
                  name="privacy"
                  checked={form.values.privacy}
                  onChange={(event) => form.setValue("privacy", event.target.checked)}
                  aria-invalid={form.errors.privacy ? true : undefined}
                  aria-describedby={form.errors.privacy ? "booking-privacy-error" : undefined}
                  className="mt-0.5"
                />
                <span>
                  {b.privacy}{" "}
                  <a href="/privacy" target="_blank" className="text-accent-text underline">
                    {copy.site.footer.privacy}
                  </a>
                </span>
              </label>
              {form.errors.privacy ? (
                <p id="booking-privacy-error" className="text-[13px] text-danger">
                  {form.errors.privacy}
                </p>
              ) : null}
              <label className="flex items-start gap-3 text-sm text-fg">
                <Checkbox
                  name="marketing"
                  checked={form.values.marketing}
                  onChange={(event) => form.setValue("marketing", event.target.checked)}
                  className="mt-0.5"
                />
                {b.marketing}
              </label>
            </div>
          </fieldset>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
            <p className="text-sm font-semibold text-fg">{b.summary}</p>
            <p className="mt-3 font-display text-2xl font-semibold text-fg">{settings.name}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-fg-muted">{b.party}</dt>
                <dd className="font-medium text-fg">{copy.common.people(party)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-fg-muted">{b.date}</dt>
                <dd className="text-right font-medium text-fg">{dateLabel || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-fg-muted">{b.time}</dt>
                <dd className="font-medium text-fg tabular-nums">{selectedSlot?.time ?? "—"}</dd>
              </div>
            </dl>
            <Button type="submit" size="lg" className="mt-6 w-full" disabled={!selectedSlot}>
              {b.submit}
            </Button>
            {!selectedSlot ? (
              <p className="mt-2 text-center text-xs text-fg-muted">{b.pickTime}</p>
            ) : null}
          </div>
        </aside>
      </form>
    </Container>
  );
}
