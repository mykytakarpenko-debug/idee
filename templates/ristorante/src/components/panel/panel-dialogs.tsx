"use client";

import { useUiStore } from "@/store/ui-store";
import { Dialog } from "@/components/ui/dialog";
import { DishFormDialog } from "@/features/panel/dish-form-dialog";
import { OrderDetailsDialog } from "@/features/panel/order-details-dialog";
import { ReservationFormDialog } from "@/features/panel/reservation-form-dialog";
import { WalkInDialog } from "@/features/panel/walk-in-dialog";

/** Modali globali del pannello, apribili ovunque con openDialog(...). */
export function PanelDialogs() {
  const dialog = useUiStore((state) => state.dialog);
  const open = useUiStore((state) => state.dialogOpen);
  const key = useUiStore((state) => state.dialogKey);
  const close = useUiStore((state) => state.closeDialog);
  if (!dialog) return null;
  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      {dialog.type === "reservation" ? (
        <ReservationFormDialog key={key} id={dialog.id} defaults={dialog.defaults} onDone={close} />
      ) : null}
      {dialog.type === "dish" ? <DishFormDialog key={key} id={dialog.id} onDone={close} /> : null}
      {dialog.type === "walk-in" ? (
        <WalkInDialog key={key} tableId={dialog.tableId} onDone={close} />
      ) : null}
      {dialog.type === "order" ? (
        <OrderDetailsDialog key={key} id={dialog.id} onDone={close} />
      ) : null}
    </Dialog>
  );
}
