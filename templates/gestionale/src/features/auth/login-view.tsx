"use client";

import { CalendarCheck, ChartColumn, Eye, EyeOff, Info, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { brand } from "@/config/brand";
import { env } from "@/config/env";
import { routes } from "@/config/navigation";
import { copy } from "@/content/it";
import { useZodForm } from "@/hooks/use-zod-form";
import { loginFormSchema } from "@/lib/domain/schemas";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Checkbox, Input } from "@/components/ui/input";
import { Logo } from "@/components/layout/logo";

const t = copy.auth;

const highlightIcons = [CalendarCheck, Users, ChartColumn, ShieldCheck];

/**
 * Schermata di accesso. In modalità demo non verifica le credenziali:
 * collega un provider (Auth.js, Clerk, Supabase…) prima della produzione.
 */
export function LoginView() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const form = useZodForm(loginFormSchema, { email: "", password: "", remember: true });
  const { errors, text } = form;

  const enter = () => {
    setSubmitting(true);
    router.push(routes.dashboard);
  };

  const onSubmit = form.handleSubmit(() => {
    // TODO(integrazione): sostituire con la chiamata al provider di autenticazione.
    enter();
  });

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <main id="main" className="flex flex-col px-6 py-8 sm:px-10">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="text-2xl font-semibold tracking-tight text-fg">{t.title}</h1>
          <p className="mt-2 text-sm text-fg-muted">{t.subtitle}</p>

          <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-4">
            <Field label={t.email} name="email" error={errors.email}>
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
            <Field label={t.password} name="password" error={errors.password}>
              {(props) => (
                <div className="relative">
                  <Input
                    {...props}
                    {...text("password")}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? t.hidePassword : t.showPassword}
                    aria-pressed={showPassword}
                    className="absolute top-1/2 right-1.5 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg"
                  >
                    {showPassword ? (
                      <EyeOff aria-hidden className="size-4" />
                    ) : (
                      <Eye aria-hidden className="size-4" />
                    )}
                  </button>
                </div>
              )}
            </Field>
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-fg">
                <Checkbox
                  name="remember"
                  checked={form.values.remember}
                  onChange={(event) => form.setValue("remember", event.target.checked)}
                />
                {t.remember}
              </label>
              <Link
                href={routes.passwordRecovery}
                className="rounded text-sm font-medium text-accent-text hover:underline"
              >
                {t.forgot}
              </Link>
            </div>
            <Button type="submit" size="lg" loading={submitting} className="mt-2 w-full">
              {submitting ? t.submitting : t.submit}
            </Button>
          </form>

          {env.demoMode ? (
            <>
              <div className="my-6 flex items-center gap-3 text-xs text-fg-muted" aria-hidden>
                <span className="h-px flex-1 bg-line" />
                {t.or}
                <span className="h-px flex-1 bg-line" />
              </div>
              <Button
                variant="secondary"
                size="lg"
                className="w-full"
                onClick={enter}
                disabled={submitting}
              >
                {t.demo}
              </Button>
              <p className="mt-4 flex gap-2 rounded-lg bg-info-soft p-3 text-[13px] text-fg">
                <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-info" />
                {t.demoNote}
              </p>
            </>
          ) : null}
        </div>
        <p className="text-center text-xs text-fg-muted">{t.legal}</p>
      </main>

      <aside
        className="hidden flex-col justify-center border-l border-line bg-surface-2/60 px-14 py-12 lg:flex"
        aria-label={brand.name}
      >
        <div className="max-w-md">
          <p className="text-sm font-medium text-accent-text">{brand.name}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance text-fg">
            {brand.tagline}
          </h2>
          <ul className="mt-10 flex flex-col gap-6">
            {t.highlights.map(({ title, text }, index) => {
              const Icon = highlightIcons[index] ?? ShieldCheck;
              return (
                <li key={title} className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-accent-text shadow-xs">
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-fg">{title}</p>
                    <p className="mt-0.5 text-sm text-fg-muted">{text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </div>
  );
}
