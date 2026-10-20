"use client";

import { Copy, ExternalLink, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { copy } from "@/content/it";
import { env } from "@/config/env";
import { routes } from "@/config/navigation";
import { useData, useDataReady } from "@/hooks/use-data";
import { useZodForm } from "@/hooks/use-zod-form";
import {
  bookingRulesSchema,
  infoFormSchema,
  type BookingRulesValues,
  type InfoFormValues,
} from "@/lib/domain/schemas";
import type { BusinessSettings } from "@/lib/domain/types";
import { useDataStore } from "@/store/data-store";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, ToggleRow } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Page, PageHeader } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";

const t = copy.settings;

const sections = [
  { id: "impostazioni-studio", label: t.sections.info },
  { id: "impostazioni-regole", label: t.sections.booking },
  { id: "impostazioni-widget", label: t.sections.widget },
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
            <RulesSection key={`r-${initializedAt}`} settings={settings} />
            <WidgetSection name={settings.name} />
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

function InfoSection({ settings }: { settings: BusinessSettings }) {
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
        id="impostazioni-studio"
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

function RulesSection({ settings }: { settings: BusinessSettings }) {
  const updateSettings = useDataStore((state) => state.updateSettings);
  const b = t.booking;
  const initial: BookingRulesValues = {
    slotStepMin: String(settings.booking.slotStepMin) as "15" | "30" | "60",
    leadTimeHours: String(settings.booking.leadTimeHours),
    horizonDays: String(settings.booking.horizonDays),
    cancelHours: String(settings.booking.cancelHours),
    allowAnyStaff: settings.booking.allowAnyStaff,
  };
  const form = useZodForm(bookingRulesSchema, initial);
  const { values, errors, text, setValue } = form;

  const onSubmit = form.handleSubmit((data) => {
    updateSettings({
      booking: { ...data, slotStepMin: Number(data.slotStepMin) as 15 | 30 | 60 },
    });
    toast.success(b.saved);
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Section
        id="impostazioni-regole"
        title={t.sections.booking}
        footer={<Button type="submit">{copy.common.saveChanges}</Button>}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={b.step} name="slotStepMin" error={errors.slotStepMin}>
            {(props) => (
              <Select {...props} {...text("slotStepMin")}>
                <option value="15">{b.step15}</option>
                <option value="30">{b.step30}</option>
                <option value="60">{b.step60}</option>
              </Select>
            )}
          </Field>
          <Field label={b.lead} name="leadTimeHours" error={errors.leadTimeHours}>
            {(props) => (
              <Input
                {...props}
                {...text("leadTimeHours")}
                type="number"
                inputMode="numeric"
                min={0}
              />
            )}
          </Field>
          <Field label={b.horizon} name="horizonDays" error={errors.horizonDays}>
            {(props) => (
              <Input
                {...props}
                {...text("horizonDays")}
                type="number"
                inputMode="numeric"
                min={1}
              />
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
        </div>
        <ToggleRow
          className="mt-5"
          label={b.anyStaff}
          description={b.anyStaffHint}
          control={({ labelId, descriptionId }) => (
            <Switch
              checked={values.allowAnyStaff}
              onCheckedChange={(checked) => setValue("allowAnyStaff", checked)}
              aria-labelledby={labelId}
              aria-describedby={descriptionId}
            />
          )}
        />
      </Section>
    </form>
  );
}

function WidgetSection({ name }: { name: string }) {
  const w = t.widget;
  const snippet = `<iframe src="${env.siteUrl}${routes.widget}" title="Prenota con ${name}" style="width:100%;min-height:760px;border:0" loading="lazy"></iframe>`;
  return (
    <Section id="impostazioni-widget" title={t.sections.widget} description={w.intro}>
      <Field label={w.snippet} name="snippet" optional={false}>
        {(props) => (
          <Textarea
            {...props}
            required={undefined}
            readOnly
            value={snippet}
            rows={3}
            className="font-mono text-xs"
          />
        )}
      </Field>
      <p className="mt-3 text-[13px] text-fg-muted">{w.origins}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            void navigator.clipboard
              ?.writeText(snippet)
              .then(() => toast.success(copy.common.copied));
          }}
        >
          <Copy aria-hidden />
          {copy.common.copy}
        </Button>
        <Link href={routes.widget} target="_blank" className={buttonClasses({ variant: "ghost" })}>
          <ExternalLink aria-hidden />
          {w.preview}
        </Link>
      </div>
    </Section>
  );
}

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
