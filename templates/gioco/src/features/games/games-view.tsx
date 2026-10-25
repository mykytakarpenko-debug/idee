import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { GAMES, type SymbolId } from "@/lib/domain/slots";
import { formatCurrency, formatPercent } from "@/lib/format";
import { SlotSymbol } from "@/components/play/slot-symbol";
import { Container, SectionHeading } from "@/components/site/section";
import { statsOf } from "./game-stats";

const t = copy.games;
const PREVIEW: Record<string, SymbolId[]> = {
  frutteto: ["ciliegia", "limone", "campana"],
  "sette-doro": ["sette", "stella", "sette"],
};

/** Elenco dei giochi con RTP, frequenza di vincita e volatilità (contenuto statico). */
export function GamesView() {
  return (
    <Container className="animate-page-in py-10 sm:py-12">
      <SectionHeading as="h1" title={t.title} description={t.description} />
      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {GAMES.map((game) => {
          const stats = statsOf(game);
          return (
            <li key={game.slug}>
              <article className="flex h-full flex-col rounded-xl border border-line bg-surface p-5">
                <div className="flex justify-center gap-2 rounded-lg bg-reel p-4">
                  {(PREVIEW[game.slug] ?? PREVIEW.frutteto!).map((symbol, i) => (
                    <SlotSymbol key={i} id={symbol} />
                  ))}
                </div>
                <h2 className="mt-4 font-display text-xl font-bold text-fg">{game.name}</h2>
                <p className="mt-1 text-sm text-fg-muted">{game.tagline}</p>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div>
                    <dt className="text-[12px] text-fg-muted">{t.rtp}</dt>
                    <dd className="font-display text-lg font-bold text-fg tabular-nums">
                      {formatPercent(stats.rtp, 2)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[12px] text-fg-muted">{t.hitRate}</dt>
                    <dd className="font-display text-lg font-bold text-fg tabular-nums">
                      {formatPercent(stats.hitRate, 1)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[12px] text-fg-muted">{t.volatility}</dt>
                    <dd className="text-fg">{t.volatilityValue[game.volatility]}</dd>
                  </div>
                  <div>
                    <dt className="text-[12px] text-fg-muted">{t.maxWin}</dt>
                    <dd className="text-fg">{copy.slot.times(stats.maxMultiplier)}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-[13px] text-fg-muted">
                  {t.bets(formatCurrency(game.bets[0]!), formatCurrency(game.bets.at(-1)!))}
                </p>
                <Link
                  href={routes.game(game.slug)}
                  className="mt-5 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-accent-text hover:underline"
                >
                  {t.open(game.name)}
                  <ArrowRight aria-hidden className="size-4" />
                </Link>
              </article>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 max-w-2xl text-[13px] text-fg-muted">{t.rtpNote}</p>
    </Container>
  );
}
