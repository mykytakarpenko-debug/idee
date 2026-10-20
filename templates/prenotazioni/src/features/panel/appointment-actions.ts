"use client";

import { copy } from "@/content/it";
import type { Appointment, AppointmentStatus } from "@/lib/domain/types";
import { useDataStore } from "@/store/data-store";
import { toast } from "@/components/ui/toast";

const a = copy.agenda;

/** Azioni sullo stato di un appuntamento, con toast e annullamento dove ha senso. */
export function useAppointmentActions() {
  const confirm = useDataStore((state) => state.confirm);
  const cancel = useDataStore((state) => state.cancel);
  const setStatus = useDataStore((state) => state.setStatus);

  return {
    confirm(appointment: Appointment) {
      confirm(appointment.id);
      toast.success(a.confirmed, { description: appointment.customer.name });
    },
    decline(appointment: Appointment) {
      cancel(appointment.id, "business");
      toast.success(a.declined, { description: appointment.customer.name });
    },
    cancel(appointment: Appointment) {
      cancel(appointment.id, "business");
      toast.success(a.cancelled, { description: appointment.customer.name });
    },
    mark(appointment: Appointment, status: Extract<AppointmentStatus, "completed" | "no_show">) {
      const previous = appointment.status;
      setStatus(appointment.id, status);
      toast.success(a.updated(copy.status[status]), {
        description: appointment.customer.name,
        action: { label: copy.common.cancel, onClick: () => setStatus(appointment.id, previous) },
      });
    },
  };
}
