"use client";

import { useUiStore } from "@/store/ui-store";
import { Dialog } from "@/components/ui/dialog";
import { CustomerDialog } from "@/features/panel/customer-dialog";
import { OrderDialog } from "@/features/panel/order-dialog";
import { ProductFormDialog } from "@/features/panel/product-form-dialog";

/** Modali globali del pannello, apribili ovunque con openDialog(...). */
export function PanelDialogs() {
  const dialog = useUiStore((state) => state.dialog);
  const open = useUiStore((state) => state.dialogOpen);
  const key = useUiStore((state) => state.dialogKey);
  const close = useUiStore((state) => state.closeDialog);
  if (!dialog) return null;
  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      {dialog.type === "order" ? <OrderDialog key={key} id={dialog.id} onDone={close} /> : null}
      {dialog.type === "product" ? (
        <ProductFormDialog key={key} id={dialog.id} onDone={close} />
      ) : null}
      {dialog.type === "customer" ? (
        <CustomerDialog key={key} id={dialog.id} onDone={close} />
      ) : null}
    </Dialog>
  );
}
