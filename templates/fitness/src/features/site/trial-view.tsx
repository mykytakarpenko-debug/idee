"use client";

import { addMinutes } from "date-fns";
import { CalendarPlus, CircleCheck } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useData, useDataReady } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { useSiteData } from "@/hooks/use-site-data";
import { useZodForm } from "@/hooks/use-zod-form";
import { sessionStats } from "@/lib/domain/booking";
import { trialFormSchema, type TrialFormValues } from "@/lib/domain/schemas";
import type {
  Booking,
  ClassSession,
  Course,
  TrialInterest,
  TrialRequest,
} from "@/lib/domain/types";
import { downloadFile } from "@/lib/csv";
import { capitalize, formatDate } from "@/lib/format";
import { createIcsEvent } from "@/lib/ics";
import { cn } from "@/lib/utils";
import { useDataStore } from "@/store/data-store";
import { Container, SectionHeading } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Checkbox, Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const t = copy.trial;
const INTERESTS: TrialInterest[] = ["forza", "cardio", "mente_corpo", "ritmo", "sala_pesi"];

const initialValues: TrialFormValues = {
  interest: "forza",
  sessionId: "",
  name: "",
  email: "",
  phone: "",
  adult: false,
  privacy: false,
  marketing: false,
};

export function TrialView() {
  const { settings, courses } = useSiteData();
  const ready = useDataReady();
  const now = useNow();
  const { sessions, bookings, trials } = useData((state) => ({
    sessions: state.sessions,
    bookings: state.bookings,
    trials: state.trials,
  }));
  const createTrial = useDataStore((state) => state.createTrial);
  const [sent, setSent] = useState<TrialRequest | null>(null);
  const [formKey, setFormKey] = useState(0);

  if (!settings.trialEnabled) {
    return (
      <Container className="py-16">
        <SectionHeading as="h1" title={t.title} description={t.disabled} />
      </Container>
    );
  }

  if (sent) {
    const session = sessions.find((s) => s.id === sent.sessionId);
    const course = session && courses.find((c) => c.id === session.courseId);
    const start = session ? new Date(session.start) : null;
    return (
      <Container className="max-w-2xl animate-page-in py-16 sm:py-24">
        <div role="status" className="rounded-2xl border border-line bg-surface p-8 shadow-sm">
          <span className="flex size-12 items-center justify-center rounded-full bg-success-soft text-success">
            <CircleCheck aria-hidden className="size-6" />
          </span>
          <h1 className="mt-6 font-display text-3xl font-bold text-fg">{t.sentTitle}</h1>
          <p className="mt-2 text-fg-muted">{t.sentText(sent.name.split(" ")[0] ?? "")}</p>
          {course && start ? (
            <p className="mt-4 font-medium text-fg">
              {t.sentSession(
                course.name,
                `${formatDate(start, "weekdayLong")} alle ${formatDate(start, "time")}`,
              )}
            </p>
          ) : null}
          <p className="mt-4 text-sm text-fg-muted">{t.bring}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {course && start && session ? (
              <Button
                onClick={() =>
                  downloadFile(
                    `prova-${course.id}.ics`,
                    createIcsEvent({
                      uid: `${sent.id}@forma`,
                      start,
                      end: addMinutes(start, session.durationMin),
                      title: `${course.name} · ${settings.name}`,
                      location: `${settings.address}, ${settings.postalCode} ${settings.city}`,
                      description: t.bring,
                    }),
                    "text/calendar;charset=utf-8",
                  )
                }
              >
                <CalendarPlus aria-hidden />
                {copy.common.addToCalendar}
              </Button>
            ) : null}
            <Button
              variant="secondary"
              onClick={() => {
                setSent(null);
                setFormKey((k) => k + 1);
              }}
            >
              {t.another}
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <TrialForm
      key={formKey}
      ready={ready && now !== null}
      now={now}
      onSent={(input) => setSent(createTrial(input))}
      options={{ sessions, bookings, trials, courses }}
    />
  );
}

function TrialForm({
  ready,
  now,
  onSent,
  options,
}: {
  ready: boolean;
  now: Date | null;
  onSent: (input: Omit<TrialRequest, "id" | "status" | "createdAt">) => void;
  options: {
    sessions: ClassSession[];
    bookings: Booking[];
    trials: TrialRequest[];
    courses: Course[];
  };
}) {
  const form = useZodForm(trialFormSchema, initialValues);
  const { values, errors, text, setValue } = form;
  const { sessions, bookings, trials, courses } = options;

  const available = useMemo(() => {
    if (!now || values.interest === "sala_pesi") return [];
    const limit = now.getTime() + 5 * 86_400_000;
    return sessions
      .filter((s) => {
        const ms = new Date(s.start).getTime();
        const course = courses.find((c) => c.id === s.courseId);
        return (
          !s.cancelled &&
          ms > now.getTime() + 2 * 3_600_000 &&
          ms < limit &&
          course?.category === values.interest &&
          !sessionStats(s, bookings, trials).full
        );
      })
      .sort((a, b) => a.start.localeCompare(b.start))
      .slice(0, 8);
  }, [now, sessions, courses, bookings, trials, values.interest]);

  const onSubmit = form.handleSubmit((data) => {
    onSent({
      name: data.name,
      email: data.email,
      phone: data.phone,
      interest: data.interest,
      sessionId: data.sessionId || null,
      marketingConsent: data.marketing,
    });
    window.scrollTo({ top: 0 });
  });

  return (
    <Container className="animate-page-in py-12 sm:py-16">
      <SectionHeading as="h1" title={t.title} description={t.description} />
      <form onSubmit={onSubmit} noValidate className="mt-10 grid max-w-3xl gap-10">
        <fieldset>
          <legend className="text-sm font-semibold text-fg">{t.interest}</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {INTERESTS.map((interest) => (
              <label
                key={interest}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus",
                  values.interest === interest
                    ? "border-accent bg-accent-soft"
                    : "border-line bg-surface hover:bg-surface-2",
                )}
              >
                <input
                  type="radio"
                  name="interest"
                  value={interest}
                  checked={values.interest === interest}
                  onChange={() => {
                    setValue("interest", interest);
                    setValue("sessionId", "");
                  }}
                  className="size-4 accent-accent"
                />
                <span className="text-sm font-medium text-fg">{copy.interests[interest]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-semibold text-fg">{t.session}</legend>
          <p className="mt-1 text-[13px] text-fg-muted">{t.sessionHint}</p>
          {!ready ? (
            <div className="mt-3 space-y-2" aria-hidden>
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {values.interest !== "sala_pesi" && available.length === 0 ? (
                <p className="text-sm text-fg-muted">{t.noSessions}</p>
              ) : null}
              {available.map((session) => {
                const course = courses.find((c) => c.id === session.courseId);
                const start = new Date(session.start);
                const free = sessionStats(session, bookings, trials).free;
                return (
                  <label
                    key={session.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus",
                      values.sessionId === session.id
                        ? "border-accent bg-accent-soft"
                        : "border-line bg-surface hover:bg-surface-2",
                    )}
                  >
                    <input
                      type="radio"
                      name="sessionId"
                      value={session.id}
                      checked={values.sessionId === session.id}
                      onChange={() => setValue("sessionId", session.id)}
                      className="size-4 accent-accent"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="font-medium text-fg">
                        {capitalize(formatDate(start, "weekdayShort"))} ·{" "}
                        {formatDate(start, "time")} · {course?.name}
                      </span>
                    </span>
                    <span className="text-xs whitespace-nowrap text-fg-muted">
                      {copy.home.seatsLeft(free)}
                    </span>
                  </label>
                );
              })}
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line-strong/50 px-4 py-3 text-sm">
                <input
                  type="radio"
                  name="sessionId"
                  value=""
                  checked={values.sessionId === ""}
                  onChange={() => setValue("sessionId", "")}
                  className="size-4 accent-accent"
                />
                <span className="text-fg">{t.noSession}</span>
              </label>
            </div>
          )}
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-1 text-sm font-semibold text-fg">{t.details}</legend>
          <Field label={t.name} name="name" error={errors.name} className="sm:col-span-2">
            {(props) => <Input {...props} {...text("name")} autoComplete="name" />}
          </Field>
          <Field label={t.email} name="email" error={errors.email}>
            {(props) => <Input {...props} {...text("email")} type="email" autoComplete="email" />}
          </Field>
          <Field label={t.phone} name="phone" error={errors.phone}>
            {(props) => <Input {...props} {...text("phone")} type="tel" autoComplete="tel" />}
          </Field>
          <div className="flex flex-col gap-3 sm:col-span-2">
            <ConsentRow
              name="adult"
              checked={values.adult}
              onChange={(v) => setValue("adult", v)}
              error={errors.adult}
              label={t.adult}
            />
            <ConsentRow
              name="privacy"
              checked={values.privacy}
              onChange={(v) => setValue("privacy", v)}
              error={errors.privacy}
              label={
                <>
                  {t.privacy}{" "}
                  <Link
                    href={routes.privacy}
                    target="_blank"
                    className="text-accent-text underline"
                  >
                    {copy.site.footer.privacy}
                  </Link>
                </>
              }
            />
            <ConsentRow
              name="marketing"
              checked={values.marketing}
              onChange={(v) => setValue("marketing", v)}
              label={t.marketing}
            />
          </div>
        </fieldset>

        <div>
          <Button type="submit" size="lg">
            {t.submit}
          </Button>
        </div>
      </form>
    </Container>
  );
}

function ConsentRow({
  name,
  checked,
  onChange,
  label,
  error,
}: {
  name: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  label: ReactNode;
  error?: string;
}) {
  const errorId = error ? `${name}-error` : undefined;
  return (
    <div>
      <label className="flex items-start gap-3 text-sm text-fg">
        <Checkbox
          name={name}
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className="mt-0.5"
        />
        <span>{label}</span>
      </label>
      {error ? (
        <p id={errorId} className="mt-1 ml-7 text-[13px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
