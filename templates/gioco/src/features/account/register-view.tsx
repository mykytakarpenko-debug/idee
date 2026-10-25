"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { copy } from "@/content/it";
import { env } from "@/config/env";
import { routes } from "@/config/navigation";
import { useZodForm } from "@/hooks/use-zod-form";
import { demoFiscalCode } from "@/lib/demo/seed";
import { toISODate } from "@/lib/domain/dates";
import { registrationSchema } from "@/lib/domain/schemas";
import type { DocumentType } from "@/lib/domain/types";
import { useDataStore } from "@/store/data-store";
import { useSessionStore } from "@/store/session-store";
import { Container } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Checkbox, Input, Select } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

const t = copy.register;
const schema = registrationSchema(() => toISODate(new Date()));
const DOCUMENTS = Object.keys(copy.documentTypes) as DocumentType[];

/**
 * Apertura del conto: dati anagrafici con codice fiscale coerente con la data di
 * nascita, documento, limite di ricarica settimanale obbligatorio, consensi.
 */
export function RegisterView() {
  const router = useRouter();
  const register = useDataStore((state) => state.register);
  const startSession = useDataStore((state) => state.startSession);
  const form = useZodForm(schema, {
    firstName: "",
    lastName: "",
    birthDate: "",
    fiscalCode: "",
    city: "",
    email: "",
    password: "",
    documentType: "carta_identita",
    documentNumber: "",
    documentExpiresOn: "",
    depositWeek: "100",
    terms: false,
    privacy: false,
  });
  const { values, errors, text, setValue, setErrors } = form;

  const fillDemo = () => {
    const year = new Date().getFullYear() + 3;
    const entries: [keyof typeof values, string | boolean][] = [
      ["firstName", "Laura"],
      ["lastName", "Neri"],
      ["birthDate", "1995-03-08"],
      ["fiscalCode", demoFiscalCode("Laura", "Neri", "1995-03-08", true)],
      ["city", "Bologna"],
      ["email", "laura.neri@example.com"],
      ["password", "password-demo-1"],
      ["documentNumber", "CA12345BB"],
      ["documentExpiresOn", `${year}-05-31`],
    ];
    for (const [key, value] of entries) setValue(key, value as never);
  };

  return (
    <Container className="max-w-2xl animate-page-in py-12 sm:py-16">
      <h1 className="font-display text-4xl font-bold tracking-tight text-fg">{t.title}</h1>
      <p className="mt-2 text-fg-muted">{t.text}</p>
      {env.demoMode ? (
        <Button variant="secondary" size="sm" className="mt-4" onClick={fillDemo}>
          {t.demoFill}
        </Button>
      ) : null}
      <form
        noValidate
        className="mt-8 grid gap-8"
        onSubmit={form.handleSubmit((data) => {
          const created = register({ ...data, documentType: data.documentType });
          if (!created) {
            setErrors({ email: t.duplicate });
            return;
          }
          const sessionId = startSession(created.id);
          if (sessionId) useSessionStore.getState().signIn(created.id, sessionId);
          toast.success(t.created);
          router.push(routes.account);
        })}
      >
        <Fieldset legend={t.personal}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.firstName} name="firstName" error={errors.firstName}>
              {(props) => <Input {...props} {...text("firstName")} autoComplete="given-name" />}
            </Field>
            <Field label={t.lastName} name="lastName" error={errors.lastName}>
              {(props) => <Input {...props} {...text("lastName")} autoComplete="family-name" />}
            </Field>
            <Field label={t.birthDate} name="birthDate" error={errors.birthDate}>
              {(props) => (
                <Input {...props} {...text("birthDate")} type="date" autoComplete="bday" />
              )}
            </Field>
            <Field label={t.fiscalCode} name="fiscalCode" error={errors.fiscalCode}>
              {(props) => (
                <Input
                  {...props}
                  {...text("fiscalCode")}
                  autoCapitalize="characters"
                  maxLength={16}
                  className="font-mono uppercase"
                />
              )}
            </Field>
            <Field label={t.city} name="city" error={errors.city}>
              {(props) => <Input {...props} {...text("city")} autoComplete="address-level2" />}
            </Field>
            <Field label={t.email} name="email" error={errors.email}>
              {(props) => <Input {...props} {...text("email")} type="email" autoComplete="email" />}
            </Field>
            <Field label={t.password} name="password" hint={t.passwordHint} error={errors.password}>
              {(props) => (
                <Input
                  {...props}
                  {...text("password")}
                  type="password"
                  autoComplete="new-password"
                />
              )}
            </Field>
          </div>
        </Fieldset>

        <Fieldset legend={t.document} description={t.documentNote}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t.documentType} name="documentType">
              {(props) => (
                <Select {...props} {...text("documentType")}>
                  {DOCUMENTS.map((d) => (
                    <option key={d} value={d}>
                      {copy.documentTypes[d]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={t.documentNumber} name="documentNumber" error={errors.documentNumber}>
              {(props) => (
                <Input {...props} {...text("documentNumber")} autoCapitalize="characters" />
              )}
            </Field>
            <Field
              label={t.documentExpiresOn}
              name="documentExpiresOn"
              error={errors.documentExpiresOn}
            >
              {(props) => <Input {...props} {...text("documentExpiresOn")} type="date" />}
            </Field>
          </div>
        </Fieldset>

        <Fieldset legend={t.limits} description={t.limitsText}>
          <Field
            label={t.depositWeek}
            name="depositWeek"
            error={errors.depositWeek}
            className="sm:max-w-xs"
          >
            {(props) => <Input {...props} {...text("depositWeek")} inputMode="decimal" />}
          </Field>
        </Fieldset>

        <Fieldset legend={t.consents}>
          <div className="grid gap-3">
            {(["terms", "privacy"] as const).map((key) => (
              <div key={key}>
                <label className="flex items-start gap-3 text-sm text-fg">
                  <Checkbox
                    className="mt-0.5"
                    checked={values[key]}
                    onChange={(e) => setValue(key, e.target.checked)}
                    aria-invalid={errors[key] ? true : undefined}
                    aria-describedby={errors[key] ? `${key}-error` : undefined}
                  />
                  <span>
                    {t[key]} (
                    <Link
                      href={key === "terms" ? routes.terms : routes.privacy}
                      className="text-accent-text underline underline-offset-2"
                    >
                      {key === "terms" ? copy.legal.terms : copy.legal.privacy}
                    </Link>
                    )
                  </span>
                </label>
                {errors[key] ? (
                  <p id={`${key}-error`} className="mt-1 ml-7 text-[13px] text-danger">
                    {errors[key]}
                  </p>
                ) : null}
              </div>
            ))}
            <p className="text-[13px] text-fg-muted">{t.adultNote}</p>
          </div>
        </Fieldset>

        <Button type="submit" size="lg" className="sm:justify-self-start">
          {t.submit}
        </Button>
      </form>
    </Container>
  );
}

function Fieldset({
  legend,
  description,
  children,
}: {
  legend: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="grid gap-4 rounded-xl border border-line bg-surface p-5 sm:p-6">
      <legend className="sr-only">{legend}</legend>
      <div aria-hidden>
        <p className="font-display text-lg font-bold text-fg">{legend}</p>
        {description ? <p className="mt-1 text-[13px] text-fg-muted">{description}</p> : null}
      </div>
      {children}
    </fieldset>
  );
}
