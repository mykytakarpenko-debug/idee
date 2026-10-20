"use client";

import { RotateCcw } from "lucide-react";
import { useState, type ReactNode } from "react";
import { copy } from "@/content/it";
import { useData, useDataReady } from "@/hooks/use-data";
import { useZodForm } from "@/hooks/use-zod-form";
import { timeToMinutes } from "@/lib/domain/dates";
import {
  bookingSettingsSchema,
  infoFormSchema,
  rulesSchema,
  type BookingSettingsValues,
  type InfoFormValues,
  type RulesValues,
} from "@/lib/domain/schemas";
import type { ClubSettings, OpeningDay } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { useDataStore } from "@/store/data-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, ToggleRow } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Page, PageHeader } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";

const t = copy.settings;

const sections = [
  { id: "impostazioni-club", label: t.sections.info },
  { id: "impostazioni-orari", label: t.sections.hours },
  { id: "impostazioni-prenotazioni", label: t.sections.booking },
  { id: "impostazioni-regole", label: t.sections.rules },
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
            <RulesSection key={`r-${initializedAt}`} settings={settings} />
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

// --- Club ---------------------------------------------------------------------

function InfoSection({ settings }: { settings: ClubSettings }) {
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
        id="impostazioni-club"
        title={t.sections.info}
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

// --- Orari di apertura ---------------------------------------------------------------

function HoursSection({ settings }: { settings: ClubSettings }) {
  const updateSettings = useDataStore((state) => state.updateSettings);
  const [hours, setHours] = useState<OpeningDay[]>(() =>
    [...settings.hours].sort((a, b) => a.day - b.day),
  );
  const [error, setError] = useState(false);
  const h = t.hours;
  const invalid = (entry: OpeningDay) =>
    entry.open && timeToMinutes(entry.to) <= timeToMinutes(entry.from);

  const update = (day: OpeningDay["day"], patch: Partial<OpeningDay>) => {
    setHours((prev) => prev.map((entry) => (entry.day === day ? { ...entry, ...patch } : entry)));
    setError(false);
  };

  const save = () => {
    if (hours.some(invalid)) {
      setError(true);
      return;
    }
    updateSettings({ hours });
    toast.success(h.saved);
  };

  return (
    <Section
      id="impostazioni-orari"
      title={t.sections.hours}
      description={h.intro}
      footer={<Button onClick={save}>{copy.common.saveChanges}</Button>}
    >
      <ul className="divide-y divide-line">
        {hours.map((entry) => {
          const dayName = copy.weekdays[entry.day - 1] ?? "";
          return (
            <li
              key={entry.day}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0"
            >
              <span className="w-24 text-sm font-medium text-fg">{dayName}</span>
              <div className="flex items-center gap-2">
                <Switch
                  checked={entry.open}
                  onCheckedChange={(open) => update(entry.day, { open })}
                  aria-label={`${dayName}: ${h.open}`}
                />
                <span className="w-14 text-[13px] text-fg-muted">
                  {entry.open ? h.open : h.closed}
                </span>
              </div>
              <div className={cn("ml-auto flex items-center gap-2", !entry.open && "invisible")}>
                <Input
                  type="time"
                  value={entry.from}
                  step={900}
                  onChange={(event) => update(entry.day, { from: event.target.value })}
                  aria-label={`${dayName}: ${h.from}`}
                  className="w-28"
                  disabled={!entry.open}
                />
                <span aria-hidden className="text-fg-muted">
                  –
                </span>
                <Input
                  type="time"
                  value={entry.to}
                  step={900}
                  onChange={(event) => update(entry.day, { to: event.target.value })}
                  aria-label={`${dayName}: ${h.to}`}
                  aria-invalid={(error && invalid(entry)) || undefined}
                  className="w-28"
                  disabled={!entry.open}
                />
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

// --- Prenotazioni ------------------------------------------------------------------

function BookingSection({ settings }: { settings: ClubSettings }) {
  const updateSettings = useDataStore((state) => state.updateSettings);
  const b = t.booking;
  const initial: BookingSettingsValues = {
    windowDays: String(settings.booking.windowDays),
    cancelHours: String(settings.booking.cancelHours),
    maxDailyBookings: String(settings.booking.maxDailyBookings),
    waitlistEnabled: settings.booking.waitlistEnabled,
  };
  const form = useZodForm(bookingSettingsSchema, initial);
  const { values, errors, text, setValue } = form;

  const onSubmit = form.handleSubmit((data) => {
    updateSettings({ booking: data });
    toast.success(b.saved);
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Section
        id="impostazioni-prenotazioni"
        title={t.sections.booking}
        description={b.intro}
        footer={<Button type="submit">{copy.common.saveChanges}</Button>}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={b.window} name="windowDays" error={errors.windowDays}>
            {(props) => (
              <Input {...props} {...text("windowDays")} type="number" inputMode="numeric" min={1} />
            )}
          </Field>
          <Field label={b.cancel} name="cancelHours" error={errors.cancelHours}>
            {(props) => (
              <Input
                {...props}
                {...text("cancelHours")}
                type="number"
                inputMode="numeric"
                min={0}
              />
            )}
          </Field>
          <Field label={b.maxDaily} name="maxDailyBookings" error={errors.maxDailyBookings}>
            {(props) => (
              <Input
                {...props}
                {...text("maxDailyBookings")}
                type="number"
                inputMode="numeric"
                min={1}
              />
            )}
          </Field>
        </div>
        <ToggleRow
          className="mt-5"
          label={b.waitlist}
          description={b.waitlistHint}
          control={({ labelId, descriptionId }) => (
            <Switch
              checked={values.waitlistEnabled}
              onCheckedChange={(checked) => setValue("waitlistEnabled", checked)}
              aria-labelledby={labelId}
              aria-describedby={descriptionId}
            />
          )}
        />
      </Section>
    </form>
  );
}

// --- Regole --------------------------------------------------------------------------

function RulesSection({ settings }: { settings: ClubSettings }) {
  const updateSettings = useDataStore((state) => state.updateSettings);
  const r = t.rules;
  const initial: RulesValues = {
    requireMedicalCert: settings.requireMedicalCert,
    reminderDays: String(settings.reminderDays),
    trialEnabled: settings.trialEnabled,
  };
  const form = useZodForm(rulesSchema, initial);
  const { values, errors, text, setValue } = form;

  const onSubmit = form.handleSubmit((data) => {
    updateSettings(data);
    toast.success(r.saved);
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Section
        id="impostazioni-regole"
        title={t.sections.rules}
        footer={<Button type="submit">{copy.common.saveChanges}</Button>}
      >
        <div className="flex flex-col gap-5">
          <ToggleRow
            label={r.certificate}
            description={r.certificateHint}
            control={({ labelId, descriptionId }) => (
              <Switch
                checked={values.requireMedicalCert}
                onCheckedChange={(checked) => setValue("requireMedicalCert", checked)}
                aria-labelledby={labelId}
                aria-describedby={descriptionId}
              />
            )}
          />
          <ToggleRow
            label={r.trial}
            control={({ labelId }) => (
              <Switch
                checked={values.trialEnabled}
                onCheckedChange={(checked) => setValue("trialEnabled", checked)}
                aria-labelledby={labelId}
              />
            )}
          />
          <div className="max-w-xs">
            <Field label={r.reminder} name="reminderDays" error={errors.reminderDays}>
              {(props) => (
                <Input
                  {...props}
                  {...text("reminderDays")}
                  type="number"
                  inputMode="numeric"
                  min={1}
                />
              )}
            </Field>
          </div>
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
