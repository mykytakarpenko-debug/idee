"use client";

import { RotateCcw } from "lucide-react";
import { useState, type ReactNode } from "react";
import { copy } from "@/content/it";
import { useData, useDataReady } from "@/hooks/use-data";
import { useZodForm } from "@/hooks/use-zod-form";
import { timeToMinutes } from "@/lib/domain/hours";
import {
  bookingSettingsSchema,
  deliverySettingsSchema,
  infoFormSchema,
  type BookingSettingsValues,
  type DeliverySettingsValues,
  type InfoFormValues,
} from "@/lib/domain/schemas";
import type { OpeningDay, RestaurantSettings, ServiceWindow } from "@/lib/domain/types";
import { centsToInput } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDataStore } from "@/store/data-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, ToggleRow } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { Page, PageHeader } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";

const t = copy.settings;

const sections = [
  { id: "impostazioni-locale", label: t.sections.info },
  { id: "impostazioni-servizi", label: t.sections.hours },
  { id: "impostazioni-prenotazioni", label: t.sections.booking },
  { id: "impostazioni-consegna", label: t.sections.delivery },
  { id: "impostazioni-dati", label: t.sections.data },
] as const;

export function SettingsView() {
  const ready = useDataReady();
  const { settings, initializedAt } = useData((state) => ({
    settings: state.settings,
    initializedAt: state.initializedAt,
  }));

  return (
    <Page>
      <PageHeader title={t.title} description={t.description} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[200px_1fr]">
        <nav aria-label={t.title} className="hidden lg:block">
          <ul className="sticky top-24 flex flex-col gap-0.5">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {!ready ? (
          <div className="flex flex-col gap-6" aria-busy="true">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
          </div>
        ) : (
          // Le chiavi rimontano i moduli quando i dati demo vengono ripristinati.
          <div className="flex min-w-0 flex-col gap-6">
            <InfoSection key={`i-${initializedAt}`} settings={settings} />
            <HoursSection key={`h-${initializedAt}`} settings={settings} />
            <BookingSection key={`b-${initializedAt}`} settings={settings} />
            <DeliverySection key={`d-${initializedAt}`} settings={settings} />
            <DataSection />
          </div>
        )}
      </div>
    </Page>
  );
}

function Section({
  id,
  title,
  description,
  children,
  footer,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card id={id} className="scroll-mt-24">
      <CardHeader title={title} description={description} />
      <CardContent>{children}</CardContent>
      {footer ? (
        <div className="flex justify-end border-t border-line px-5 py-4 sm:px-6">{footer}</div>
      ) : null}
    </Card>
  );
}

// --- Locale ---------------------------------------------------------------------

function InfoSection({ settings }: { settings: RestaurantSettings }) {
  const updateSettings = useDataStore((state) => state.updateSettings);
  const initial: InfoFormValues = {
    name: settings.name,
    tagline: settings.tagline,
    address: settings.address,
    postalCode: settings.postalCode,
    city: settings.city,
    phone: settings.phone,
    email: settings.email,
    vatNumber: settings.vatNumber,
  };
  const form = useZodForm(infoFormSchema, initial);
  const { errors, text } = form;
  const i = t.info;

  const onSubmit = form.handleSubmit((data) => {
    updateSettings(data);
    toast.success(i.saved);
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Section
        id="impostazioni-locale"
        title={t.sections.info}
        description={i.intro}
        footer={<Button type="submit">{copy.common.saveChanges}</Button>}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={i.name} name="name" error={errors.name}>
            {(props) => <Input {...props} {...text("name")} autoComplete="organization" />}
          </Field>
          <Field label={i.vat} name="vatNumber" error={errors.vatNumber} optional>
            {(props) => <Input {...props} {...text("vatNumber")} placeholder="IT01234567890" />}
          </Field>
          <Field label={i.tagline} name="tagline" error={errors.tagline} className="sm:col-span-2">
            {(props) => <Input {...props} {...text("tagline")} />}
          </Field>
          <Field label={i.address} name="address" error={errors.address} className="sm:col-span-2">
            {(props) => <Input {...props} {...text("address")} autoComplete="street-address" />}
          </Field>
          <Field label={i.postalCode} name="postalCode" error={errors.postalCode}>
            {(props) => (
              <Input
                {...props}
                {...text("postalCode")}
                inputMode="numeric"
                autoComplete="postal-code"
              />
            )}
          </Field>
          <Field label={i.city} name="city" error={errors.city}>
            {(props) => <Input {...props} {...text("city")} autoComplete="address-level2" />}
          </Field>
          <Field label={i.phone} name="phone" error={errors.phone}>
            {(props) => <Input {...props} {...text("phone")} type="tel" autoComplete="tel" />}
          </Field>
          <Field label={i.email} name="email" error={errors.email}>
            {(props) => <Input {...props} {...text("email")} type="email" autoComplete="email" />}
          </Field>
        </div>
      </Section>
    </form>
  );
}

// --- Servizi (pranzo e cena) ----------------------------------------------------

type ServiceKey = "lunch" | "dinner";
const isInvalid = (w: ServiceWindow) => w.open && timeToMinutes(w.to) <= timeToMinutes(w.from);

function HoursSection({ settings }: { settings: RestaurantSettings }) {
  const updateSettings = useDataStore((state) => state.updateSettings);
  const [hours, setHours] = useState<OpeningDay[]>(() =>
    [...settings.hours].sort((a, b) => a.day - b.day),
  );
  const [error, setError] = useState(false);
  const h = t.hours;

  const update = (day: OpeningDay["day"], service: ServiceKey, patch: Partial<ServiceWindow>) => {
    setHours((prev) =>
      prev.map((entry) =>
        entry.day === day ? { ...entry, [service]: { ...entry[service], ...patch } } : entry,
      ),
    );
    setError(false);
  };

  const save = () => {
    if (hours.some((entry) => isInvalid(entry.lunch) || isInvalid(entry.dinner))) {
      setError(true);
      return;
    }
    updateSettings({ hours });
    toast.success(h.saved);
  };

  return (
    <Section
      id="impostazioni-servizi"
      title={t.sections.hours}
      description={h.intro}
      footer={<Button onClick={save}>{copy.common.saveChanges}</Button>}
    >
      <ul className="divide-y divide-line">
        {hours.map((entry) => {
          const dayName = h.days[entry.day - 1] ?? "";
          return (
            <li
              key={entry.day}
              className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 md:flex-row md:items-start md:gap-4"
            >
              <span className="w-24 pt-2 text-sm font-medium text-fg">{dayName}</span>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                {(["lunch", "dinner"] as const).map((service) => {
                  const window = entry[service];
                  const label = `${dayName}, ${copy.service[service].toLowerCase()}`;
                  return (
                    <div key={service} className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <span className="w-14 text-[13px] text-fg-muted">
                        {copy.service[service]}
                      </span>
                      <Switch
                        checked={window.open}
                        onCheckedChange={(open) => update(entry.day, service, { open })}
                        aria-label={`${label}: ${h.open}`}
                      />
                      <span className="w-14 text-[13px] text-fg-muted">
                        {window.open ? h.open : h.closed}
                      </span>
                      <div
                        className={cn(
                          "flex items-center gap-2 sm:ml-auto",
                          !window.open && "invisible",
                        )}
                      >
                        <Input
                          type="time"
                          value={window.from}
                          step={900}
                          onChange={(event) =>
                            update(entry.day, service, { from: event.target.value })
                          }
                          aria-label={`${label}: ${h.from}`}
                          className="w-28"
                          disabled={!window.open}
                        />
                        <span aria-hidden className="text-fg-muted">
                          –
                        </span>
                        <Input
                          type="time"
                          value={window.to}
                          step={900}
                          onChange={(event) =>
                            update(entry.day, service, { to: event.target.value })
                          }
                          aria-label={`${label}: ${h.to}`}
                          aria-invalid={(error && isInvalid(window)) || undefined}
                          className="w-28"
                          disabled={!window.open}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
      {error ? (
        <p role="alert" className="mt-3 text-[13px] text-danger">
          {h.invalid}
        </p>
      ) : null}
    </Section>
  );
}

// --- Prenotazioni ---------------------------------------------------------------

function BookingSection({ settings }: { settings: RestaurantSettings }) {
  const updateSettings = useDataStore((state) => state.updateSettings);
  const b = t.booking;
  const initial: BookingSettingsValues = {
    enabled: settings.booking.enabled,
    slotMinutes: settings.booking.slotMinutes === 15 ? "15" : "30",
    durationMin: String(settings.booking.durationMin),
    maxPartySize: String(settings.booking.maxPartySize),
    leadTimeMin: String(settings.booking.leadTimeMin),
    lastSeatingBeforeCloseMin: String(settings.booking.lastSeatingBeforeCloseMin),
  };
  const form = useZodForm(bookingSettingsSchema, initial);
  const { values, errors, text, setValue } = form;

  const onSubmit = form.handleSubmit((data) => {
    updateSettings({ booking: { ...data, slotMinutes: data.slotMinutes === "15" ? 15 : 30 } });
    toast.success(b.saved);
  });

  const numberField = (
    key: "durationMin" | "maxPartySize" | "leadTimeMin" | "lastSeatingBeforeCloseMin",
    label: string,
  ) => (
    <Field label={label} name={key} error={errors[key]}>
      {(props) => <Input {...props} {...text(key)} type="number" inputMode="numeric" min={0} />}
    </Field>
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <Section
        id="impostazioni-prenotazioni"
        title={t.sections.booking}
        description={b.intro}
        footer={<Button type="submit">{copy.common.saveChanges}</Button>}
      >
        <ToggleRow
          label={b.enabled}
          className="mb-5"
          control={({ labelId }) => (
            <Switch
              checked={values.enabled}
              onCheckedChange={(checked) => setValue("enabled", checked)}
              aria-labelledby={labelId}
            />
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={b.slot} name="slotMinutes" error={errors.slotMinutes}>
            {(props) => (
              <Select {...props} {...text("slotMinutes")}>
                <option value="15">{b.slot15}</option>
                <option value="30">{b.slot30}</option>
              </Select>
            )}
          </Field>
          {numberField("durationMin", b.duration)}
          {numberField("maxPartySize", b.maxParty)}
          {numberField("leadTimeMin", b.leadTime)}
          {numberField("lastSeatingBeforeCloseMin", b.lastSeating)}
        </div>
      </Section>
    </form>
  );
}

// --- Asporto e consegna -----------------------------------------------------------

function DeliverySection({ settings }: { settings: RestaurantSettings }) {
  const updateSettings = useDataStore((state) => state.updateSettings);
  const d = t.delivery;
  const initial: DeliverySettingsValues = {
    enabled: settings.delivery.enabled,
    takeawayEnabled: settings.delivery.takeawayEnabled,
    minOrder: centsToInput(settings.delivery.minOrder),
    fee: centsToInput(settings.delivery.fee),
    freeAbove: centsToInput(settings.delivery.freeAbove),
    prepMinutes: String(settings.delivery.prepMinutes),
    deliveryMinutes: String(settings.delivery.deliveryMinutes),
    postalCodes: settings.delivery.postalCodes.join(", "),
  };
  const form = useZodForm(deliverySettingsSchema, initial);
  const { values, errors, text, setValue } = form;

  const onSubmit = form.handleSubmit((data) => {
    updateSettings({ delivery: data });
    toast.success(d.saved);
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Section
        id="impostazioni-consegna"
        title={t.sections.delivery}
        description={d.intro}
        footer={<Button type="submit">{copy.common.saveChanges}</Button>}
      >
        <div className="mb-5 flex flex-col gap-4">
          <ToggleRow
            label={d.takeaway}
            control={({ labelId }) => (
              <Switch
                checked={values.takeawayEnabled}
                onCheckedChange={(checked) => setValue("takeawayEnabled", checked)}
                aria-labelledby={labelId}
              />
            )}
          />
          <ToggleRow
            label={d.enabled}
            control={({ labelId }) => (
              <Switch
                checked={values.enabled}
                onCheckedChange={(checked) => setValue("enabled", checked)}
                aria-labelledby={labelId}
              />
            )}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={d.minOrder} name="minOrder" error={errors.minOrder}>
            {(props) => <Input {...props} {...text("minOrder")} inputMode="decimal" />}
          </Field>
          <Field label={d.fee} name="fee" error={errors.fee}>
            {(props) => <Input {...props} {...text("fee")} inputMode="decimal" />}
          </Field>
          <Field label={d.freeAbove} name="freeAbove" error={errors.freeAbove}>
            {(props) => <Input {...props} {...text("freeAbove")} inputMode="decimal" />}
          </Field>
          <Field label={d.prep} name="prepMinutes" error={errors.prepMinutes}>
            {(props) => (
              <Input
                {...props}
                {...text("prepMinutes")}
                type="number"
                inputMode="numeric"
                min={5}
              />
            )}
          </Field>
          <Field label={d.deliveryTime} name="deliveryMinutes" error={errors.deliveryMinutes}>
            {(props) => (
              <Input
                {...props}
                {...text("deliveryMinutes")}
                type="number"
                inputMode="numeric"
                min={0}
              />
            )}
          </Field>
          <Field
            label={d.postalCodes}
            name="postalCodes"
            error={errors.postalCodes}
            hint={d.postalCodesHint}
          >
            {(props) => <Input {...props} {...text("postalCodes")} />}
          </Field>
        </div>
      </Section>
    </form>
  );
}

// --- Dati demo ------------------------------------------------------------------

function DataSection() {
  const resetDemo = useDataStore((state) => state.resetDemo);
  const [confirm, setConfirm] = useState(false);
  const d = t.data;
  return (
    <Section id="impostazioni-dati" title={t.sections.data} description={d.intro}>
      <ToggleRow
        label={d.reset}
        description={d.resetHint}
        control={() => (
          <Button variant="secondary" onClick={() => setConfirm(true)}>
            <RotateCcw aria-hidden />
            {d.reset}
          </Button>
        )}
      />
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={d.resetTitle}
        description={d.resetText}
        confirmLabel={d.reset}
        onConfirm={() => {
          resetDemo();
          toast.success(copy.demo.resetDone);
        }}
      />
    </Section>
  );
}
