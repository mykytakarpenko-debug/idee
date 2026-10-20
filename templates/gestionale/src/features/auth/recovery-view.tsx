"use client";

import { ArrowLeft, MailCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useZodForm } from "@/hooks/use-zod-form";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/layout/logo";

const t = copy.auth.recovery;
const schema = z.object({
  email: z
    .string()
    .trim()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, copy.validation.email),
});

/**
 * Recupero password. Il messaggio di conferma è identico che l'account esista
 * o meno: così non si rivela quali email sono registrate (enumerazione account).
 */
export function RecoveryView() {
  const [sent, setSent] = useState(false);
  const form = useZodForm(schema, { email: "" });

  const onSubmit = form.handleSubmit(() => {
    // TODO(integrazione): chiamare l'endpoint del provider di autenticazione.
    setSent(true);
  });

  return (
    <main id="main" className="flex min-h-dvh flex-col px-6 py-8 sm:px-10">
      <Logo />
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
        {sent ? (
          <div role="status" className="animate-page-in">
            <span className="flex size-12 items-center justify-center rounded-full bg-success-soft text-success">
              <MailCheck aria-hidden className="size-6" />
            </span>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-fg">{t.sent}</h1>
            <p className="mt-2 text-sm text-fg-muted">{t.sentBody}</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-fg">{t.title}</h1>
            <p className="mt-2 text-sm text-fg-muted">{t.subtitle}</p>
            <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-4">
              <Field label={copy.auth.email} name="email" error={form.errors.email}>
                {(props) => (
                  <Input
                    {...props}
                    {...form.text("email")}
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                  />
                )}
              </Field>
              <Button type="submit" size="lg" className="w-full">
                {t.submit}
              </Button>
            </form>
          </>
        )}
        <Link
          href={routes.login}
          className="mt-8 inline-flex items-center gap-1.5 self-start rounded text-sm font-medium text-fg-muted hover:text-fg"
        >
          <ArrowLeft aria-hidden className="size-4" />
          {t.back}
        </Link>
      </div>
    </main>
  );
}
