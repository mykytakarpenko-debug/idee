"use client";

import { CircleCheck, Info } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { copy } from "@/content/it";
import { env } from "@/config/env";
import { routes } from "@/config/navigation";
import { useZodForm } from "@/hooks/use-zod-form";
import { contactSchema, HONEYPOT_FIELD, TEAM_SIZES } from "@/lib/contact";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/input";

const t = copy.contact;
type ContactValues = z.output<typeof contactSchema>;

/** Modulo contatti: validazione nel browser e di nuovo sul server (/api/contatti). */
export function ContactForm() {
  const params = useSearchParams();
  const plan = params.get("piano");
  const startedAt = useRef(0);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error" | "rate">("idle");
  const form = useZodForm(contactSchema, {
    name: "",
    email: "",
    company: "",
    teamSize: "6-20",
    message: plan
      ? `Vorrei sapere di più sul piano ${plan.charAt(0).toUpperCase()}${plan.slice(1)}.`
      : "",
    newsletter: false,
  });
  const { values, errors, text, setValue, setErrors } = form;

  useEffect(() => {
    startedAt.current = performance.now();
  }, []);

  const send = async (data: ContactValues, trap: string, elapsedMs: number) => {
    setStatus("sending");
    try {
      const response = await fetch("/api/contatti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, [HONEYPOT_FIELD]: trap, elapsedMs }),
      });
      if (response.status === 429) {
        setStatus("rate");
        return;
      }
      const result = (await response.json()) as { ok: boolean; errors?: Record<string, string> };
      if (!result.ok) {
        if (result.errors) setErrors(result.errors as typeof errors);
        setStatus(result.errors ? "idle" : "error");
        return;
      }
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div role="status" className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <CircleCheck aria-hidden className="size-8 text-accent-text" />
        <h2 className="mt-4 text-xl font-semibold text-fg">{t.sent}</h2>
        <p className="mt-2 text-fg-muted">{t.sentText}</p>
        <Button
          variant="secondary"
          className="mt-6"
          onClick={() => {
            startedAt.current = performance.now();
            setStatus("idle");
          }}
        >
          {t.another}
        </Button>
      </div>
    );
  }

  return (
    <form
      noValidate
      className="grid gap-4 rounded-2xl border border-line bg-surface p-6 sm:p-8"
      onSubmit={(event) => {
        // Letture fatte nell'evento di invio, non durante il render.
        const trap =
          (event.currentTarget.elements.namedItem(HONEYPOT_FIELD) as HTMLInputElement | null)
            ?.value ?? "";
        const elapsedMs = Math.round(performance.now() - startedAt.current);
        form.handleSubmit((data) => void send(data, trap, elapsedMs))(event);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.name} name="name" error={errors.name}>
          {(props) => <Input {...props} {...text("name")} autoComplete="name" />}
        </Field>
        <Field label={t.email} name="email" error={errors.email}>
          {(props) => <Input {...props} {...text("email")} type="email" autoComplete="email" />}
        </Field>
        <Field label={t.company} name="company" optional error={errors.company}>
          {(props) => <Input {...props} {...text("company")} autoComplete="organization" />}
        </Field>
        <Field label={t.teamSize} name="teamSize">
          {(props) => (
            <Select {...props} {...text("teamSize")}>
              {TEAM_SIZES.map((size) => (
                <option key={size} value={size}>
                  {t.teamSizes[size]}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <Field label={t.message} name="message" hint={t.messageHint} error={errors.message}>
        {(props) => <Textarea {...props} {...text("message")} rows={5} maxLength={2000} />}
      </Field>

      {/* Campo trappola per i bot: nascosto a persone e tecnologie assistive. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={HONEYPOT_FIELD}>{t.honeypot}</label>
        <input
          id={HONEYPOT_FIELD}
          name={HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <label className="flex items-start gap-3 text-sm text-fg">
        <Checkbox
          className="mt-0.5"
          checked={values.newsletter}
          onChange={(e) => setValue("newsletter", e.target.checked)}
        />
        {t.newsletter}
      </label>
      <p className="text-[13px] text-fg-muted">
        {t.privacyNote}{" "}
        <Link href={routes.privacy} className="text-accent-text underline underline-offset-2">
          {t.privacyLink}
        </Link>
      </p>
      {status === "error" || status === "rate" ? (
        <p role="alert" className="text-sm text-danger">
          {status === "rate" ? t.tooMany : t.error}
        </p>
      ) : null}
      <Button
        type="submit"
        size="lg"
        disabled={status === "sending"}
        className="sm:justify-self-start"
      >
        {status === "sending" ? t.sending : t.submit}
      </Button>
      {env.demoMode ? (
        <p className="flex gap-2 text-[13px] text-fg-muted">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-info" />
          {t.demoNote}
        </p>
      ) : null}
    </form>
  );
}
