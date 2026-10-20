"use client";

import { addDays } from "date-fns";
import { Info } from "lucide-react";
import { copy } from "@/content/it";
import { useData } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { useZodForm } from "@/hooks/use-zod-form";
import { paymentFormSchema, type PaymentFormValues } from "@/lib/domain/schemas";
import type {
  Appointment,
  Payment,
  PaymentMethod,
  PaymentStatus,
  Service,
} from "@/lib/domain/types";
import { centsToInput, formatDate } from "@/lib/format";
import { useDataStore } from "@/store/data-store";
import type { DialogRequest } from "@/store/ui-store";
import { Button } from "@/components/ui/button";
import { DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { ClientCombobox } from "@/features/clients/client-combobox";

const t = copy.payments.form;
const METHODS: PaymentMethod[] = ["card", "cash", "transfer", "voucher"];
const STATUSES: PaymentStatus[] = ["paid", "pending", "refunded"];

type Defaults = Extract<DialogRequest, { type: "payment" }>["defaults"];

export function PaymentFormDialog({
  id,
  defaults,
  onDone,
}: {
  id?: string;
  defaults?: Defaults;
  onDone: () => void;
}) {
  const now = useNow();
  const { payment, payments, appointments, clients, services, settings } = useData((state) => ({
    payment: id ? state.payments.find((p) => p.id === id) : undefined,
    payments: state.payments,
    appointments: state.appointments,
    clients: state.clients,
    services: state.services,
    settings: state.settings,
  }));
  const createPayment = useDataStore((state) => state.createPayment);
  const updatePayment = useDataStore((state) => state.updatePayment);

  const form = useZodForm(
    paymentFormSchema,
    initialValues(payment, defaults, now, appointments, services),
  );
  const { values, errors, text, setValue } = form;

  // Appuntamenti del cliente collegabili: non annullati e non già pagati (oltre a quello attuale).
  const linked = new Set(
    payments.filter((p) => p.appointmentId && p.id !== payment?.id).map((p) => p.appointmentId),
  );
  const clientAppointments = appointments
    .filter(
      (a) =>
        a.clientId === values.clientId &&
        (a.status === "completed" || a.status === "confirmed") &&
        (!linked.has(a.id) || a.id === values.appointmentId),
    )
    .sort((a, b) => b.start.localeCompare(a.start))
    .slice(0, 20);
  const serviceName = (serviceId: string) => services.find((s) => s.id === serviceId)?.name ?? "";

  const onAppointmentChange = (appointmentId: string) => {
    setValue("appointmentId", appointmentId);
    const appointment = appointments.find((a) => a.id === appointmentId);
    if (appointment) {
      setValue("amount", centsToInput(appointment.price));
      setValue("description", serviceName(appointment.serviceId));
    }
  };

  const onStatusChange = (status: PaymentStatus) => {
    setValue("status", status);
    if (/^\d{4}-\d{2}-\d{2}$/.test(values.issuedAt)) {
      const issued = new Date(`${values.issuedAt}T12:00:00`);
      const due = status === "pending" ? addDays(issued, settings.paymentTermsDays) : issued;
      setValue("dueAt", formatDate(due, "inputDate"));
    }
  };

  const onSubmit = form.handleSubmit((data) => {
    const issued = new Date(`${data.issuedAt}T12:00:00`);
    const issuedToday = now !== null && data.issuedAt === formatDate(now, "inputDate");
    const paidAt =
      payment?.status === "paid" && payment.paidAt
        ? payment.paidAt
        : issuedToday && now
          ? now.toISOString()
          : issued.toISOString();
    const input = {
      clientId: data.clientId,
      appointmentId: data.appointmentId || null,
      description: data.description,
      amount: data.amount,
      method: data.method,
      status: data.status,
      issuedAt: issued.toISOString(),
      dueAt: new Date(`${data.dueAt}T12:00:00`).toISOString(),
      paidAt: data.status === "paid" ? paidAt : null,
      notes: data.notes || undefined,
    };
    if (payment) {
      updatePayment(payment.id, input);
      toast.success(t.updated);
    } else {
      const created = createPayment(input);
      toast.success(t.created, { description: created.number });
    }
    onDone();
  });

  return (
    <DialogContent
      title={payment ? t.editTitle : t.createTitle}
      description={payment?.number}
      size="lg"
    >
      <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <DialogBody className="grid gap-4 sm:grid-cols-2">
          <Field label={t.client} name="clientId" error={errors.clientId}>
            {(props) => (
              <ClientCombobox
                clients={clients}
                value={values.clientId}
                onChange={(clientId) => {
                  setValue("clientId", clientId);
                  setValue("appointmentId", "");
                }}
                controlProps={props}
              />
            )}
          </Field>
          <Field label={t.appointment} name="appointmentId" error={errors.appointmentId} optional>
            {(props) => (
              <Select
                {...props}
                value={values.appointmentId}
                onChange={(event) => onAppointmentChange(event.target.value)}
                disabled={!values.clientId}
              >
                <option value="">{t.noAppointment}</option>
                {clientAppointments.map((appointment) => (
                  <option key={appointment.id} value={appointment.id}>
                    {formatDate(appointment.start, "short")} · {serviceName(appointment.serviceId)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={t.description} name="description" error={errors.description}>
            {(props) => <Input {...props} {...text("description")} />}
          </Field>
          <Field label={t.amount} name="amount" error={errors.amount}>
            {(props) => (
              <Input {...props} {...text("amount")} inputMode="decimal" placeholder="0,00" />
            )}
          </Field>
          <Field label={t.method} name="method" error={errors.method}>
            {(props) => (
              <Select {...props} {...text("method")}>
                {METHODS.map((method) => (
                  <option key={method} value={method}>
                    {copy.paymentMethod[method]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={t.status} name="status" error={errors.status}>
            {(props) => (
              <Select
                {...props}
                value={values.status}
                onChange={(event) => onStatusChange(event.target.value as PaymentStatus)}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {copy.status.payment[status]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={t.issuedAt} name="issuedAt" error={errors.issuedAt}>
            {(props) => <Input {...props} {...text("issuedAt")} type="date" />}
          </Field>
          <Field label={t.dueAt} name="dueAt" error={errors.dueAt}>
            {(props) => <Input {...props} {...text("dueAt")} type="date" />}
          </Field>
          <Field
            label={t.notes}
            name="notes"
            error={errors.notes}
            optional
            className="sm:col-span-2"
          >
            {(props) => <Textarea {...props} {...text("notes")} rows={2} />}
          </Field>
          <p className="flex gap-2.5 rounded-lg bg-info-soft p-3.5 text-[13px] text-fg sm:col-span-2">
            <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-info" />
            {t.notice}
          </p>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={onDone}>
            {copy.common.cancel}
          </Button>
          <Button type="submit">{payment ? copy.common.saveChanges : copy.payments.new}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function initialValues(
  payment: Payment | undefined,
  defaults: Defaults,
  now: Date | null,
  appointments: Appointment[],
  services: Service[],
): PaymentFormValues {
  if (payment) {
    return {
      clientId: payment.clientId,
      appointmentId: payment.appointmentId ?? "",
      description: payment.description,
      amount: centsToInput(payment.amount),
      method: payment.method,
      status: payment.status,
      issuedAt: formatDate(payment.issuedAt, "inputDate"),
      dueAt: formatDate(payment.dueAt, "inputDate"),
      notes: payment.notes ?? "",
    };
  }
  const appointment = defaults?.appointmentId
    ? appointments.find((a) => a.id === defaults.appointmentId)
    : undefined;
  const service = appointment ? services.find((s) => s.id === appointment.serviceId) : undefined;
  const today = now ? formatDate(now, "inputDate") : "";
  return {
    clientId: defaults?.clientId ?? appointment?.clientId ?? "",
    appointmentId: appointment?.id ?? "",
    description: service?.name ?? "",
    amount: appointment ? centsToInput(appointment.price) : "",
    method: "card",
    status: "paid",
    issuedAt: today,
    dueAt: today,
    notes: "",
  };
}
