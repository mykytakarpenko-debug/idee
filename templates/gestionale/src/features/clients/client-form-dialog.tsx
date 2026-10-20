"use client";

import { useRouter } from "next/navigation";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useZodForm } from "@/hooks/use-zod-form";
import { parseTags } from "@/lib/domain/clients";
import { clientFormSchema, type ClientFormValues } from "@/lib/domain/schemas";
import type { Client } from "@/lib/domain/types";
import { useDataStore } from "@/store/data-store";
import { Button } from "@/components/ui/button";
import { DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

const t = copy.clients.form;

function toValues(client?: Client): ClientFormValues {
  return {
    firstName: client?.firstName ?? "",
    lastName: client?.lastName ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    company: client?.company ?? "",
    city: client?.city ?? "",
    status: client?.status ?? "active",
    tags: client?.tags.join(", ") ?? "",
    notes: client?.notes ?? "",
    marketingConsent: client?.marketingConsent ?? false,
  };
}

/** Contenuto della modale cliente (crea / modifica). */
export function ClientFormDialog({ id, onDone }: { id?: string; onDone: () => void }) {
  const router = useRouter();
  const client = useDataStore((state) => (id ? state.clients.find((c) => c.id === id) : undefined));
  const createClient = useDataStore((state) => state.createClient);
  const updateClient = useDataStore((state) => state.updateClient);
  const form = useZodForm(clientFormSchema, toValues(client));
  const { errors, text } = form;

  const onSubmit = form.handleSubmit((data) => {
    const input = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      company: data.company || undefined,
      city: data.city || undefined,
      status: data.status,
      tags: parseTags(data.tags),
      notes: data.notes || undefined,
      marketingConsent: data.marketingConsent,
    };
    if (client) {
      updateClient(client.id, input);
      toast.success(t.updated);
    } else {
      const created = createClient(input);
      toast.success(t.created, {
        action: {
          label: copy.clients.detail.overview,
          onClick: () => router.push(routes.client(created.id)),
        },
      });
    }
    onDone();
  });

  return (
    <DialogContent title={client ? t.editTitle : t.createTitle} size="lg">
      <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <DialogBody className="grid gap-4 sm:grid-cols-2">
          <Field label={t.firstName} name="firstName" error={errors.firstName}>
            {(props) => <Input {...props} {...text("firstName")} autoComplete="given-name" />}
          </Field>
          <Field label={t.lastName} name="lastName" error={errors.lastName}>
            {(props) => <Input {...props} {...text("lastName")} autoComplete="family-name" />}
          </Field>
          <Field label={t.phone} name="phone" error={errors.phone} hint={t.phoneHint}>
            {(props) => (
              <Input {...props} {...text("phone")} type="tel" autoComplete="tel" inputMode="tel" />
            )}
          </Field>
          <Field label={t.email} name="email" error={errors.email} optional>
            {(props) => (
              <Input
                {...props}
                {...text("email")}
                type="email"
                autoComplete="email"
                inputMode="email"
              />
            )}
          </Field>
          <Field label={t.company} name="company" error={errors.company} optional>
            {(props) => <Input {...props} {...text("company")} autoComplete="organization" />}
          </Field>
          <Field label={t.city} name="city" error={errors.city} optional>
            {(props) => <Input {...props} {...text("city")} autoComplete="address-level2" />}
          </Field>
          <Field label={t.status} name="status" error={errors.status}>
            {(props) => (
              <Select {...props} {...text("status")}>
                {(["active", "lead", "inactive"] as const).map((status) => (
                  <option key={status} value={status}>
                    {copy.status.client[status]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={t.tags} name="tags" error={errors.tags} hint={t.tagsHint} optional>
            {(props) => <Input {...props} {...text("tags")} placeholder="VIP, Abbonamento" />}
          </Field>
          <Field
            label={t.notes}
            name="notes"
            error={errors.notes}
            hint={t.notesHint}
            optional
            className="sm:col-span-2"
          >
            {(props) => <Textarea {...props} {...text("notes")} />}
          </Field>
          <div className="flex items-start gap-3 rounded-lg border border-line bg-surface-2/60 p-3.5 sm:col-span-2">
            <Checkbox
              id="client-marketing-consent"
              name="marketingConsent"
              checked={form.values.marketingConsent}
              onChange={(event) => form.setValue("marketingConsent", event.target.checked)}
              aria-describedby="client-marketing-consent-hint"
              className="mt-0.5"
            />
            <div>
              <label htmlFor="client-marketing-consent" className="text-sm font-medium text-fg">
                {t.marketingConsent}
              </label>
              <p id="client-marketing-consent-hint" className="text-[13px] text-fg-muted">
                {t.marketingConsentHint}
              </p>
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={onDone}>
            {copy.common.cancel}
          </Button>
          <Button type="submit">{client ? copy.common.saveChanges : copy.clients.new}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
