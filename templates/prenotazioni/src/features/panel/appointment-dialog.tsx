"use client";

import { Ban, Check, CircleCheck, Mail, Phone, UserX, X } from "lucide-react";
import { useState } from "react";
import { copy } from "@/content/it";
import { useData } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { capitalize, formatDate, formatTimeRange } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { modeIcon, priceLabel } from "@/features/site/booking-wizard";
import { useAppointmentActions } from "./appointment-actions";

const a = copy.agenda;

export function AppointmentDialog({ id, onDone }: { id: string; onDone: () => void }) {
  const now = useNow();
  const { appointment, services, staff } = useData((state) => ({
    appointment: state.appointments.find((x) => x.id === id),
    services: state.services,
    staff: state.staff,
  }));
  const actions = useAppointmentActions();
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!appointment) return <DialogContent title={a.title}>{null}</DialogContent>;
  const service = services.find((s) => s.id === appointment.serviceId);
  const person = staff.find((p) => p.id === appointment.staffId);
  const ModeIcon = modeIcon[appointment.mode];
  const past = now !== null && new Date(appointment.end).getTime() <= now.getTime();
  const open = appointment.status === "pending" || appointment.status === "confirmed";

  return (
    <DialogContent
      title={appointment.customer.name}
      description={`${capitalize(formatDate(appointment.start, "weekdayLong"))} · ${formatTimeRange(appointment.start, appointment.end)}`}
    >
      <DialogBody className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={appointment.status} />
          <span className="inline-flex items-center gap-1.5 text-sm text-fg-muted">
            <ModeIcon aria-hidden className="size-4" />
            {copy.modes[appointment.mode]}
          </span>
          <span className="font-mono text-xs text-fg-muted">{appointment.code}</span>
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-fg-muted">{copy.booking.summaryService}</dt>
            <dd className="mt-0.5 text-fg">
              {service?.name} · {service ? priceLabel(service) : ""}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-fg-muted">{copy.booking.summaryWith}</dt>
            <dd className="mt-0.5 text-fg">{person?.name}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-fg-muted">{a.contact}</dt>
            <dd className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
              <a
                href={`mailto:${appointment.customer.email}`}
                className="inline-flex min-h-7 items-center gap-1.5 text-accent-text hover:underline"
              >
                <Mail aria-hidden className="size-4" />
                {appointment.customer.email}
              </a>
              <a
                href={`tel:${appointment.customer.phone.replace(/\s/g, "")}`}
                className="inline-flex min-h-7 items-center gap-1.5 text-accent-text hover:underline"
              >
                <Phone aria-hidden className="size-4" />
                {appointment.customer.phone}
              </a>
            </dd>
          </div>
          {appointment.notes ? (
            <div className="sm:col-span-2">
              <dt className="text-xs text-fg-muted">{a.notes}</dt>
              <dd className="mt-0.5 rounded-lg bg-surface-2 p-3 text-fg">{appointment.notes}</dd>
            </div>
          ) : null}
        </dl>
        <section aria-labelledby="appointment-history">
          <h3 id="appointment-history" className="text-[13px] font-medium text-fg-muted">
            {copy.manage.history}
          </h3>
          <ol className="mt-2 space-y-1 text-sm">
            {appointment.history.map((event, i) => (
              <li key={`${event.at}-${i}`} className="flex gap-3">
                <span className="w-36 shrink-0 text-fg-muted tabular-nums">
                  {formatDate(event.at, "dateTime")}
                </span>
                <span className="text-fg">
                  {copy.manage.events[event.action]} · {copy.sources[appointment.source]}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </DialogBody>
      <DialogFooter className="flex-wrap sm:justify-between">
        {open && !past ? (
          <Button variant="danger-ghost" onClick={() => setConfirmCancel(true)}>
            <Ban aria-hidden />
            {appointment.status === "pending" ? a.actions.decline : a.actions.cancel}
          </Button>
        ) : (
          <span />
        )}
        <div className="flex flex-wrap gap-2">
          {appointment.status === "pending" ? (
            <Button
              onClick={() => {
                actions.confirm(appointment);
                onDone();
              }}
            >
              <CircleCheck aria-hidden />
              {a.actions.confirm}
            </Button>
          ) : null}
          {appointment.status === "confirmed" && past ? (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  actions.mark(appointment, "no_show");
                  onDone();
                }}
              >
                <UserX aria-hidden />
                {a.actions.noShow}
              </Button>
              <Button
                onClick={() => {
                  actions.mark(appointment, "completed");
                  onDone();
                }}
              >
                <Check aria-hidden />
                {a.actions.complete}
              </Button>
            </>
          ) : null}
          {!open || (appointment.status === "confirmed" && !past) ? (
            <Button variant="secondary" onClick={onDone}>
              <X aria-hidden />
              {copy.common.close}
            </Button>
          ) : null}
        </div>
      </DialogFooter>
      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title={copy.manage.cancelTitle}
        description={copy.manage.cancelText}
        confirmLabel={appointment.status === "pending" ? a.actions.decline : a.actions.cancel}
        onConfirm={() => {
          if (appointment.status === "pending") actions.decline(appointment);
          else actions.cancel(appointment);
          onDone();
        }}
      />
    </DialogContent>
  );
}
