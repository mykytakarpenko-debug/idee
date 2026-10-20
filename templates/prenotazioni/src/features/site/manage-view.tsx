"use client";

import { addMinutes } from "date-fns";
import { CalendarPlus, CalendarSearch, CalendarX2, Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useData, useDataReady } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { manageability, type Slot } from "@/lib/domain/availability";
import { codeSchema } from "@/lib/domain/schemas";
import { downloadFile } from "@/lib/csv";
import { capitalize, formatDate } from "@/lib/format";
import { createIcsEvent } from "@/lib/ics";
import { useDataStore } from "@/store/data-store";
import { Container, SectionHeading } from "@/components/site/section";
import { StatusBadge } from "@/components/status-badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { modeIcon, priceLabel } from "./booking-wizard";
import { SlotPicker } from "./slot-picker";

const m = copy.manage;

/** Ricerca della prenotazione per codice. */
export function FindBookingView() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>();
  return (
    <Container className="max-w-xl animate-page-in py-16 sm:py-24">
      <SectionHeading as="h1" title={m.findTitle} description={m.findText} />
      <form
        noValidate
        className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-start"
        onSubmit={(event) => {
          event.preventDefault();
          const parsed = codeSchema.safeParse(code);
          if (!parsed.success) {
            setError(parsed.error.issues[0]?.message);
            return;
          }
          router.push(routes.appointment(parsed.data));
        }}
      >
        <Field label={m.code} name="code" error={error} className="flex-1">
          {(props) => (
            <Input
              {...props}
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError(undefined);
              }}
              placeholder="AG-7KQ2MZ"
              autoComplete="off"
              autoCapitalize="characters"
              className="font-mono uppercase"
            />
          )}
        </Field>
        <Button type="submit" className="sm:mt-[26px]">
          {m.find}
        </Button>
      </form>
    </Container>
  );
}

/** Dettaglio della prenotazione per il cliente: calendario, spostamento, cancellazione. */
export function ManageView({ code }: { code: string }) {
  const ready = useDataReady();
  const now = useNow();
  const { appointment, services, staff, settings } = useData((state) => ({
    appointment: state.appointments.find((a) => a.code === code),
    services: state.services,
    staff: state.staff,
    settings: state.settings,
  }));
  const reschedule = useDataStore((state) => state.reschedule);
  const cancel = useDataStore((state) => state.cancel);
  const [moving, setMoving] = useState(false);
  const [newSlot, setNewSlot] = useState<Slot | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!ready || !now) return <Container className="min-h-[60vh] py-16" aria-busy="true" />;
  if (!appointment) {
    return (
      <Container className="py-16">
        <h1 className="sr-only">{m.findTitle}</h1>
        <EmptyState
          icon={CalendarSearch}
          title={m.notFound}
          description={m.notFoundHint}
          action={
            <Link href={routes.manage} className={buttonClasses({ variant: "secondary" })}>
              {m.findTitle}
            </Link>
          }
        />
      </Container>
    );
  }

  const service = services.find((s) => s.id === appointment.serviceId);
  const person = staff.find((p) => p.id === appointment.staffId);
  const start = new Date(appointment.start);
  const access = manageability(appointment, settings.booking, now);
  const ModeIcon = modeIcon[appointment.mode];

  return (
    <Container className="max-w-3xl animate-page-in py-12 sm:py-16">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-fg">
          {m.title(appointment.code)}
        </h1>
        <StatusBadge status={appointment.status} />
      </div>

      <div className="mt-8 rounded-2xl border border-line bg-surface p-6 shadow-sm">
        <p className="text-2xl font-semibold text-fg">
          {capitalize(formatDate(start, "weekdayLong"))}, {formatDate(start, "time")}
        </p>
        <p className="mt-1 text-fg">
          {service?.name} · {person?.name}
        </p>
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-fg-muted">
          <span className="inline-flex items-center gap-1.5">
            <ModeIcon aria-hidden className="size-4" />
            {copy.modes[appointment.mode]}
          </span>
          {service ? <span>{priceLabel(service)}</span> : null}
          {appointment.mode === "in_person" ? (
            <span>
              {settings.address}, {settings.city}
            </span>
          ) : null}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {service && appointment.status !== "cancelled" ? (
            <Button
              variant="secondary"
              onClick={() =>
                downloadFile(
                  `appuntamento-${appointment.code}.ics`,
                  createIcsEvent({
                    uid: `${appointment.id}@agenda`,
                    start,
                    end: addMinutes(start, service.durationMin),
                    title: `${service.name} · ${settings.name}`,
                    location:
                      appointment.mode === "online"
                        ? copy.modes.online
                        : `${settings.address}, ${settings.postalCode} ${settings.city}`,
                    description: `${copy.booking.code}: ${appointment.code}`,
                  }),
                  "text/calendar;charset=utf-8",
                )
              }
            >
              <CalendarPlus aria-hidden />
              {copy.common.addToCalendar}
            </Button>
          ) : null}
          {access.allowed ? (
            <>
              <Button
                variant="secondary"
                aria-expanded={moving}
                onClick={() => setMoving((v) => !v)}
              >
                {m.reschedule}
              </Button>
              <Button variant="danger-ghost" onClick={() => setConfirmCancel(true)}>
                <CalendarX2 aria-hidden />
                {m.cancel}
              </Button>
            </>
          ) : null}
        </div>

        {!access.allowed ? (
          <p className="mt-5 flex gap-2 rounded-lg bg-surface-2 p-3 text-sm text-fg">
            <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-info" />
            {access.reason === "too_late"
              ? m.tooLate(settings.booking.cancelHours, settings.phone)
              : m.closed}
          </p>
        ) : null}
      </div>

      {moving && service && access.allowed ? (
        <section
          aria-labelledby="move-title"
          className="mt-8 rounded-2xl border border-line bg-surface p-6"
        >
          <h2 id="move-title" className="text-lg font-semibold text-fg">
            {m.rescheduleTitle}
          </h2>
          <div className="mt-5">
            <SlotPicker
              service={service}
              staffId={appointment.staffId}
              now={now}
              value={newSlot?.start.toISOString() ?? null}
              onChange={setNewSlot}
              ignoreAppointmentId={appointment.id}
            />
          </div>
          <div className="mt-6 flex gap-2">
            <Button
              disabled={!newSlot || newSlot.start.getTime() === start.getTime()}
              onClick={() => {
                if (!newSlot) return;
                if (reschedule(appointment.id, newSlot.start.toISOString())) {
                  toast.success(m.rescheduled, {
                    description: `${capitalize(formatDate(newSlot.start, "weekdayLong"))}, ${formatDate(newSlot.start, "time")}`,
                  });
                  setMoving(false);
                  setNewSlot(null);
                } else {
                  toast.error(copy.booking.slotTaken);
                  setNewSlot(null);
                }
              }}
            >
              {copy.common.confirm}
            </Button>
            <Button variant="ghost" onClick={() => setMoving(false)}>
              {copy.common.cancel}
            </Button>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="history-title" className="mt-8">
        <h2 id="history-title" className="text-sm font-semibold text-fg">
          {m.history}
        </h2>
        <ol className="mt-3 space-y-2 text-sm">
          {appointment.history.map((event, i) => (
            <li key={`${event.at}-${i}`} className="flex gap-3">
              <span className="w-36 shrink-0 text-fg-muted tabular-nums">
                {formatDate(event.at, "dateTime")}
              </span>
              <span className="text-fg">
                {m.events[event.action]} {m.by[event.by]}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {appointment.status === "cancelled" ? (
        <Link href={routes.book} className={buttonClasses({ className: "mt-8" })}>
          {m.bookAgain}
        </Link>
      ) : null}

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title={m.cancelTitle}
        description={m.cancelText}
        confirmLabel={m.cancel}
        onConfirm={() => {
          cancel(appointment.id, "customer");
          toast.success(m.cancelled);
        }}
      />
    </Container>
  );
}
