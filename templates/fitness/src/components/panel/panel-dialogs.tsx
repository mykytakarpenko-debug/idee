"use client";

import { useUiStore } from "@/store/ui-store";
import { Dialog } from "@/components/ui/dialog";
import { MemberDetailDialog } from "@/features/panel/member-detail-dialog";
import { MemberFormDialog } from "@/features/panel/member-form-dialog";
import { PlanFormDialog } from "@/features/panel/plan-form-dialog";
import { SessionDialog } from "@/features/panel/session-dialog";

/** Modali globali del pannello, apribili ovunque con openDialog(...). */
export function PanelDialogs() {
  const dialog = useUiStore((state) => state.dialog);
  const open = useUiStore((state) => state.dialogOpen);
  const key = useUiStore((state) => state.dialogKey);
  const close = useUiStore((state) => state.closeDialog);
  if (!dialog) return null;
  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      {dialog.type === "member" ? (
        <MemberFormDialog key={key} id={dialog.id} onDone={close} />
      ) : null}
      {dialog.type === "member-detail" ? (
        <MemberDetailDialog key={key} id={dialog.id} onDone={close} />
      ) : null}
      {dialog.type === "session" ? <SessionDialog key={key} id={dialog.id} onDone={close} /> : null}
      {dialog.type === "plan" ? <PlanFormDialog key={key} id={dialog.id} onDone={close} /> : null}
    </Dialog>
  );
}
