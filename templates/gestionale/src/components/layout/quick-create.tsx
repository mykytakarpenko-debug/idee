"use client";

import { CalendarPlus, Layers, Plus, UserPlus, Wallet } from "lucide-react";
import { copy } from "@/content/it";
import { openDialog } from "@/store/ui-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Menu "Nuovo": crea qualsiasi elemento da qualunque pagina. */
export function QuickCreate() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="md"
          className="max-sm:size-10 max-sm:px-0"
          aria-label={copy.topbar.quickCreate}
        >
          <Plus aria-hidden />
          <span className="max-sm:sr-only">{copy.topbar.quickCreate}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuItem onSelect={() => openDialog({ type: "appointment" })}>
          <CalendarPlus aria-hidden />
          {copy.topbar.newAppointment}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => openDialog({ type: "client" })}>
          <UserPlus aria-hidden />
          {copy.topbar.newClient}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => openDialog({ type: "payment" })}>
          <Wallet aria-hidden />
          {copy.topbar.newPayment}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => openDialog({ type: "service" })}>
          <Layers aria-hidden />
          {copy.topbar.newService}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
