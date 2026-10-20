"use client";

import { Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { copy } from "@/content/it";
import { env } from "@/config/env";
import { routes } from "@/config/navigation";
import { useZodForm } from "@/hooks/use-zod-form";
import { DEMO_MEMBER_ID } from "@/lib/demo/seed";
import { loginSchema } from "@/lib/domain/schemas";
import { useSessionStore } from "@/store/session-store";
import { Container } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const t = copy.login;

/**
 * Accesso all'area socio. In demo entra sempre come il socio di esempio:
 * collega un provider di autenticazione prima della produzione.
 */
export function LoginView() {
  const router = useRouter();
  const signIn = useSessionStore((state) => state.signIn);
  const [submitting, setSubmitting] = useState(false);
  const form = useZodForm(
    loginSchema,
    env.demoMode
      ? { email: "chiara.colombo@example.com", password: "demo-password" }
      : { email: "", password: "" },
  );
  const { errors, text } = form;

  const onSubmit = form.handleSubmit(() => {
    // TODO(integrazione): verifica le credenziali con il provider e imposta un cookie HttpOnly.
    setSubmitting(true);
    signIn(DEMO_MEMBER_ID);
    router.push(routes.member);
  });

  return (
    <Container className="flex justify-center py-16 sm:py-24">
      <div className="w-full max-w-sm animate-page-in">
        <h1 className="font-display text-3xl font-bold tracking-tight text-fg">{t.title}</h1>
        <p className="mt-2 text-sm text-fg-muted">{t.description}</p>
        {env.demoMode ? (
          <p className="mt-6 flex gap-2 rounded-lg bg-info-soft p-3 text-[13px] text-info">
            <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
            {t.demoHint}
          </p>
        ) : null}
        <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-4">
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
              <Input
                {...props}
                {...text("password")}
                type="password"
                autoComplete="current-password"
              />
            )}
          </Field>
          <Button type="submit" size="lg" loading={submitting}>
            {t.submit}
          </Button>
        </form>
        <p className="mt-6 text-[13px] text-fg-muted">{t.forgot}</p>
      </div>
    </Container>
  );
}
