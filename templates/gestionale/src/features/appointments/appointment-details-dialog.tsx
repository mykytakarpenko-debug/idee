"use client";

import { differenceInMinutes } from "date-fns";
import { CalendarClock, Clock, Euro, MessageSquareText, Pencil, User, Wallet } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useData } from "@/hooks/use-data";
import { fullName } from "@/lib/domain/clients";
import {
  capitalize,
  formatCurrency,
  formatDate,
  formatDuration,
  formatTimeRange,
} from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ColorDot } from "@/components/ui/avatar";
import { DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { AppointmentStatusBadge } from "@/components/status-badges";
import {
  AppointmentActionsMenu,
  statusTransitions,
  useAppointmentActions,
} from "./appointment-actions";

/** Scheda rapida dell'appuntamento (dal calendario). */
export function AppointmentDetailsDialog({ id, onDone }: { id: string; onDone: () => void }) {
  const actions = useAppointmentActions();
  const { appointment, client, service, member, hasPayment } = useData((state) => {
    const appointment = state.appointments.find((a) => a.id === id);
    return {
      appointment,
      client: state.clients.find((c) => c.id === appointment?.clientId),
      service: state.services.find((s) => s.id === appointment?.serviceId),
      member: state.staff.find((m) => m.id === appointment?.staffId),
      hasPayment: state.payments.some((p) => p.appointmentId === id && p.status !== "refunded"),
    };
  });

  if (!appointment) {
    return <DialogContent title={copy.calendar.details}>{null}</DialogContent>;
  }

  const minutes = differenceInMinutes(new Date(appointment.end), new Date(appointment.start));
  const primary = statusTransitions(appointment.status)[0];

  return (
    <DialogContent title={service?.name ?? copy.calendar.details} description={member?.name}>
      <DialogBody>
        <div className="mb-4">
          <AppointmentStatusBadge status={appointment.status} />
        </div>
        <dl className="divide-y divide-line rounded-lg border border-line">
          <Row icon={<User />} label={copy.appointments.form.client}>
            {client ? (
              <Link
                href={routes.client(client.id)}
                onClick={onDone}
                className="font-medium text-accent-text hover:underline"
              >
                {fullName(client)}
              </Link>
            ) : (
              copy.common.deletedClient
            )}
          </Row>
          <Row icon={<CalendarClock />} label={copy.appointments.form.date}>
            {capitalize(formatDate(appointment.start, "weekdayLong"))}
          </Row>
          <Row icon={<Clock />} label={copy.appointments.form.time}>
            {formatTimeRange(appointment.start, appointment.end)} · {formatDuration(minutes)}
          </Row>
          <Row icon={<Euro />} label={copy.appointments.form.price}>
            <span className="tabular-nums">{formatCurrency(appointment.price)}</span>
            {hasPayment ? (
              <span className="ml-2 text-xs text-success">· {copy.appointments.paid}</span>
            ) : null}
          </Row>
          <Row
            icon={member ? <ColorDot color={member.color} className="size-3" /> : <User />}
            label={copy.appointments.form.staff}
          >
            {member?.name ?? copy.common.unknown}
          </Row>
          {appointment.notes ? (
            <Row icon={<MessageSquareText />} label={copy.common.notes}>
              {appointment.notes}
            </Row>
          ) : null}
        </dl>
        <p className="mt-3 text-xs text-fg-muted">{copy.channel[appointment.channel]}</p>
      </DialogBody>
      <DialogFooter className="sm:justify-between">
        <AppointmentActionsMenu
          appointment={appointment}
          hasPayment={hasPayment}
          onDeleted={onDone}
        />
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button
            variant="secondary"
            onClick={() => {
              onDone();
              actions.edit(appointment);
            }}
          >
            <Pencil aria-hidden />
            {copy.common.edit}
          </Button>
          {appointment.status === "completed" && !hasPayment ? (
            <Button
              onClick={() => {
                onDone();
                actions.pay(appointment);
              }}
            >
              <Wallet aria-hidden />
              {copy.appointments.actions.pay}
            </Button>
          ) : primary === "confirmed" || primary === "completed" ? (
            <Button onClick={() => actions.changeStatus(appointment, primary)}>
              {primary === "confirmed"
                ? copy.appointments.actions.confirm
                : copy.appointments.actions.complete}
            </Button>
          ) : null}
        </div>
      </DialogFooter>
    </DialogContent>
  );
}

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 px-3.5 py-3 text-sm">
      <span
        aria-hidden
        className="mt-0.5 flex size-4 items-center justify-center text-fg-muted [&_svg]:size-4"
      >
        {icon}
      </span>
      <dt className="w-24 shrink-0 text-fg-muted">{label}</dt>
      <dd className="min-w-0 flex-1 text-fg">{children}</dd>
    </div>
  );
}
