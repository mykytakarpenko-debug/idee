"use client";

import { Receipt, X } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useData } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { usePlayer } from "@/hooks/use-player";
import { checkSlip, formatOdds, resolvePick } from "@/lib/domain/betting";
import { parseEurosToCents, formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDataStore } from "@/store/data-store";
import { useSlipStore } from "@/store/slip-store";
import { PlayBlockNotice } from "@/components/play/play-block-notice";
import { Button, buttonClasses } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

const t = copy.slip;

/** Schedina: esiti scelti, importo, quota e vincita potenziale, conferma. */
export function BetSlip({ className, onPlaced }: { className?: string; onPlaced?: () => void }) {
  const stakeId = useId();
  const now = useNow();
  const { player } = usePlayer();
  const { events, settings } = useData((state) => ({
    events: state.events,
    settings: state.settings,
  }));
  const placeBet = useDataStore((state) => state.placeBet);
  const picks = useSlipStore((state) => state.picks);
  const stakeInput = useSlipStore((state) => state.stake);
  const setStake = useSlipStore((state) => state.setStake);
  const remove = useSlipStore((state) => state.remove);
  const clear = useSlipStore((state) => state.clear);
  const [error, setError] = useState<string | null>(null);
  const [lastCode, setLastCode] = useState<string | null>(null);

  const stake = parseEurosToCents(stakeInput);
  const check = now
    ? checkSlip({
        picks,
        events,
        stake: Number.isFinite(stake) ? stake : 0,
        balance: player?.balance ?? Number.MAX_SAFE_INTEGER,
        settings,
        now,
      })
    : null;
  const min = formatCurrency(settings.minStake);
  const max = formatCurrency(settings.maxStake);
  const issueText = (issue: string) => {
    switch (issue) {
      case "too_many":
        return t.issues.too_many(settings.maxLines);
      case "stake_min":
        return t.issues.stake_min(min);
      case "stake_max":
        return t.issues.stake_max(max);
      default:
        return t.issues[issue as "empty" | "same_event" | "unavailable" | "balance" | "blocked"];
    }
  };
  const visibleIssues = (check?.issues ?? []).filter((i) => i !== "empty");

  return (
    <section
      aria-labelledby={`${stakeId}-title`}
      className={cn("rounded-xl border border-line bg-surface", className)}
    >
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h2 id={`${stakeId}-title`} className="font-display text-base font-bold text-fg">
          {t.title}
          {picks.length > 0 ? (
            <span className="ml-2 text-[13px] font-medium text-fg-muted">
              {picks.length === 1 ? t.single : t.multiple(picks.length)}
            </span>
          ) : null}
        </h2>
        {picks.length > 0 ? (
          <Button variant="ghost" size="sm" onClick={clear}>
            {t.clear}
          </Button>
        ) : null}
      </div>

      {picks.length === 0 ? (
        <div className="px-4 py-6 text-sm text-fg-muted">
          <p>{t.empty}</p>
          {lastCode ? (
            <p
              role="status"
              className="mt-3 flex items-center gap-2 rounded-lg bg-success-soft p-3 text-[13px] text-fg"
            >
              <Receipt aria-hidden className="size-4 shrink-0 text-success" />
              <span>
                {t.placed(lastCode)} ·{" "}
                <Link
                  href={routes.account}
                  className="font-medium text-accent-text underline underline-offset-2"
                >
                  {copy.site.account}
                </Link>
              </span>
            </p>
          ) : null}
        </div>
      ) : (
        <>
          <ul className="divide-y divide-line">
            {picks.map((pick) => {
              const r = resolvePick(events, pick);
              const label = r ? `${r.event.home} – ${r.event.away}` : "—";
              return (
                <li key={pick.selectionId} className="flex items-start gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-fg">{label}</p>
                    <p className="text-[13px] text-fg-muted">
                      {r ? `${copy.markets[r.market.kind]}: ` : ""}
                      <span className="font-semibold text-fg">{r?.selection.label}</span>
                    </p>
                  </div>
                  <span className="font-display text-sm font-bold text-fg tabular-nums">
                    {r ? formatOdds(r.selection.odds) : "—"}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t.remove(label)}
                    onClick={() => remove(pick.selectionId)}
                  >
                    <X aria-hidden />
                  </Button>
                </li>
              );
            })}
          </ul>
          <form
            noValidate
            className="grid gap-3 border-t border-line px-4 py-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!player) return;
              setError(null);
              const result = placeBet(player.id, picks, Number.isFinite(stake) ? stake : 0);
              if (!result.ok) {
                const first = result.issues[0]!;
                setError(
                  first === "loss_limit"
                    ? t.issues.loss_limit(formatCurrency(result.remaining ?? 0))
                    : issueText(first),
                );
                return;
              }
              toast.success(t.placed(result.bet.code));
              setLastCode(result.bet.code);
              clear();
              onPlaced?.();
            }}
          >
            <div className="flex flex-col gap-1.5">
              <label htmlFor={stakeId} className="text-[13px] font-medium text-fg">
                {t.stake} (€)
              </label>
              <Input
                id={stakeId}
                inputMode="decimal"
                value={stakeInput}
                onChange={(e) => {
                  setStake(e.target.value);
                  setError(null);
                }}
                aria-describedby={`${stakeId}-hint`}
                className="tabular-nums"
              />
              <p id={`${stakeId}-hint`} className="text-[12px] text-fg-muted">
                {t.stakeHint(min, max)}
              </p>
            </div>
            <dl className="grid gap-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-fg-muted">{t.totalOdds}</dt>
                <dd className="font-display font-bold text-fg tabular-nums">
                  {check ? formatOdds(check.odds) : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-fg-muted">{t.potentialWin}</dt>
                <dd className="font-display font-bold text-fg tabular-nums">
                  {check ? formatCurrency(check.potentialWin) : "—"}
                </dd>
              </div>
            </dl>
            {check?.capped ? (
              <p className="text-[12px] text-fg-muted">
                {t.capped(formatCurrency(settings.maxWin))}
              </p>
            ) : null}
            {visibleIssues.length > 0 || error ? (
              <ul role="alert" className="grid gap-1 text-[13px] text-danger">
                {error ? <li>{error}</li> : null}
                {visibleIssues.map((issue) => (
                  <li key={issue}>{issueText(issue)}</li>
                ))}
              </ul>
            ) : null}
            {player && now ? <PlayBlockNotice player={player} now={now} /> : null}
            {player ? (
              <Button type="submit" size="lg" disabled={visibleIssues.length > 0}>
                {t.place}
              </Button>
            ) : (
              <Link href={routes.login} className={buttonClasses({ size: "lg" })}>
                {t.loginToBet}
              </Link>
            )}
          </form>
        </>
      )}
    </section>
  );
}
