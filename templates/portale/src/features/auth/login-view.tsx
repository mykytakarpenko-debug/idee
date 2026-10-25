"use client";

import { ArrowLeft, Info, KeyRound, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { copy } from "@/content/it";
import { env } from "@/config/env";
import { routes } from "@/config/navigation";
import { useData } from "@/hooks/use-data";
import { useZodForm } from "@/hooks/use-zod-form";
import { DEMO_ACCOUNTS, DEMO_OTP } from "@/lib/demo/seed";
import { lockRemaining, MAX_ATTEMPTS, normalizeOtp, safeEqual } from "@/lib/domain/auth";
import { homeFor } from "@/lib/domain/rbac";
import { loginSchema } from "@/lib/domain/schemas";
import { useDataStore } from "@/store/data-store";
import { useSessionStore } from "@/store/session-store";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const t = copy.auth;

/**
 * Accesso in due passaggi: email e password, poi codice di verifica.
 * In demo la password non viene verificata e il codice è mostrato a schermo:
 * collega un provider di autenticazione prima della produzione.
 */
export function LoginView() {
  const router = useRouter();
  const hydrated = useSessionStore((state) => state.hydrated);
  const userId = useSessionStore((state) => state.userId);
  const pendingUserId = useSessionStore((state) => state.pendingUserId);
  const notice = useSessionStore((state) => state.notice);
  const ready = useDataStore((state) => state.ready);
  const users = useData((state) => state.users);
  const providerName = useData((state) => state.settings.providerName);
  const supportEmail = useData((state) => state.settings.supportEmail);
  const current = users.find((u) => u.id === userId);

  useEffect(() => {
    if (hydrated && ready && current?.status === "active") router.replace(homeFor(current.role));
  }, [hydrated, ready, current, router]);

  const pending = users.find((u) => u.id === pendingUserId) ?? null;

  return (
    <main id="main" className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-page-in">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-fg">
            <LockKeyhole aria-hidden className="size-5" />
          </span>
          <span className="text-[15px] font-semibold text-fg">{providerName}</span>
        </div>
        {notice ? (
          <p role="status" className="mt-6 rounded-lg bg-info-soft p-3 text-[13px] text-fg">
            {notice === "expired" ? t.sessionExpired : t.signedOut}
          </p>
        ) : null}
        {!hydrated || !ready ? (
          <div className="mt-8 h-80" aria-busy="true" />
        ) : pending ? (
          <OtpStep key={pending.id} userId={pending.id} email={pending.email} />
        ) : (
          <PasswordStep />
        )}
        <p className="mt-8 text-[13px] text-fg-muted">
          {t.support(supportEmail)} ·{" "}
          <Link href={routes.privacy} className="text-accent-text underline underline-offset-2">
            {t.privacy}
          </Link>
        </p>
      </div>
    </main>
  );
}

function PasswordStep() {
  const users = useData((state) => state.users);
  const organizations = useData((state) => state.organizations);
  const startLogin = useSessionStore((state) => state.startLogin);
  const form = useZodForm(loginSchema, { email: "", password: "" });
  const { errors, text, setValue, setErrors } = form;

  return (
    <>
      <h1 className="mt-8 text-3xl font-semibold tracking-tight text-fg">{t.title}</h1>
      <p className="mt-2 text-sm text-fg-muted">{t.text}</p>
      <form
        noValidate
        className="mt-6 flex flex-col gap-4"
        onSubmit={form.handleSubmit((data) => {
          // TODO(integrazione): verifica le credenziali sul server (provider di autenticazione).
          const user = users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
          if (!user || user.status === "invited") {
            setErrors({ email: t.invalidCredentials });
            return;
          }
          const orgInactive =
            user.orgId !== null && organizations.some((o) => o.id === user.orgId && !o.active);
          if (user.status === "disabled" || orgInactive) {
            setErrors({ email: t.disabledAccount });
            return;
          }
          startLogin(user.id);
        })}
      >
        <Field label={t.email} name="email" error={errors.email}>
          {(props) => (
            <Input
              {...props}
              {...text("email")}
              type="email"
              autoComplete="username"
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
        <Button type="submit" size="lg">
          {t.submit}
        </Button>
      </form>
      {env.demoMode ? (
        <section
          aria-labelledby="account-demo"
          className="mt-8 rounded-xl border border-line bg-surface p-4"
        >
          <h2 id="account-demo" className="flex items-center gap-2 text-sm font-semibold text-fg">
            <Info aria-hidden className="size-4 text-info" />
            {t.demoTitle}
          </h2>
          <p className="mt-1 text-[13px] text-fg-muted">{t.demoText}</p>
          <ul className="mt-3 grid gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <li key={account.email}>
                <button
                  type="button"
                  onClick={() => {
                    setValue("email", account.email);
                    setValue("password", "demo-password");
                  }}
                  className="flex w-full flex-col items-start rounded-lg border border-line px-3 py-2 text-left hover:border-line-strong/60 hover:bg-surface-2"
                >
                  <span className="text-sm font-medium text-fg">{copy.roles[account.role]}</span>
                  <span className="text-[13px] break-all text-fg-muted">{account.email}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

function OtpStep({ userId, email }: { userId: string; email: string }) {
  const router = useRouter();
  const id = useId();
  const users = useData((state) => state.users);
  const attempts = useSessionStore((state) => state.attempts);
  const completeLogin = useSessionStore((state) => state.completeLogin);
  const failOtp = useSessionStore((state) => state.failOtp);
  const cancelLogin = useSessionStore((state) => state.cancelLogin);
  const markLogin = useDataStore((state) => state.markLogin);
  const log = useDataStore((state) => state.log);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <h1 className="mt-8 text-3xl font-semibold tracking-tight text-fg">{t.otpTitle}</h1>
      <p className="mt-2 text-sm text-fg-muted">{t.otpText(email)}</p>
      {env.demoMode ? (
        <p className="mt-4 flex gap-2 rounded-lg bg-info-soft p-3 text-[13px] text-fg">
          <KeyRound aria-hidden className="mt-0.5 size-4 shrink-0 text-info" />
          {t.otpDemo(DEMO_OTP)}
        </p>
      ) : null}
      <form
        noValidate
        className="mt-6 flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const now = Date.now();
          const locked = lockRemaining(attempts, now);
          if (locked > 0) {
            setError(t.locked(locked));
            return;
          }
          const normalized = normalizeOtp(code);
          if (!normalized) {
            setError(copy.validation.otp);
            return;
          }
          // TODO(integrazione): verifica TOTP o passkey sul server.
          if (!safeEqual(normalized, DEMO_OTP)) {
            failOtp(now);
            const user = users.find((u) => u.id === userId);
            log(userId, "auth.mfa_failed", email, user?.orgId ?? null);
            const left = MAX_ATTEMPTS - (attempts.failures + 1);
            setError(
              left > 0
                ? t.invalidOtp(left)
                : t.locked(lockRemaining({ failures: MAX_ATTEMPTS, lastFailureAt: now }, now)),
            );
            return;
          }
          const user = users.find((u) => u.id === userId);
          completeLogin(now);
          markLogin(userId);
          router.replace(user ? homeFor(user.role) : routes.portal);
        }}
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor={id} className="text-[13px] font-medium text-fg">
            {t.otpLabel}
          </label>
          <Input
            id={id}
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(null);
            }}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={7}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className="font-mono text-lg tracking-[0.3em]"
          />
          {error ? (
            <p id={`${id}-error`} role="alert" className="text-[13px] text-danger">
              {error}
            </p>
          ) : null}
        </div>
        <Button type="submit" size="lg">
          {t.verify}
        </Button>
        <Button type="button" variant="ghost" onClick={cancelLogin}>
          <ArrowLeft aria-hidden />
          {t.back}
        </Button>
      </form>
    </>
  );
}
