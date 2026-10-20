"use client";

import { addMinutes, differenceInMinutes } from "date-fns";
import { TriangleAlert } from "lucide-react";
import { useState } from "react";
import { copy } from "@/content/it";
import { useData } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { useZodForm } from "@/hooks/use-zod-form";
import { fullName } from "@/lib/domain/clients";
import { appointmentFormSchema, type AppointmentFormValues } from "@/lib/domain/schemas";
import {
  checkOpeningHours,
  combineDateAndTime,
  findConflicts,
  nextSlotStart,
} from "@/lib/domain/scheduling";
import type { Appointment, AppointmentStatus, BookingChannel } from "@/lib/domain/types";
import { centsToInput, formatDate, formatTimeRange } from "@/lib/format";
import { useDataStore } from "@/store/data-store";
import type { DialogRequest } from "@/store/ui-store";
import { Button } from "@/components/ui/button";
import { DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { ClientCombobox } from "@/features/clients/client-combobox";

const t = copy.appointments.form;
const STATUSES: AppointmentStatus[] = ["pending", "confirmed", "completed", "cancelled", "no_show"];
const CHANNELS: BookingChannel[] = ["staff", "phone", "online", "walk_in"];

type Defaults = Extract<DialogRequest, { type: "appointment" }>["defaults"];

export function AppointmentFormDialog({
  id,
  defaults,
  onDone,
}: {
  id?: string;
  defaults?: Defaults;
  onDone: () => void;
}) {
  const now = useNow();
  const { appointment, appointments, clients, services, staff, settings } = useData((state) => ({
    appointment: id ? state.appointments.find((a) => a.id === id) : undefined,
    appointments: state.appointments,
    clients: state.clients,
    services: state.services,
    staff: state.staff,
    settings: state.settings,
  }));
  const createAppointment = useDataStore((state) => state.createAppointment);
  const updateAppointment = useDataStore((state) => state.updateAppointment);

  const form = useZodForm(
    appointmentFormSchema,
    initialValues(appointment, defaults, now, settings.slotMinutes, services),
  );
  const { values, errors, text, setValue } = form;
  const [acknowledgedKey, setAcknowledgedKey] = useState<string | null>(null);

  // --- Avvisi in tempo reale: sovrapposizioni e orari di apertura -------------
  const start =
    /^\d{4}-\d{2}-\d{2}$/.test(values.date) && /^\d{2}:\d{2}$/.test(values.time)
      ? combineDateAndTime(values.date, values.time)
      : null;
  const duration = Number.parseInt(values.durationMin, 10);
  const end = start && duration > 0 ? addMinutes(start, duration) : null;
  const blocking = values.status !== "cancelled";
  const conflicts =
    blocking && start && end && values.staffId
      ? findConflicts(appointments, {
          staffId: values.staffId,
          start,
          end,
          ignoreId: appointment?.id,
        })
      : [];
  const hours = blocking && start && end ? checkOpeningHours(settings.hours, start, end) : "ok";
  const warnings: string[] = [];
  for (const conflict of conflicts) {
    const who = staff.find((member) => member.id === conflict.staffId)?.name ?? "";
    const client = clients.find((c) => c.id === conflict.clientId);
    warnings.push(
      t.conflict(
        who,
        `${formatTimeRange(conflict.start, conflict.end)}${client ? ` (${fullName(client)})` : ""}`,
      ),
    );
  }
  if (hours === "closed") warnings.push(t.closedDay);
  if (hours === "outside") warnings.push(t.outsideHours);
  const warningKey =
    warnings.length > 0 ? `${conflicts.map((c) => c.id).join(",")}|${hours}` : null;
  const acknowledged = warningKey !== null && warningKey === acknowledgedKey;

  const activeStaff = staff.filter((member) => member.active || member.id === values.staffId);
  const selectableServices = services.filter((s) => s.active || s.id === values.serviceId);
  const categories = [...new Set(selectableServices.map((s) => s.category))];

  const onSubmit = form.handleSubmit((data) => {
    if (warningKey && !acknowledged) {
      setAcknowledgedKey(warningKey);
      return;
    }
    const startDate = combineDateAndTime(data.date, data.time);
    const input = {
      clientId: data.clientId,
      serviceId: data.serviceId,
      staffId: data.staffId,
      start: startDate.toISOString(),
      end: addMinutes(startDate, data.durationMin).toISOString(),
      status: data.status,
      price: data.price,
      channel: data.channel,
      notes: data.notes || undefined,
    };
    if (appointment) {
      updateAppointment(appointment.id, input);
      toast.success(t.updated);
    } else {
      createAppointment(input);
      toast.success(t.created, {
        description: `${formatDate(startDate, "weekdayLong")}, ${formatTimeRange(input.start, input.end)}`,
      });
    }
    onDone();
  });

  return (
    <DialogContent title={appointment ? t.editTitle : t.createTitle} size="lg">
      <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <DialogBody className="grid gap-4 sm:grid-cols-6">
          <Field label={t.client} name="clientId" error={errors.clientId} className="sm:col-span-6">
            {(props) => (
              <ClientCombobox
                clients={clients}
                value={values.clientId}
                onChange={(clientId) => setValue("clientId", clientId)}
                controlProps={props}
              />
            )}
          </Field>

          <Field
            label={t.service}
            name="serviceId"
            error={errors.serviceId}
            className="sm:col-span-3"
          >
            {(props) => (
              <Select
                {...props}
                value={values.serviceId}
                onChange={(event) => {
                  const service = services.find((s) => s.id === event.target.value);
                  setValue("serviceId", event.target.value);
                  if (service) {
                    setValue("durationMin", String(service.durationMin));
                    setValue("price", centsToInput(service.price));
                  }
                }}
              >
                <option value="">{t.servicePlaceholder}</option>
                {categories.map((category) => (
                  <optgroup key={category} label={category}>
                    {selectableServices
                      .filter((s) => s.category === category)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </Select>
            )}
          </Field>

          <Field label={t.staff} name="staffId" error={errors.staffId} className="sm:col-span-3">
            {(props) => (
              <Select {...props} {...text("staffId")}>
                <option value="">{t.staffPlaceholder}</option>
                {activeStaff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label={t.date} name="date" error={errors.date} className="sm:col-span-2">
            {(props) => <Input {...props} {...text("date")} type="date" />}
          </Field>
          <Field label={t.time} name="time" error={errors.time} className="sm:col-span-2">
            {(props) => (
              <Input {...props} {...text("time")} type="time" step={settings.slotMinutes * 60} />
            )}
          </Field>
          <Field
            label={t.duration}
            name="durationMin"
            error={errors.durationMin}
            className="sm:col-span-2"
          >
            {(props) => (
              <Input
                {...props}
                {...text("durationMin")}
                type="number"
                inputMode="numeric"
                min={5}
                max={600}
                step={5}
              />
            )}
          </Field>

          <Field label={t.price} name="price" error={errors.price} className="sm:col-span-2">
            {(props) => (
              <Input {...props} {...text("price")} inputMode="decimal" placeholder="0,00" />
            )}
          </Field>
          <Field label={t.status} name="status" error={errors.status} className="sm:col-span-2">
            {(props) => (
              <Select {...props} {...text("status")}>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {copy.status.appointment[status]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={t.channel} name="channel" error={errors.channel} className="sm:col-span-2">
            {(props) => (
              <Select {...props} {...text("channel")}>
                {CHANNELS.map((channel) => (
                  <option key={channel} value={channel}>
                    {copy.channel[channel]}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field
            label={t.notes}
            name="notes"
            error={errors.notes}
            hint={t.notesHint}
            optional
            className="sm:col-span-6"
          >
            {(props) => <Textarea {...props} {...text("notes")} rows={2} />}
          </Field>

          {warnings.length > 0 ? (
            <div
              role="alert"
              className="flex gap-3 rounded-lg border border-warning/30 bg-warning-soft p-3.5 text-[13px] text-fg sm:col-span-6"
            >
              <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
              <div>
                <p className="font-semibold">{t.conflictTitle}</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={onDone}>
            {copy.common.cancel}
          </Button>
          <Button type="submit" variant={warningKey && acknowledged ? "danger" : "primary"}>
            {warningKey && acknowledged
              ? t.saveAnyway
              : appointment
                ? copy.common.saveChanges
                : copy.appointments.new}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function initialValues(
  appointment: Appointment | undefined,
  defaults: Defaults,
  now: Date | null,
  slotMinutes: number,
  services: { id: string; durationMin: number; price: number }[],
): AppointmentFormValues {
  if (appointment) {
    const start = new Date(appointment.start);
    return {
      clientId: appointment.clientId,
      serviceId: appointment.serviceId,
      staffId: appointment.staffId,
      date: formatDate(start, "inputDate"),
      time: formatDate(start, "time"),
      durationMin: String(differenceInMinutes(new Date(appointment.end), start)),
      price: centsToInput(appointment.price),
      status: appointment.status,
      channel: appointment.channel,
      notes: appointment.notes ?? "",
    };
  }
  const service = services.find((s) => s.id === defaults?.serviceId);
  const start = defaults?.start
    ? new Date(defaults.start)
    : now
      ? nextSlotStart(now, slotMinutes)
      : null;
  return {
    clientId: defaults?.clientId ?? "",
    serviceId: service?.id ?? "",
    staffId: defaults?.staffId ?? "",
    date: start ? formatDate(start, "inputDate") : "",
    time: start ? formatDate(start, "time") : "",
    durationMin: String(service?.durationMin ?? 60),
    price: service ? centsToInput(service.price) : "",
    status: "confirmed",
    channel: "staff",
    notes: "",
  };
}
