"use client";

import { addMinutes } from "date-fns";
import { copy } from "@/content/it";
import { useData } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { useZodForm } from "@/hooks/use-zod-form";
import { assignTable, freeTables, reservationCode } from "@/lib/domain/booking";
import { combineDateAndTime } from "@/lib/domain/hours";
import { reservationFormSchema, type ReservationFormValues } from "@/lib/domain/schemas";
import type { Reservation } from "@/lib/domain/types";
import { formatDate } from "@/lib/format";
import { useDataStore } from "@/store/data-store";
import type { DialogRequest } from "@/store/ui-store";
import { Button } from "@/components/ui/button";
import { DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

const f = copy.reservations.form;
type Defaults = Extract<DialogRequest, { type: "reservation" }>["defaults"];

export function ReservationFormDialog({
  id,
  defaults,
  onDone,
}: {
  id?: string;
  defaults?: Defaults;
  onDone: () => void;
}) {
  const now = useNow();
  const { reservation, reservations, tables, settings } = useData((state) => ({
    reservation: id ? state.reservations.find((r) => r.id === id) : undefined,
    reservations: state.reservations,
    tables: state.tables,
    settings: state.settings,
  }));
  const createReservation = useDataStore((state) => state.createReservation);
  const updateReservation = useDataStore((state) => state.updateReservation);
  const form = useZodForm(reservationFormSchema, initialValues(reservation, defaults, now));
  const { values, errors, text } = form;

  const start =
    /^\d{4}-\d{2}-\d{2}$/.test(values.date) && /^\d{2}:\d{2}$/.test(values.time)
      ? combineDateAndTime(values.date, values.time)
      : null;
  const party = Number.parseInt(values.partySize, 10) || 1;
  const free = new Set(
    start
      ? freeTables(
          tables,
          reservations,
          start,
          settings.booking.durationMin,
          party,
          reservation?.id,
        ).map((t) => t.id)
      : [],
  );

  const onSubmit = form.handleSubmit((data) => {
    const startDate = combineDateAndTime(data.date, data.time);
    const table = data.tableId
      ? (tables.find((t) => t.id === data.tableId) ?? null)
      : assignTable(
          tables,
          reservations.filter((r) => r.id !== reservation?.id),
          startDate,
          settings.booking.durationMin,
          data.partySize,
        );
    if (!table) toast.warning(f.noTableAvailable);
    const input = {
      name: data.name,
      phone: data.phone,
      email: data.email,
      partySize: data.partySize,
      start: startDate.toISOString(),
      tableId: table?.id ?? null,
      source: data.source,
      notes: data.notes || undefined,
    };
    if (reservation) {
      updateReservation(reservation.id, input);
      toast.success(f.updated);
    } else {
      createReservation({
        ...input,
        code: reservationCode("TV", Math.random),
        durationMin: settings.booking.durationMin,
        status: "confirmed",
        marketingConsent: false,
      });
      toast.success(f.created, {
        description: `${data.name} · ${formatDate(startDate, "weekdayShort")} ${data.time}`,
      });
    }
    onDone();
  });

  return (
    <DialogContent title={reservation ? f.editTitle : f.title} size="lg">
      <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <DialogBody className="grid gap-4 sm:grid-cols-6">
          <Field label={f.name} name="name" error={errors.name} className="sm:col-span-6">
            {(props) => <Input {...props} {...text("name")} autoComplete="off" />}
          </Field>
          <Field label={f.phone} name="phone" error={errors.phone} className="sm:col-span-3">
            {(props) => <Input {...props} {...text("phone")} type="tel" inputMode="tel" />}
          </Field>
          <Field
            label={f.email}
            name="email"
            error={errors.email}
            optional
            className="sm:col-span-3"
          >
            {(props) => <Input {...props} {...text("email")} type="email" />}
          </Field>
          <Field
            label={f.party}
            name="partySize"
            error={errors.partySize}
            className="sm:col-span-2"
          >
            {(props) => (
              <Input
                {...props}
                {...text("partySize")}
                type="number"
                inputMode="numeric"
                min={1}
                max={30}
              />
            )}
          </Field>
          <Field label={f.date} name="date" error={errors.date} className="sm:col-span-2">
            {(props) => <Input {...props} {...text("date")} type="date" />}
          </Field>
          <Field label={f.time} name="time" error={errors.time} className="sm:col-span-2">
            {(props) => (
              <Input
                {...props}
                {...text("time")}
                type="time"
                step={settings.booking.slotMinutes * 60}
              />
            )}
          </Field>
          <Field label={f.table} name="tableId" error={errors.tableId} className="sm:col-span-3">
            {(props) => (
              <Select {...props} {...text("tableId")}>
                <option value="">{f.autoTable}</option>
                {tables.map((table) => (
                  <option
                    key={table.id}
                    value={table.id}
                    disabled={!free.has(table.id) && table.id !== reservation?.tableId}
                  >
                    {copy.reservations.table} {table.name} · {copy.floor.seats(table.seats)} ·{" "}
                    {copy.zones[table.zone]}
                    {!free.has(table.id) && table.id !== reservation?.tableId ? " · —" : ""}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={f.source} name="source" error={errors.source} className="sm:col-span-3">
            {(props) => (
              <Select {...props} {...text("source")}>
                {(["phone", "online", "walk_in"] as const).map((source) => (
                  <option key={source} value={source}>
                    {copy.source[source]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field
            label={f.notes}
            name="notes"
            error={errors.notes}
            optional
            className="sm:col-span-6"
          >
            {(props) => <Textarea {...props} {...text("notes")} rows={2} />}
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={onDone}>
            {copy.common.cancel}
          </Button>
          <Button type="submit">{reservation ? copy.common.saveChanges : f.title}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function initialValues(
  reservation: Reservation | undefined,
  defaults: Defaults,
  now: Date | null,
): ReservationFormValues {
  if (reservation) {
    const start = new Date(reservation.start);
    return {
      name: reservation.name,
      phone: reservation.phone,
      email: reservation.email,
      partySize: String(reservation.partySize),
      date: formatDate(start, "inputDate"),
      time: formatDate(start, "time"),
      tableId: reservation.tableId ?? "",
      source: reservation.source,
      notes: reservation.notes ?? "",
    };
  }
  const base = now ? addMinutes(now, 60) : null;
  return {
    name: "",
    phone: "",
    email: "",
    partySize: "2",
    date: defaults?.date ?? (base ? formatDate(base, "inputDate") : ""),
    time: defaults?.time ?? "20:00",
    tableId: defaults?.tableId ?? "",
    source: "phone",
    notes: "",
  };
}
