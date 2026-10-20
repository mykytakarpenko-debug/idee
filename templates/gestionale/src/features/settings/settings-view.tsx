"use client";

import {
  Check,
  Download,
  Monitor,
  Moon,
  Pencil,
  Plus,
  RotateCcw,
  Sun,
  Trash2,
  UserMinus,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { copy } from "@/content/it";
import { env } from "@/config/env";
import { useData, useDataReady } from "@/hooks/use-data";
import { useZodForm } from "@/hooks/use-zod-form";
import { businessFormSchema, type BusinessFormValues } from "@/lib/domain/schemas";
import { timeToMinutes } from "@/lib/domain/scheduling";
import type { BusinessSettings, OpeningDay, StaffMember } from "@/lib/domain/types";
import { downloadFile } from "@/lib/csv";
import { formatDate } from "@/lib/format";
import { useTheme, type ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { exportSnapshot, useDataStore } from "@/store/data-store";
import { openDialog } from "@/store/ui-store";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  { id: "impostazioni-attivita", label: t.sections.business },
  { id: "impostazioni-orari", label: t.sections.hours },
  { id: "impostazioni-team", label: t.sections.team },
  { id: "impostazioni-aspetto", label: t.sections.appearance },
  { id: "impostazioni-notifiche", label: t.sections.notifications },
  { id: "impostazioni-dati", label: t.sections.data },
] as const;

export function SettingsView() {
  const ready = useDataReady();
  const { settings, staff, initializedAt } = useData((state) => ({
    settings: state.settings,
    staff: state.staff,
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
          <div className="flex min-w-0 flex-col gap-6">
            <BusinessSection key={`b-${initializedAt}`} settings={settings} />
            <HoursSection key={`h-${initializedAt}`} settings={settings} />
            <TeamSection staff={staff} />
            <AppearanceSection />
            <NotificationsSection settings={settings} />
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

// --- Attività -------------------------------------------------------------------

function BusinessSection({ settings }: { settings: BusinessSettings }) {
  const updateSettings = useDataStore((state) => state.updateSettings);
  const initial: BusinessFormValues = {
    name: settings.name,
    legalName: settings.legalName,
    vatNumber: settings.vatNumber,
    email: settings.email,
    phone: settings.phone,
    address: settings.address,
    city: settings.city,
    ownerName: settings.ownerName,
    paymentTermsDays: String(settings.paymentTermsDays),
  };
  const form = useZodForm(businessFormSchema, initial);
  const { errors, text } = form;
  const b = t.business;

  const onSubmit = form.handleSubmit((data) => {
    updateSettings(data);
    toast.success(b.saved);
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Section
        id="impostazioni-attivita"
        title={t.sections.business}
        description={b.intro}
        footer={<Button type="submit">{copy.common.saveChanges}</Button>}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={b.name} name="name" error={errors.name}>
            {(props) => <Input {...props} {...text("name")} autoComplete="organization" />}
          </Field>
          <Field label={b.legalName} name="legalName" error={errors.legalName} optional>
            {(props) => <Input {...props} {...text("legalName")} />}
          </Field>
          <Field label={b.vatNumber} name="vatNumber" error={errors.vatNumber} optional>
            {(props) => <Input {...props} {...text("vatNumber")} placeholder="IT01234567890" />}
          </Field>
          <Field label={b.ownerName} name="ownerName" error={errors.ownerName}>
            {(props) => <Input {...props} {...text("ownerName")} autoComplete="name" />}
          </Field>
          <Field label={b.email} name="email" error={errors.email} optional>
            {(props) => <Input {...props} {...text("email")} type="email" autoComplete="email" />}
          </Field>
          <Field label={b.phone} name="phone" error={errors.phone} optional>
            {(props) => <Input {...props} {...text("phone")} type="tel" autoComplete="tel" />}
          </Field>
          <Field label={b.address} name="address" error={errors.address} optional>
            {(props) => <Input {...props} {...text("address")} autoComplete="street-address" />}
          </Field>
          <Field label={b.city} name="city" error={errors.city} optional>
            {(props) => <Input {...props} {...text("city")} autoComplete="address-level2" />}
          </Field>
          <Field label={b.paymentTerms} name="paymentTermsDays" error={errors.paymentTermsDays}>
            {(props) => (
              <Input
                {...props}
                {...text("paymentTermsDays")}
                type="number"
                inputMode="numeric"
                min={0}
                max={120}
              />
            )}
          </Field>
        </div>
      </Section>
    </form>
  );
}

// --- Orari ----------------------------------------------------------------------

function HoursSection({ settings }: { settings: BusinessSettings }) {
  const updateSettings = useDataStore((state) => state.updateSettings);
  const [hours, setHours] = useState<OpeningDay[]>(() =>
    [...settings.hours].sort((a, b) => a.day - b.day),
  );
  const [slot, setSlot] = useState(settings.slotMinutes);
  const [error, setError] = useState(false);
  const h = t.hours;

  const update = (day: OpeningDay["day"], patch: Partial<OpeningDay>) => {
    setHours((prev) => prev.map((entry) => (entry.day === day ? { ...entry, ...patch } : entry)));
    setError(false);
  };

  const save = () => {
    const invalid = hours.some(
      (entry) => entry.open && timeToMinutes(entry.to) <= timeToMinutes(entry.from),
    );
    if (invalid) {
      setError(true);
      return;
    }
    updateSettings({ hours, slotMinutes: slot });
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
          const dayName = h.days[entry.day - 1] ?? "";
          const invalid =
            error && entry.open && timeToMinutes(entry.to) <= timeToMinutes(entry.from);
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
                  {entry.open ? h.open : copy.calendar.closed}
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
                  aria-invalid={invalid || undefined}
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
      <div className="mt-5 max-w-xs">
        <Field label={h.slot} name="slotMinutes">
          {(props) => (
            <Select
              {...props}
              value={String(slot)}
              onChange={(event) => setSlot(Number(event.target.value) as 15 | 30)}
            >
              <option value="15">{h.slot15}</option>
              <option value="30">{h.slot30}</option>
            </Select>
          )}
        </Field>
      </div>
    </Section>
  );
}

// --- Team -----------------------------------------------------------------------

function TeamSection({ staff }: { staff: StaffMember[] }) {
  return (
    <Section
      id="impostazioni-team"
      title={t.sections.team}
      description={t.team.intro}
      footer={
        <Button variant="secondary" onClick={() => openDialog({ type: "staff" })}>
          <Plus aria-hidden />
          {t.team.add}
        </Button>
      }
    >
      <ul className="-my-3 divide-y divide-line">
        {staff.map((member) => (
          <StaffRow key={member.id} member={member} />
        ))}
      </ul>
    </Section>
  );
}

function StaffRow({ member }: { member: StaffMember }) {
  const removeStaff = useDataStore((state) => state.removeStaff);
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <li className="flex items-center gap-3 py-3">
      <Avatar name={member.name} color={member.color} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate text-sm font-medium text-fg">
          {member.name}
          {!member.active ? <Badge>{t.team.inactiveBadge}</Badge> : null}
        </p>
        <p className="truncate text-[13px] text-fg-muted">
          {member.role}
          {member.email ? ` · ${member.email}` : ""}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => openDialog({ type: "staff", id: member.id })}
        aria-label={`${copy.common.edit}: ${member.name}`}
      >
        <Pencil aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setConfirmOpen(true)}
        aria-label={`${t.team.remove}: ${member.name}`}
      >
        <UserMinus aria-hidden />
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t.team.removeTitle}
        description={t.team.removeDescription}
        confirmLabel={t.team.remove}
        onConfirm={() => {
          const result = removeStaff(member.id);
          toast.success(result === "deactivated" ? t.team.deactivated : t.team.removed);
        }}
      />
    </li>
  );
}

// --- Aspetto --------------------------------------------------------------------

function AppearanceSection() {
  const { preference, setPreference } = useTheme();
  const options: { value: ThemePreference; label: string; icon: ReactNode }[] = [
    { value: "system", label: copy.topbar.themeSystem, icon: <Monitor aria-hidden /> },
    { value: "light", label: copy.topbar.themeLight, icon: <Sun aria-hidden /> },
    { value: "dark", label: copy.topbar.themeDark, icon: <Moon aria-hidden /> },
  ];
  return (
    <Section
      id="impostazioni-aspetto"
      title={t.sections.appearance}
      description={t.appearance.intro}
    >
      <fieldset>
        <legend className="mb-3 text-[13px] font-medium text-fg">{t.appearance.theme}</legend>
        <div className="grid grid-cols-3 gap-3 sm:max-w-md">
          {options.map((option) => {
            const checked = preference === option.value;
            return (
              <label
                key={option.value}
                className={cn(
                  "relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus [&_svg]:size-5",
                  checked
                    ? "border-accent bg-accent-soft text-accent-soft-fg"
                    : "border-line text-fg-muted hover:bg-surface-2",
                )}
              >
                <input
                  type="radio"
                  name="theme"
                  value={option.value}
                  checked={checked}
                  onChange={() => setPreference(option.value)}
                  className="sr-only"
                />
                {option.icon}
                {option.label}
                {checked ? (
                  <Check aria-hidden className="absolute top-2 right-2 !size-3.5" />
                ) : null}
              </label>
            );
          })}
        </div>
      </fieldset>
      <p className="mt-4 text-[13px] text-fg-muted">{t.appearance.motion}</p>
    </Section>
  );
}

// --- Notifiche ------------------------------------------------------------------

function NotificationsSection({ settings }: { settings: BusinessSettings }) {
  const updateSettings = useDataStore((state) => state.updateSettings);
  const n = t.notifications;
  const setReminders = (patch: Partial<BusinessSettings["reminders"]>) => {
    updateSettings({ reminders: { ...settings.reminders, ...patch } });
    toast.success(n.saved);
  };
  return (
    <Section id="impostazioni-notifiche" title={t.sections.notifications} description={n.intro}>
      <div className="flex flex-col gap-5">
        <ToggleRow
          label={n.email}
          description={n.emailHint}
          control={({ labelId, descriptionId }) => (
            <Switch
              checked={settings.reminders.email}
              onCheckedChange={(email) => setReminders({ email })}
              aria-labelledby={labelId}
              aria-describedby={descriptionId}
            />
          )}
        />
        <ToggleRow
          label={n.sms}
          description={n.smsHint}
          control={({ labelId, descriptionId }) => (
            <Switch
              checked={settings.reminders.sms}
              onCheckedChange={(sms) => setReminders({ sms })}
              aria-labelledby={labelId}
              aria-describedby={descriptionId}
            />
          )}
        />
        <div className="max-w-xs">
          <Field label={n.hoursBefore} name="hoursBefore">
            {(props) => (
              <Select
                {...props}
                value={String(settings.reminders.hoursBefore)}
                onChange={(event) => setReminders({ hoursBefore: Number(event.target.value) })}
              >
                {[2, 12, 24, 48].map((value) => (
                  <option key={value} value={value}>
                    {n.hours(value)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        {env.demoMode ? <p className="text-[13px] text-fg-muted">{n.demoNote}</p> : null}
      </div>
    </Section>
  );
}

// --- Dati e privacy -----------------------------------------------------------------

function DataSection() {
  const resetDemo = useDataStore((state) => state.resetDemo);
  const clearAll = useDataStore((state) => state.clearAll);
  const [confirm, setConfirm] = useState<"reset" | "clear" | null>(null);
  const d = t.data;

  const exportAll = () => {
    const snapshot = exportSnapshot(useDataStore.getState());
    downloadFile(
      `nucleo-backup-${formatDate(new Date(), "inputDate")}.json`,
      JSON.stringify(snapshot, null, 2),
      "application/json",
    );
    toast.success(d.exported);
  };

  return (
    <Section id="impostazioni-dati" title={t.sections.data} description={d.intro}>
      <ul className="-my-3 divide-y divide-line">
        <DataRow title={d.export} description={d.exportHint}>
          <Button variant="secondary" onClick={exportAll}>
            <Download aria-hidden />
            {d.export}
          </Button>
        </DataRow>
        <DataRow title={d.reset} description={d.resetHint}>
          <Button variant="secondary" onClick={() => setConfirm("reset")}>
            <RotateCcw aria-hidden />
            {d.reset}
          </Button>
        </DataRow>
        <DataRow title={d.clear} description={d.clearHint}>
          <Button variant="danger-ghost" onClick={() => setConfirm("clear")}>
            <Trash2 aria-hidden />
            {d.clear}
          </Button>
        </DataRow>
      </ul>
      <ConfirmDialog
        open={confirm === "reset"}
        onOpenChange={(open) => setConfirm(open ? "reset" : null)}
        title={d.resetConfirmTitle}
        description={d.resetConfirmDescription}
        confirmLabel={d.reset}
        tone="default"
        onConfirm={() => {
          resetDemo();
          toast.success(copy.demo.resetDone);
        }}
      />
      <ConfirmDialog
        open={confirm === "clear"}
        onOpenChange={(open) => setConfirm(open ? "clear" : null)}
        title={d.clearConfirmTitle}
        description={d.clearConfirmDescription}
        confirmLabel={d.clear}
        onConfirm={() => {
          clearAll();
          toast.success(d.cleared);
        }}
      />
    </Section>
  );
}

function DataRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-fg">{title}</p>
        <p className="mt-0.5 text-[13px] text-fg-muted">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </li>
  );
}
