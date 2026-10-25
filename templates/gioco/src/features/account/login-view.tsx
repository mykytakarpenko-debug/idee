"use client";

import { Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { copy } from "@/content/it";
import { env } from "@/config/env";
import { routes } from "@/config/navigation";
import { useData } from "@/hooks/use-data";
import { usePlayer } from "@/hooks/use-player";
import { useZodForm } from "@/hooks/use-zod-form";
import { DEMO_EMAIL } from "@/lib/demo/seed";
import { loginSchema } from "@/lib/domain/schemas";
import { formatDate } from "@/lib/format";
import { useDataStore } from "@/store/data-store";
import { useSessionStore } from "@/store/session-store";
import { Container } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const t = copy.auth;

/** Accesso al conto di gioco (in demo la password non viene verificata). */
export function LoginView() {
  const router = useRouter();
  const { player, loading } = usePlayer();
  const players = useData((state) => state.players);
  const notice = useSessionStore((state) => state.notice);
  const form = useZodForm(
    loginSchema,
    env.demoMode ? { email: DEMO_EMAIL, password: "demo-password" } : { email: "", password: "" },
  );
  const { errors, text, setErrors } = form;

  useEffect(() => {
    if (!loading && player) router.replace(routes.account);
  }, [loading, player, router]);

  return (
    <Container className="max-w-md animate-page-in py-12 sm:py-16">
      <h1 className="font-display text-4xl font-bold tracking-tight text-fg">{t.title}</h1>
      <p className="mt-2 text-fg-muted">{t.text}</p>
      {notice ? (
        <p role="status" className="mt-6 rounded-lg bg-info-soft p-3 text-[13px] text-fg">
          {notice === "session_limit" ? t.sessionLimit : t.signedOut}
        </p>
      ) : null}
      <form
        noValidate
        className="mt-6 grid gap-4"
        onSubmit={form.handleSubmit((data) => {
          // TODO(integrazione): verifica delle credenziali sul server.
          const found = players.find((p) => p.email.toLowerCase() === data.email.toLowerCase());
          if (!found) {
            setErrors({ email: t.invalid });
            return;
          }
          if (found.cooldownUntil && new Date(found.cooldownUntil) > new Date()) {
            setErrors({ email: t.cooldown(formatDate(found.cooldownUntil, "time")) });
            return;
          }
          const sessionId = useDataStore.getState().startSession(found.id);
          if (!sessionId) return;
          useSessionStore.getState().signIn(found.id, sessionId);
          router.push(routes.account);
        })}
      >
        <Field label={t.email} name="email" error={errors.email}>
          {(props) => <Input {...props} {...text("email")} type="email" autoComplete="username" />}
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
        <Button type="submit" size="lg">
          {t.submit}
        </Button>
      </form>
      {env.demoMode ? (
        <p className="mt-4 flex gap-2 text-[13px] text-fg-muted">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-info" />
          {t.demo}
        </p>
      ) : null}
      <p className="mt-8 text-sm text-fg-muted">
        {t.noAccount}{" "}
        <Link
          href={routes.register}
          className="font-medium text-accent-text underline underline-offset-2"
        >
          {t.register}
        </Link>
      </p>
    </Container>
  );
}
