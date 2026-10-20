"use client";

import { Command } from "cmdk";
import { Check, ChevronsUpDown } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { copy } from "@/content/it";
import { fullName } from "@/lib/domain/clients";
import type { Client } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import type { ControlProps } from "@/components/ui/field";
import { controlClasses } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** Selezione del cliente con ricerca (nome, email, telefono). */
export function ClientCombobox({
  clients,
  value,
  onChange,
  controlProps,
}: {
  clients: Client[];
  value: string;
  onChange: (id: string) => void;
  controlProps: ControlProps;
}) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const selected = clients.find((client) => client.id === value);
  const sorted = useMemo(
    () => [...clients].sort((a, b) => fullName(a).localeCompare(fullName(b), "it")),
    [clients],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={controlProps.id}
          name={controlProps.name}
          aria-invalid={controlProps["aria-invalid"]}
          aria-describedby={controlProps["aria-describedby"]}
          role="combobox"
          aria-controls={listId}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            controlClasses,
            "flex h-10 items-center justify-between gap-2 px-3 text-left text-sm sm:h-9",
            !selected && "text-fg-subtle",
          )}
        >
          <span className="truncate">
            {selected ? fullName(selected) : copy.appointments.form.clientPlaceholder}
          </span>
          <ChevronsUpDown aria-hidden className="size-4 shrink-0 text-fg-muted" />
        </button>
      </PopoverTrigger>
      <PopoverContent id={listId} className="w-(--radix-popover-trigger-width) min-w-64">
        <Command loop>
          <Command.Input
            placeholder={copy.appointments.form.clientSearch}
            className="h-11 w-full border-b border-line bg-transparent px-3 text-sm text-fg outline-none placeholder:text-fg-subtle"
          />
          <Command.List className="max-h-64 overflow-y-auto p-1">
            <Command.Empty className="px-3 py-6 text-center text-sm text-fg-muted">
              {copy.appointments.form.clientEmpty}
            </Command.Empty>
            {sorted.map((client) => (
              <Command.Item
                key={client.id}
                value={client.id}
                keywords={[fullName(client), client.email, client.phone]}
                onSelect={() => {
                  onChange(client.id);
                  setOpen(false);
                }}
                className="flex h-10 cursor-default items-center gap-2 rounded-md px-2.5 text-sm text-fg data-[selected=true]:bg-surface-2"
              >
                <Check
                  aria-hidden
                  className={cn(
                    "size-4 shrink-0",
                    client.id === value ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="truncate">{fullName(client)}</span>
                <span className="ml-auto truncate text-xs text-fg-muted">{client.phone}</span>
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
