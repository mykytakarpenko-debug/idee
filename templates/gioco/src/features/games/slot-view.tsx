"use client";

import { ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useData } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { usePlayer } from "@/hooks/use-player";
import { checkStake } from "@/lib/domain/responsible";
import {
  MIN_SPIN_MS,
  randomStops,
  SYMBOLS,
  visibleGrid,
  type SlotGame,
  type SymbolId,
} from "@/lib/domain/slots";
import { formatCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDataStore } from "@/store/data-store";
import { PlayBlockNotice } from "@/components/play/play-block-notice";
import { SlotSymbol } from "@/components/play/slot-symbol";
import { Container } from "@/components/site/section";
import { Button, buttonClasses } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { statsOf } from "./game-stats";

const t = copy.slot;
const g = copy.games;
const INITIAL_STOPS = [0, 0, 0] as const;

/**
 * Slot demo. Ogni giocata dura almeno 2,5 secondi, non esistono giocate
 * automatiche né "turbo", la puntata è controllata contro saldo e limite di
 * perdita prima di partire e il risultato è annunciato ai lettori di schermo.
 */
export function SlotView({ game }: { game: SlotGame }) {
  const now = useNow();
  const { player } = usePlayer();
  const transactions = useData((state) => state.transactions);
  const spin = useDataStore((state) => state.spin);
  const [bet, setBet] = useState(game.bets[1] ?? game.bets[0]!);
  const [grid, setGrid] = useState<SymbolId[][]>(() => visibleGrid(game, INITIAL_STOPS));
  const [spinning, setSpinning] = useState(false);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stats = statsOf(game);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const play = () => {
    if (!player || spinning) return;
    setError(null);
    const check = checkStake(bet, player, transactions, new Date());
    if (!check.ok) {
      setError(
        check.reason === "loss_limit"
          ? copy.slip.issues.loss_limit(formatCurrency(check.remaining))
          : check.reason === "balance"
            ? copy.slip.issues.balance
            : copy.slip.issues.blocked,
      );
      if (check.reason === "loss_limit")
        useDataStore.getState().logRg(player.id, "limit_hit", "Limite di perdita giornaliero");
      return;
    }
    // In produzione: richiesta al server, che estrae il risultato e lo registra.
    const stops = randomStops(game);
    setSpinning(true);
    setAnnouncement(t.playing);
    timer.current = setTimeout(() => {
      const result = spin(player.id, game.slug, bet, stops);
      setSpinning(false);
      if (!result.ok) {
        setError(copy.slip.issues.blocked);
        setAnnouncement("");
        return;
      }
      setGrid(result.outcome.grid);
      setLastWin(result.outcome.win);
      const symbols = result.outcome.line.map((s) => SYMBOLS[s].label).join(", ");
      setAnnouncement(
        t.result(
          symbols,
          result.outcome.win > 0 ? t.win(formatCurrency(result.outcome.win)) : t.noWin,
        ),
      );
    }, MIN_SPIN_MS);
  };

  const blocked = Boolean(player && now && !checkStakeAllowed(player, now));

  return (
    <Container className="animate-page-in py-10 sm:py-12">
      <Link
        href={routes.games}
        className="inline-flex min-h-6 items-center gap-1.5 text-[13px] font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeft aria-hidden className="size-4" />
        {copy.games.title}
      </Link>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-fg">{game.name}</h1>
      <p className="mt-2 text-fg-muted">{game.description}</p>

      <div className="mt-8 grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_360px]">
        <section
          aria-label={game.name}
          className="rounded-2xl border border-line bg-surface p-4 sm:p-6"
        >
          <div className="relative mx-auto grid max-w-md grid-cols-3 gap-2 rounded-xl bg-reel p-2 sm:gap-3 sm:p-3">
            {grid.map((column, reel) => (
              <div
                key={reel}
                role="img"
                aria-label={`${t.reel(reel + 1)}: ${SYMBOLS[column[1]!].label}`}
                className="overflow-hidden rounded-lg border border-line bg-surface"
              >
                <div
                  className={cn("grid grid-rows-3", spinning && "animate-slot-spin")}
                  style={{ animationDelay: `${reel * 120}ms` }}
                >
                  {column.map((symbol, row) => (
                    <div
                      key={row}
                      className={cn(
                        "flex aspect-square items-center justify-center",
                        row === 1 ? "bg-accent-soft/60" : "opacity-45",
                        spinning && "blur-[1px]",
                      )}
                    >
                      <SlotSymbol id={symbol} className="size-[70%]" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {/* Linea di pagamento sulla riga centrale. */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-1 top-1/2 h-0.5 -translate-y-1/2 rounded bg-accent/70"
            />
          </div>

          <p aria-live="polite" className="sr-only">
            {announcement}
          </p>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[12px] text-fg-muted">{t.lastWin}</p>
              <p className="font-display text-2xl font-bold text-fg tabular-nums">
                {lastWin === null ? "—" : formatCurrency(lastWin)}
              </p>
            </div>
            {player ? (
              <div className="text-right">
                <p className="text-[12px] text-fg-muted">{copy.site.balance}</p>
                <p className="font-display text-2xl font-bold text-fg tabular-nums">
                  {formatCurrency(player.balance)}
                </p>
              </div>
            ) : null}
          </div>

          <div className="mt-5 grid gap-4">
            <div>
              <p id="puntata" className="mb-1.5 text-[13px] font-medium text-fg">
                {t.bet}
              </p>
              <SegmentedControl
                ariaLabel={t.bet}
                value={String(bet)}
                onChange={(value) => setBet(Number(value))}
                options={game.bets.map((b) => ({ value: String(b), label: formatCurrency(b) }))}
              />
            </div>
            {error ? (
              <p role="alert" className="text-[13px] text-danger">
                {error}
              </p>
            ) : null}
            {player && now ? <PlayBlockNotice player={player} now={now} /> : null}
            {player ? (
              <Button
                size="lg"
                onClick={play}
                disabled={spinning || blocked}
                className="w-full sm:w-auto sm:min-w-48"
              >
                {spinning ? t.playing : t.play}
              </Button>
            ) : (
              <Link
                href={routes.login}
                className={buttonClasses({ size: "lg", className: "w-full sm:w-auto" })}
              >
                {t.loginToPlay}
              </Link>
            )}
            <p className="flex items-start gap-2 text-[12px] text-fg-muted">
              <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
              {t.noAutoplay}
            </p>
          </div>
        </section>

        <aside className="grid gap-4">
          <section
            aria-labelledby="dati-gioco"
            className="rounded-xl border border-line bg-surface p-5"
          >
            <h2 id="dati-gioco" className="font-display text-base font-bold text-fg">
              {copy.site.probability}
            </h2>
            <dl className="mt-3 grid gap-2 text-sm">
              <Row label={g.rtp} value={formatPercent(stats.rtp, 2)} />
              <Row label={g.hitRate} value={formatPercent(stats.hitRate, 1)} />
              <Row label={g.volatility} value={g.volatilityValue[game.volatility]} />
              <Row label={g.maxWin} value={t.times(stats.maxMultiplier)} />
            </dl>
            <p className="mt-3 text-[12px] text-fg-muted">{g.rtpNote}</p>
          </section>
          <section
            aria-labelledby="tabella-pagamenti"
            className="rounded-xl border border-line bg-surface p-5"
          >
            <h2 id="tabella-pagamenti" className="font-display text-base font-bold text-fg">
              {t.paytable}
            </h2>
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="text-left text-[12px] text-fg-muted">
                  <th scope="col" className="pb-2 font-medium">
                    {t.combination}
                  </th>
                  <th scope="col" className="pb-2 text-right font-medium">
                    {t.pays}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {paytable(game).map(([label, symbol, multiplier]) => (
                  <tr key={label}>
                    <th scope="row" className="py-1.5 text-left font-normal text-fg">
                      <span className="flex items-center gap-2">
                        <SlotSymbol id={symbol} className="size-6" />
                        {label}
                      </span>
                    </th>
                    <td className="py-1.5 text-right font-medium text-fg tabular-nums">
                      {t.times(multiplier)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-[12px] text-fg-muted">{t.rngNote}</p>
          </section>
        </aside>
      </div>
    </Container>
  );
}

function checkStakeAllowed(player: Parameters<typeof checkStake>[1], now: Date) {
  return checkStake(0, player, [], now).ok;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-fg-muted">{label}</dt>
      <dd className="font-medium text-fg tabular-nums">{value}</dd>
    </div>
  );
}

function paytable(game: SlotGame): [string, SymbolId, number][] {
  const rows = (Object.entries(game.pays) as [SymbolId, number][])
    .sort((a, b) => b[1] - a[1])
    .map(
      ([symbol, m]) => [t.threeOf(SYMBOLS[symbol].plural), symbol, m] as [string, SymbolId, number],
    );
  if (game.cherry.two > 0) rows.push([t.cherryTwo, "ciliegia", game.cherry.two]);
  if (game.cherry.one > 0) rows.push([t.cherryOne, "ciliegia", game.cherry.one]);
  return rows;
}
