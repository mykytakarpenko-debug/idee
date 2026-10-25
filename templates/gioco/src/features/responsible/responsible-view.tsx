"use client";

import { HeartHandshake, Phone, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import { copy, HELPLINE } from "@/content/it";
import { routes } from "@/config/navigation";
import { useNow } from "@/hooks/use-now";
import { usePlayer } from "@/hooks/use-player";
import { useZodForm } from "@/hooks/use-zod-form";
import {
  effectiveLimits,
  PAUSE_DAYS,
  playBlock,
  SELF_EXCLUSION_DAYS,
  selfTestResult,
} from "@/lib/domain/responsible";
import { limitsSchema } from "@/lib/domain/schemas";
import type { Limits, Player } from "@/lib/domain/types";
import { centsToInput, formatCurrency, formatDate } from "@/lib/format";
import { useDataStore } from "@/store/data-store";
import { PlayBlockNotice } from "@/components/play/play-block-notice";
import { Container, SectionHeading } from "@/components/site/section";
import { Button, buttonClasses } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

const t = copy.responsible;

/** Informazioni, strumenti di autolimitazione e aiuto. */
export function ResponsibleView() {
  const now = useNow();
  const { player } = usePlayer();

  return (
    <Container className="animate-page-in py-10 sm:py-12">
      <SectionHeading as="h1" title={t.title} description={t.description} />
      <div className="mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-6">
          {player && now ? (
            <>
              <PlayBlockNotice player={player} now={now} />
              <LimitsCard
                key={`${player.id}-${player.limits.depositWeek}-${player.pendingLimits?.effectiveAt ?? ""}`}
                player={player}
                now={now}
              />
              <PauseCard player={player} now={now} />
              <ExclusionCard player={player} now={now} />
            </>
          ) : (
            <Card title={t.limits} icon={<ShieldCheck aria-hidden className="size-5" />}>
              <p className="text-sm text-fg-muted">{t.loginForTools}</p>
              <Link href={routes.login} className={buttonClasses({ className: "mt-4" })}>
                {copy.site.login}
              </Link>
            </Card>
          )}
          <SelfTest />
        </div>
        <aside className="grid gap-6">
          <Card title={t.help} icon={<HeartHandshake aria-hidden className="size-5" />}>
            <p className="text-sm text-fg-muted">{t.helpText}</p>
            <p className="mt-3 text-sm text-fg">
              {HELPLINE.name} ({HELPLINE.owner}), {HELPLINE.hours}.
            </p>
            <a
              href={`tel:${HELPLINE.number}`}
              className={buttonClasses({ className: "mt-4 w-full" })}
            >
              <Phone aria-hidden />
              {t.call(HELPLINE.display)}
            </a>
          </Card>
          <Card title={t.tips}>
            <ul className="grid gap-2 text-sm text-fg">
              {t.tipsList.map((tip) => (
                <li key={tip} className="flex gap-2">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                  {tip}
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </Container>
  );
}

function Card({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="rounded-xl border border-line bg-surface p-5 sm:p-6">
      <h2 id={id} className="flex items-center gap-2 font-display text-lg font-bold text-fg">
        {icon ? <span className="text-accent-text">{icon}</span> : null}
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

const toInput = (value: number | null) =>
  value === null ? "" : centsToInput(value).replace(",00", "");

function LimitsCard({ player, now }: { player: Player; now: Date }) {
  const setLimits = useDataStore((state) => state.setLimits);
  const current = effectiveLimits(player, now);
  const form = useZodForm(limitsSchema, {
    depositDay: toInput(current.depositDay),
    depositWeek: toInput(current.depositWeek),
    depositMonth: toInput(current.depositMonth),
    lossDay: toInput(current.lossDay),
    sessionMinutes: (current.sessionMinutes === null ? "" : String(current.sessionMinutes)) as
      "" | "30" | "60" | "120" | "240",
    realityCheckMinutes: String(player.realityCheckMinutes) as "15" | "30" | "60",
  });
  const { errors, text } = form;
  const money = (value: number | null) =>
    value === null ? copy.common.noLimit : formatCurrency(value);
  const fields: [keyof Limits & keyof typeof errors, string][] = [
    ["depositDay", t.depositDay],
    ["depositWeek", t.depositWeek],
    ["depositMonth", t.depositMonth],
    ["lossDay", t.lossDay],
  ];

  return (
    <Card title={t.limits} icon={<ShieldCheck aria-hidden className="size-5" />}>
      <p className="text-sm text-fg-muted">{t.limitsText}</p>
      {player.pendingLimits ? (
        <p role="status" className="mt-3 rounded-lg bg-info-soft p-3 text-[13px] text-fg">
          {t.pending(formatDate(player.pendingLimits.effectiveAt, "dateTime"))}
        </p>
      ) : null}
      <form
        noValidate
        className="mt-4 grid gap-4 sm:grid-cols-2"
        onSubmit={form.handleSubmit((data) => {
          const { realityCheckMinutes, ...limits } = data;
          const { pendingFrom } = setLimits(player.id, limits, realityCheckMinutes);
          toast.success(pendingFrom ? t.savedPending(formatDate(pendingFrom, "short")) : t.saved);
        })}
      >
        {fields.map(([key, label]) => (
          <Field
            key={key}
            label={label}
            name={key}
            error={errors[key]}
            hint={`${key === "depositWeek" ? "" : `${t.emptyHint} `}${t.current(money(current[key] as number | null))}`}
          >
            {(props) => <Input {...props} {...text(key)} inputMode="decimal" />}
          </Field>
        ))}
        <Field label={t.sessionMinutes} name="sessionMinutes">
          {(props) => (
            <Select {...props} {...text("sessionMinutes")}>
              {Object.entries(t.session).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t.realityCheck} name="realityCheckMinutes">
          {(props) => (
            <Select {...props} {...text("realityCheckMinutes")}>
              {Object.entries(t.reality).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit">{copy.common.save}</Button>
        </div>
      </form>
    </Card>
  );
}

function PauseCard({ player, now }: { player: Player; now: Date }) {
  const pause = useDataStore((state) => state.pause);
  const [days, setDays] = useState<number | null>(null);
  const block = playBlock(player, now);
  return (
    <Card title={t.pause}>
      <p className="text-sm text-fg-muted">{t.pauseText}</p>
      {block?.reason === "pause" ? (
        <p className="mt-3 text-sm font-medium text-fg">
          {t.paused(formatDate(block.until, "dateTime"))}
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {PAUSE_DAYS.map((d) => (
            <Button
              key={d}
              variant="secondary"
              disabled={block !== null}
              onClick={() => setDays(d)}
            >
              {t.pauseFor(d)}
            </Button>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={days !== null}
        onOpenChange={(open) => !open && setDays(null)}
        title={days ? t.pauseTitle(days) : ""}
        description={t.pauseConfirm}
        confirmLabel={copy.common.confirm}
        onConfirm={() => {
          if (days) {
            pause(player.id, days);
            toast.success(
              t.paused(formatDate(new Date(Date.now() + days * 86_400_000), "dateTime")),
            );
          }
          setDays(null);
        }}
      />
    </Card>
  );
}

function ExclusionCard({ player, now }: { player: Player; now: Date }) {
  const selfExclude = useDataStore((state) => state.selfExclude);
  const id = useId();
  const [choice, setChoice] = useState("30");
  const [confirming, setConfirming] = useState(false);
  const block = playBlock(player, now);
  const days = choice === "indefinite" ? null : Number(choice);
  const label = t.exclusionFor(days);
  return (
    <Card title={t.exclusion}>
      <p className="text-sm text-fg-muted">{t.exclusionText}</p>
      {block?.reason === "self_exclusion" ? (
        <p className="mt-3 text-sm font-medium text-fg">{t.excluded}</p>
      ) : (
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-[13px] font-medium text-fg">
              {t.duration}
            </label>
            <Select
              id={id}
              value={choice}
              onChange={(e) => setChoice(e.target.value)}
              className="w-56"
            >
              {SELF_EXCLUSION_DAYS.map((d) => (
                <option key={d ?? "indefinite"} value={d === null ? "indefinite" : String(d)}>
                  {t.exclusionFor(d)}
                </option>
              ))}
            </Select>
          </div>
          <Button variant="danger" onClick={() => setConfirming(true)}>
            {t.exclusion}
          </Button>
        </div>
      )}
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t.exclusionTitle}
        description={t.exclusionConfirm(label)}
        confirmLabel={t.exclusion}
        onConfirm={() => {
          selfExclude(player.id, days);
          toast.success(t.excluded);
          setConfirming(false);
        }}
      />
    </Card>
  );
}

function SelfTest() {
  const [answers, setAnswers] = useState<(boolean | null)[]>([null, null]);
  const [result, setResult] = useState<"ok" | "attention" | null>(null);
  const complete = answers.every((a) => a !== null);
  return (
    <Card title={t.selfTest}>
      <p className="text-sm text-fg-muted">{t.selfTestText}</p>
      <form
        className="mt-4 grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (complete) setResult(selfTestResult(answers as boolean[]));
        }}
      >
        {t.questions.map((question, i) => (
          <fieldset key={question}>
            <legend className="text-sm font-medium text-fg">{question}</legend>
            <div className="mt-2 flex gap-4">
              {[true, false].map((value) => (
                <label
                  key={String(value)}
                  className="flex min-h-11 items-center gap-2 text-sm text-fg"
                >
                  <input
                    type="radio"
                    name={`domanda-${i}`}
                    checked={answers[i] === value}
                    onChange={() => {
                      setAnswers((prev) => prev.map((a, j) => (j === i ? value : a)));
                      setResult(null);
                    }}
                    className="size-4 accent-accent"
                  />
                  {value ? copy.common.yes : copy.common.no}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <Button
          type="submit"
          variant="secondary"
          disabled={!complete}
          className="justify-self-start"
        >
          {t.selfTestSubmit}
        </Button>
        {result ? (
          <p
            role="status"
            className={
              result === "ok"
                ? "rounded-lg bg-success-soft p-3 text-sm text-fg"
                : "rounded-lg bg-warning-soft p-3 text-sm text-fg"
            }
          >
            {result === "ok" ? t.selfTestOk : t.selfTestAttention}
          </p>
        ) : null}
      </form>
    </Card>
  );
}
