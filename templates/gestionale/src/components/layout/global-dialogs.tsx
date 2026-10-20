"use client";

import { useUiStore } from "@/store/ui-store";
import { Dialog } from "@/components/ui/dialog";
import { AppointmentDetailsDialog } from "@/features/appointments/appointment-details-dialog";
import { AppointmentFormDialog } from "@/features/appointments/appointment-form-dialog";
import { ClientFormDialog } from "@/features/clients/client-form-dialog";
import { PaymentFormDialog } from "@/features/payments/payment-form-dialog";
import { ServiceFormDialog } from "@/features/services/service-form-dialog";
import { StaffFormDialog } from "@/features/settings/staff-form-dialog";

/**
 * Modali globali: un solo punto di montaggio per i moduli di creazione e
 * modifica, apribili da qualsiasi pagina con `openDialog(...)`.
 */
export function GlobalDialogs() {
  const dialog = useUiStore((state) => state.dialog);
  const open = useUiStore((state) => state.dialogOpen);
  const dialogKey = useUiStore((state) => state.dialogKey);
  const closeDialog = useUiStore((state) => state.closeDialog);

  if (!dialog) return null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && closeDialog()}>
      {dialog.type === "client" ? (
        <ClientFormDialog key={dialogKey} id={dialog.id} onDone={closeDialog} />
      ) : null}
      {dialog.type === "service" ? (
        <ServiceFormDialog key={dialogKey} id={dialog.id} onDone={closeDialog} />
      ) : null}
      {dialog.type === "appointment" ? (
        <AppointmentFormDialog
          key={dialogKey}
          id={dialog.id}
          defaults={dialog.defaults}
          onDone={closeDialog}
        />
      ) : null}
      {dialog.type === "appointment-details" ? (
        <AppointmentDetailsDialog key={dialogKey} id={dialog.id} onDone={closeDialog} />
      ) : null}
      {dialog.type === "payment" ? (
        <PaymentFormDialog
          key={dialogKey}
          id={dialog.id}
          defaults={dialog.defaults}
          onDone={closeDialog}
        />
      ) : null}
      {dialog.type === "staff" ? (
        <StaffFormDialog key={dialogKey} id={dialog.id} onDone={closeDialog} />
      ) : null}
    </Dialog>
  );
}
