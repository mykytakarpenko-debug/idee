"use client";

import { useUiStore } from "@/store/ui-store";
import { Dialog } from "@/components/ui/dialog";
import { AppointmentDialog } from "@/features/panel/appointment-dialog";
import { ServiceFormDialog } from "@/features/panel/service-form-dialog";

/** Modali globali del pannello, apribili ovunque con openDialog(...). */
export function PanelDialogs() {
  const dialog = useUiStore((state) => state.dialog);
  const open = useUiStore((state) => state.dialogOpen);
  const key = useUiStore((state) => state.dialogKey);
  const close = useUiStore((state) => state.closeDialog);
  if (!dialog) return null;
  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      {dialog.type === "appointment" ? (
        <AppointmentDialog key={key} id={dialog.id} onDone={close} />
      ) : null}
      {dialog.type === "service" ? (
        <ServiceFormDialog key={key} id={dialog.id} onDone={close} />
      ) : null}
    </Dialog>
  );
}
