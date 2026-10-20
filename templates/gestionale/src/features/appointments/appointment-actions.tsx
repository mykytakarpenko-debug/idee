"use client";

import {
  Ban,
  CalendarCheck,
  Check,
  Ellipsis,
  Pencil,
  RotateCcw,
  Trash2,
  User,
  UserX,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import type { Appointment, AppointmentStatus } from "@/lib/domain/types";
import { useDataStore } from "@/store/data-store";
import { openDialog } from "@/store/ui-store";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";

const a = copy.appointments.actions;

/** Azioni sugli appuntamenti, condivise da elenco, calendario e scheda cliente. */
export function useAppointmentActions() {
  const setStatus = useDataStore((state) => state.setAppointmentStatus);
  const deleteAppointment = useDataStore((state) => state.deleteAppointment);

  return {
    changeStatus(appointment: Appointment, status: AppointmentStatus) {
      setStatus(appointment.id, status);
      toast.success(copy.appointments.statusChanged(copy.status.appointment[status]), {
        action: {
          label: copy.common.cancel,
          onClick: () => setStatus(appointment.id, appointment.status),
        },
      });
    },
    pay(appointment: Appointment) {
      openDialog({
        type: "payment",
        defaults: { clientId: appointment.clientId, appointmentId: appointment.id },
      });
    },
    edit(appointment: Appointment) {
      openDialog({ type: "appointment", id: appointment.id });
    },
    remove(appointment: Appointment) {
      deleteAppointment(appointment.id);
      toast.success(copy.appointments.delete.done);
    },
  };
}

/** Transizioni di stato disponibili a partire da quello attuale. */
export function statusTransitions(status: AppointmentStatus): AppointmentStatus[] {
  switch (status) {
    case "pending":
      return ["confirmed", "completed", "no_show", "cancelled"];
    case "confirmed":
      return ["completed", "no_show", "cancelled"];
    case "cancelled":
    case "no_show":
      return ["confirmed"];
    case "completed":
      return [];
  }
}

const transitionMeta: Record<AppointmentStatus, { label: string; icon: typeof Check }> = {
  confirmed: { label: a.confirm, icon: CalendarCheck },
  completed: { label: a.complete, icon: Check },
  no_show: { label: a.noShow, icon: UserX },
  cancelled: { label: a.cancel, icon: Ban },
  pending: { label: a.reopen, icon: RotateCcw },
};

export function AppointmentActionsMenu({
  appointment,
  hasPayment,
  showClientLink = true,
  onDeleted,
}: {
  appointment: Appointment;
  hasPayment: boolean;
  showClientLink?: boolean;
  /** Chiamato dopo l'eliminazione (es. per chiudere una modale). */
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const actions = useAppointmentActions();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const transitions = statusTransitions(appointment.status);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={copy.common.moreActions}>
            <Ellipsis aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-60">
          {transitions.map((status) => {
            const meta =
              status === "confirmed" && appointment.status !== "pending"
                ? transitionMeta.pending
                : transitionMeta[status];
            const Icon = meta.icon;
            return (
              <DropdownMenuItem
                key={status}
                onSelect={() => actions.changeStatus(appointment, status)}
              >
                <Icon aria-hidden />
                {meta.label}
              </DropdownMenuItem>
            );
          })}
          {appointment.status === "completed" && !hasPayment ? (
            <DropdownMenuItem onSelect={() => actions.pay(appointment)}>
              <Wallet aria-hidden />
              {a.pay}
            </DropdownMenuItem>
          ) : null}
          {transitions.length > 0 || (appointment.status === "completed" && !hasPayment) ? (
            <DropdownMenuSeparator />
          ) : null}
          <DropdownMenuItem onSelect={() => actions.edit(appointment)}>
            <Pencil aria-hidden />
            {a.edit}
          </DropdownMenuItem>
          {showClientLink ? (
            <DropdownMenuItem onSelect={() => router.push(routes.client(appointment.clientId))}>
              <User aria-hidden />
              {a.viewClient}
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem tone="danger" onSelect={() => setConfirmOpen(true)}>
            <Trash2 aria-hidden />
            {a.delete}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={copy.appointments.delete.title}
        description={copy.appointments.delete.description}
        confirmLabel={copy.appointments.delete.confirm}
        onConfirm={() => {
          actions.remove(appointment);
          onDeleted?.();
        }}
      />
    </>
  );
}
