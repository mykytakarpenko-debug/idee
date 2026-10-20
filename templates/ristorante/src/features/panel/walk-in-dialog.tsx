"use client";

import { useState } from "react";
import { copy } from "@/content/it";
import { useDataStore } from "@/store/data-store";
import { Button } from "@/components/ui/button";
import { DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

/** Fa accomodare clienti senza prenotazione a un tavolo libero. */
export function WalkInDialog({ tableId, onDone }: { tableId: string; onDone: () => void }) {
  const table = useDataStore((state) => state.tables.find((t) => t.id === tableId));
  const seatWalkIn = useDataStore((state) => state.seatWalkIn);
  const [party, setParty] = useState(String(Math.min(2, table?.seats ?? 2)));
  const [name, setName] = useState("");
  if (!table) return null;
  const size = Number.parseInt(party, 10);
  const valid = Number.isFinite(size) && size >= 1 && size <= table.seats;

  return (
    <DialogContent title={copy.floor.walkInTitle(table.name)} size="sm">
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (!valid) return;
          seatWalkIn(table.id, size, name.trim());
          toast.success(copy.floor.walkInDone, {
            description: `${copy.reservations.table} ${table.name}`,
          });
          onDone();
        }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <DialogBody className="grid gap-4">
          <Field
            label={copy.floor.walkInParty}
            name="party"
            error={valid ? undefined : copy.validation.party(table.seats)}
            hint={copy.floor.seats(table.seats)}
          >
            {(props) => (
              <Input
                {...props}
                type="number"
                inputMode="numeric"
                min={1}
                max={table.seats}
                value={party}
                onChange={(e) => setParty(e.target.value)}
              />
            )}
          </Field>
          <Field label={copy.floor.walkInName} name="name" optional>
            {(props) => <Input {...props} value={name} onChange={(e) => setName(e.target.value)} />}
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={onDone}>
            {copy.common.cancel}
          </Button>
          <Button type="submit" disabled={!valid}>
            {copy.panel.walkIn}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
