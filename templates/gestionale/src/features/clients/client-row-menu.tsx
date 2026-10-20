"use client";

import { CalendarPlus, Ellipsis, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { copy } from "@/content/it";
import { fullName } from "@/lib/domain/clients";
import type { Client } from "@/lib/domain/types";
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

/** Azioni sul cliente: modifica, prenotazione, eliminazione con conferma. */
export function ClientRowMenu({ client, onDeleted }: { client: Client; onDeleted?: () => void }) {
  const deleteClient = useDataStore((state) => state.deleteClient);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative z-10"
            aria-label={`${copy.common.moreActions}: ${fullName(client)}`}
          >
            <Ellipsis aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuItem
            onSelect={() => openDialog({ type: "appointment", defaults: { clientId: client.id } })}
          >
            <CalendarPlus aria-hidden />
            {copy.topbar.newAppointment}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => openDialog({ type: "client", id: client.id })}>
            <Pencil aria-hidden />
            {copy.common.edit}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem tone="danger" onSelect={() => setConfirmOpen(true)}>
            <Trash2 aria-hidden />
            {copy.common.delete}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={copy.clients.delete.title}
        description={copy.clients.delete.description(fullName(client))}
        confirmLabel={copy.clients.delete.confirm}
        onConfirm={() => {
          deleteClient(client.id);
          toast.success(copy.clients.delete.done);
          onDeleted?.();
        }}
      />
    </>
  );
}
