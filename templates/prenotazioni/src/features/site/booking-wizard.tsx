"use client";

import { addMinutes } from "date-fns";
import {
  ArrowLeft,
  CalendarPlus,
  CircleCheck,
  Clock,
  Hourglass,
  Video,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useDataReady } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { useSiteData } from "@/hooks/use-site-data";
import { useZodForm } from "@/hooks/use-zod-form";
import { ANY_STAFF, type Slot } from "@/lib/domain/availability";
import { detailsSchema } from "@/lib/domain/schemas";
import type { Appointment, AppointmentSource, Mode, Service } from "@/lib/domain/types";
import { downloadFile } from "@/lib/csv";
import { capitalize, formatCurrency, formatDate } from "@/lib/format";
import { createIcsEvent } from "@/lib/ics";
import { cn } from "@/lib/utils";
import { useDataStore } from "@/store/data-store";
import { Button, buttonClasses } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Checkbox, Input, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { SlotPicker } from "./slot-picker";

const b = copy.booking;
const STEPS = b.steps;

export const modeIcon: Record<Mode, typeof Video> = { online: Video, in_person: Building2 };

export function priceLabel(service: Pick<Service, "price">): string {
  return service.price === null ? copy.common.free : formatCurrency(service.price);
}

/**
 * Prenotazione in quattro passi: servizio → professionista e modalità →
 * data e ora → dati. Il focus passa al titolo di ogni passo.
 */
export function BookingWizard({
  source = "online",
  compact = false,
}: {
  source?: AppointmentSource;
  compact?: boolean;
}) {
  const ready = useDataReady();
  const now = useNow();
  const { services, categories, staff, settings } = useSiteData();
  const book = useDataStore((state) => state.book);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [done, setDone] = useState<Appointment | null>(null);
  const [formKey, setFormKey] = useState(0);

  const active = services.filter((s) => s.active);
  const service = active.find((s) => s.id === serviceId) ?? null;
  const serviceStaff = service ? staff.filter((p) => service.staffIds.includes(p.id)) : [];
  const allowAny = settings.booking.allowAnyStaff && serviceStaff.length > 1;
  const chosenStaff =
    staffId ??
    (serviceStaff.length === 1 ? (serviceStaff[0]?.id ?? null) : allowAny ? ANY_STAFF : null);
  const chosenMode = mode ?? (service?.modes.length === 1 ? (service.modes[0] ?? null) : null);

  const goTo = (next: number) => {
    setStep(next);
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  if (!ready || !now) {
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (done) {
    return (
      <Confirmation
        appointment={done}
        compact={compact}
        onAnother={() => {
          setDone(null);
          setServiceId(null);
          setStaffId(null);
          setMode(null);
          setSlot(null);
          setFormKey((k) => k + 1);
          goTo(0);
        }}
      />
    );
  }

  const staffName = (id: string) => staff.find((p) => p.id === id)?.name ?? "";
  const titles = [b.service.title, b.staff.title, b.slot.title, b.details.title];

  return (
    <div className={cn("grid gap-8", !compact && "lg:grid-cols-[1fr_320px]")}>
      <div className="min-w-0">
        <ol aria-label={copy.a11y.steps} className="flex flex-wrap gap-x-4 gap-y-2 text-[13px]">
          {STEPS.map((label, i) => (
            <li
              key={label}
              aria-current={i === step ? "step" : undefined}
              className={cn(
                "flex items-center gap-2",
                i === step ? "font-semibold text-fg" : i < step ? "text-fg" : "text-fg-muted",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs",
                  i < step
                    ? "bg-accent text-accent-fg"
                    : i === step
                      ? "border-2 border-accent text-accent-text"
                      : "border border-line-strong/50 text-fg-muted",
                )}
              >
                {i + 1}
              </span>
              {label}
            </li>
          ))}
        </ol>

        <h2
          ref={headingRef}
          tabIndex={-1}
          className={cn(
            "mt-6 font-semibold tracking-tight text-fg outline-none",
            compact ? "text-xl" : "text-2xl",
          )}
        >
          <span className="sr-only">{copy.a11y.stepOf(step + 1, STEPS.length)}: </span>
          {titles[step]}
        </h2>

        <div className="mt-6">
          {step === 0 ? (
            <fieldset>
              <legend className="sr-only">{b.service.title}</legend>
              {categories.map((category) => {
                const list = active.filter((s) => s.categoryId === category.id);
                if (list.length === 0) return null;
                return (
                  <div key={category.id} className="mb-6 last:mb-0">
                    <p className="mb-2 text-[13px] font-medium text-fg-muted">{category.name}</p>
                    <div className="grid gap-2">
                      {list.map((item) => (
                        <ChoiceCard
                          key={item.id}
                          name="service"
                          checked={serviceId === item.id}
                          onChange={() => {
                            setServiceId(item.id);
                            setStaffId(null);
                            setMode(null);
                            setSlot(null);
                          }}
                          title={item.name}
                          meta={
                            <>
                              <span className="inline-flex items-center gap-1">
                                <Clock aria-hidden className="size-3.5" />
                                {b.service.duration(item.durationMin)}
                              </span>
                              {item.modes.map((m) => {
                                const Icon = modeIcon[m];
                                return (
                                  <span key={m} className="inline-flex items-center gap-1">
                                    <Icon aria-hidden className="size-3.5" />
                                    {copy.modes[m]}
                                  </span>
                                );
                              })}
                              {item.requiresApproval ? (
                                <span className="inline-flex items-center gap-1 text-warning">
                                  <Hourglass aria-hidden className="size-3.5" />
                                  {b.service.approval}
                                </span>
                              ) : null}
                            </>
                          }
                          aside={
                            <span className="font-semibold text-fg tabular-nums">
                              {priceLabel(item)}
                            </span>
                          }
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </fieldset>
          ) : null}

          {step === 1 && service ? (
            <div className="flex flex-col gap-8">
              <fieldset>
                <legend className="mb-2 text-[13px] font-medium text-fg-muted">
                  {b.staff.who}
                </legend>
                <div className="grid gap-2">
                  {allowAny ? (
                    <ChoiceCard
                      name="staff"
                      checked={chosenStaff === ANY_STAFF}
                      onChange={() => {
                        setStaffId(ANY_STAFF);
                        setSlot(null);
                      }}
                      title={b.staff.any}
                      meta={b.staff.anyHint}
                    />
                  ) : null}
                  {serviceStaff.map((person) => (
                    <ChoiceCard
                      key={person.id}
                      name="staff"
                      checked={chosenStaff === person.id}
                      onChange={() => {
                        setStaffId(person.id);
                        setSlot(null);
                      }}
                      title={person.name}
                      meta={person.role}
                    />
                  ))}
                </div>
              </fieldset>
              {service.modes.length > 1 ? (
                <fieldset>
                  <legend className="mb-2 text-[13px] font-medium text-fg-muted">
                    {b.staff.mode}
                  </legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {service.modes.map((m) => {
                      const Icon = modeIcon[m];
                      return (
                        <ChoiceCard
                          key={m}
                          name="mode"
                          checked={chosenMode === m}
                          onChange={() => setMode(m)}
                          title={
                            <span className="inline-flex items-center gap-2">
                              <Icon aria-hidden className="size-4" />
                              {copy.modes[m]}
                            </span>
                          }
                        />
                      );
                    })}
                  </div>
                </fieldset>
              ) : null}
            </div>
          ) : null}

          {step === 2 && service && chosenStaff ? (
            <SlotPicker
              service={service}
              staffId={chosenStaff}
              now={now}
              value={slot?.start.toISOString() ?? null}
              onChange={setSlot}
              compact={compact}
            />
          ) : null}

          {step === 3 && service && slot && chosenMode && chosenStaff ? (
            <DetailsForm
              key={formKey}
              cancelHours={settings.booking.cancelHours}
              submitLabel={service.requiresApproval ? b.submitRequest : b.submit}
              onSubmit={(details) => {
                const result = book({
                  serviceId: service.id,
                  staffId: chosenStaff,
                  mode: chosenMode,
                  start: slot.start.toISOString(),
                  customer: { name: details.name, email: details.email, phone: details.phone },
                  notes: details.notes,
                  marketingConsent: details.marketing,
                  source,
                });
                if (!result.ok) {
                  toast.error(b.slotTaken);
                  setSlot(null);
                  goTo(2);
                  return;
                }
                setDone(result.appointment);
                window.scrollTo({ top: 0 });
              }}
            />
          ) : null}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {step > 0 ? (
            <Button variant="secondary" onClick={() => goTo(step - 1)}>
              <ArrowLeft aria-hidden />
              {copy.common.back}
            </Button>
          ) : null}
          {step < 3 ? (
            <Button
              onClick={() => goTo(step + 1)}
              disabled={
                (step === 0 && !service) ||
                (step === 1 && (!chosenStaff || !chosenMode)) ||
                (step === 2 && !slot)
              }
            >
              {copy.common.continue}
            </Button>
          ) : null}
        </div>
      </div>

      {!compact ? (
        <aside className="lg:sticky lg:top-24 lg:self-start" aria-label={b.summary}>
          <Summary
            service={service}
            staffLabel={
              chosenStaff === ANY_STAFF ? b.staff.any : chosenStaff ? staffName(chosenStaff) : null
            }
            mode={chosenMode}
            slot={slot}
          />
        </aside>
      ) : null}
    </div>
  );
}

function ChoiceCard({
  name,
  checked,
  onChange,
  title,
  meta,
  aside,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  title: ReactNode;
  meta?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus",
        checked ? "border-accent bg-accent-soft" : "border-line bg-surface hover:bg-surface-2",
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="size-4 shrink-0 accent-accent"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium text-fg">{title}</span>
        {meta ? (
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-fg-muted">
            {meta}
          </span>
        ) : null}
      </span>
      {aside}
    </label>
  );
}

function Summary({
  service,
  staffLabel,
  mode,
  slot,
}: {
  service: Service | null;
  staffLabel: string | null;
  mode: Mode | null;
  slot: Slot | null;
}) {
  const rows: [string, string][] = [
    [b.summaryService, service?.name ?? "—"],
    [b.summaryWith, staffLabel ?? "—"],
    [b.summaryMode, mode ? copy.modes[mode] : "—"],
    [
      b.summaryWhen,
      slot
        ? `${capitalize(formatDate(slot.start, "weekdayLong"))}, ${formatDate(slot.start, "time")}`
        : "—",
    ],
    [b.summaryPrice, service ? priceLabel(service) : "—"],
  ];
  return (
    <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
      <p className="text-sm font-semibold text-fg">{b.summary}</p>
      <dl className="mt-4 space-y-3 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-fg-muted">{label}</dt>
            <dd className="text-right font-medium text-fg">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function DetailsForm({
  cancelHours,
  submitLabel,
  onSubmit,
}: {
  cancelHours: number;
  submitLabel: string;
  onSubmit: (data: {
    name: string;
    email: string;
    phone: string;
    notes: string;
    marketing: boolean;
  }) => void;
}) {
  const form = useZodForm(detailsSchema, {
    name: "",
    email: "",
    phone: "",
    notes: "",
    privacy: false,
    marketing: false,
  });
  const { values, errors, text, setValue } = form;
  const d = b.details;
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
      <Field label={d.name} name="name" error={errors.name} className="sm:col-span-2">
        {(props) => <Input {...props} {...text("name")} autoComplete="name" />}
      </Field>
      <Field label={d.email} name="email" error={errors.email} hint={d.emailHint}>
        {(props) => <Input {...props} {...text("email")} type="email" autoComplete="email" />}
      </Field>
      <Field label={d.phone} name="phone" error={errors.phone}>
        {(props) => <Input {...props} {...text("phone")} type="tel" autoComplete="tel" />}
      </Field>
      <Field
        label={d.notes}
        name="notes"
        error={errors.notes}
        hint={d.notesHint}
        optional
        className="sm:col-span-2"
      >
        {(props) => <Textarea {...props} {...text("notes")} rows={3} />}
      </Field>
      <div className="flex flex-col gap-3 sm:col-span-2">
        <div>
          <label className="flex items-start gap-3 text-sm text-fg">
            <Checkbox
              name="privacy"
              checked={values.privacy}
              onChange={(event) => setValue("privacy", event.target.checked)}
              aria-invalid={errors.privacy ? true : undefined}
              aria-describedby={errors.privacy ? "privacy-error" : undefined}
              className="mt-0.5"
            />
            <span>
              {d.privacy}{" "}
              <Link href={routes.privacy} target="_blank" className="text-accent-text underline">
                {copy.site.footer.privacy}
              </Link>
            </span>
          </label>
          {errors.privacy ? (
            <p id="privacy-error" className="mt-1 ml-7 text-[13px] text-danger">
              {errors.privacy}
            </p>
          ) : null}
        </div>
        <label className="flex items-start gap-3 text-sm text-fg">
          <Checkbox
            name="marketing"
            checked={values.marketing}
            onChange={(event) => setValue("marketing", event.target.checked)}
            className="mt-0.5"
          />
          {d.marketing}
        </label>
        <p className="text-[13px] text-fg-muted">{d.terms(cancelHours)}</p>
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" size="lg">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Confirmation({
  appointment,
  compact,
  onAnother,
}: {
  appointment: Appointment;
  compact: boolean;
  onAnother: () => void;
}) {
  const { services, staff, settings } = useSiteData();
  const service = services.find((s) => s.id === appointment.serviceId);
  const person = staff.find((p) => p.id === appointment.staffId);
  const start = new Date(appointment.start);
  const pending = appointment.status === "pending";
  const first = appointment.customer.name.split(" ")[0] ?? "";

  return (
    <div
      role="status"
      className={cn("rounded-2xl border border-line bg-surface shadow-sm", compact ? "p-6" : "p-8")}
    >
      <span
        className={cn(
          "flex size-12 items-center justify-center rounded-full",
          pending ? "bg-warning-soft text-warning" : "bg-success-soft text-success",
        )}
      >
        {pending ? (
          <Hourglass aria-hidden className="size-6" />
        ) : (
          <CircleCheck aria-hidden className="size-6" />
        )}
      </span>
      <h2 className="mt-6 text-2xl font-semibold tracking-tight text-fg">
        {pending ? b.requestedTitle : b.confirmedTitle}
      </h2>
      <p className="mt-2 text-fg-muted">
        {pending ? b.requestedText(first) : b.confirmedText(first)}
      </p>
      <dl className="mt-6 grid gap-4 rounded-xl bg-surface-2 p-5 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-fg-muted">{b.code}</dt>
          <dd className="mt-1 font-mono text-lg font-semibold tracking-wider text-fg">
            {appointment.code}
          </dd>
          <dd className="text-xs text-fg-muted">{b.codeHint}</dd>
        </div>
        <div>
          <dt className="text-xs text-fg-muted">{b.summaryWhen}</dt>
          <dd className="mt-1 text-sm font-medium text-fg">
            {capitalize(formatDate(start, "weekdayLong"))}, {formatDate(start, "time")}
          </dd>
          <dd className="text-sm text-fg-muted">
            {service?.name} · {person?.name} · {copy.modes[appointment.mode]}
          </dd>
        </div>
      </dl>
      <div className="mt-6 flex flex-wrap gap-3">
        {service ? (
          <Button
            onClick={() =>
              downloadFile(
                `appuntamento-${appointment.code}.ics`,
                createIcsEvent({
                  uid: `${appointment.id}@agenda`,
                  start,
                  end: addMinutes(start, service.durationMin),
                  title: `${service.name} · ${settings.name}`,
                  location:
                    appointment.mode === "online"
                      ? copy.modes.online
                      : `${settings.address}, ${settings.postalCode} ${settings.city}`,
                  description: `${b.code}: ${appointment.code}`,
                }),
                "text/calendar;charset=utf-8",
              )
            }
          >
            <CalendarPlus aria-hidden />
            {copy.common.addToCalendar}
          </Button>
        ) : null}
        <Link
          href={routes.appointment(appointment.code)}
          target={compact ? "_blank" : undefined}
          className={buttonClasses({ variant: "secondary" })}
        >
          {b.manage}
        </Link>
        <Button variant="ghost" onClick={onAnother}>
          {b.another}
        </Button>
      </div>
    </div>
  );
}
