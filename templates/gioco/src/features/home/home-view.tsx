import { ArrowRight, BadgeCheck, HeartHandshake, Megaphone, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { GAMES } from "@/lib/domain/slots";
import { formatPercent } from "@/lib/format";
import { Container, SectionHeading } from "@/components/site/section";
import { buttonClasses } from "@/components/ui/button";
import { statsOf } from "@/features/games/game-stats";
import { UpcomingEvents } from "./upcoming-events";

const t = copy.home;
const ICONS = [BadgeCheck, SlidersHorizontal, Megaphone, HeartHandshake];

export function HomeView() {
  return (
    <>
      <section className="border-b border-line bg-surface">
        <Container className="grid gap-8 py-14 sm:py-20 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="text-sm font-medium text-accent-text">{t.eyebrow}</p>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-balance text-fg sm:text-5xl">
              {t.title}
            </h1>
            <p className="mt-4 max-w-xl text-lg text-fg-muted">{t.text}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={routes.sport} className={buttonClasses({ size: "lg" })}>
                {t.toSport}
              </Link>
              <Link
                href={routes.games}
                className={buttonClasses({ size: "lg", variant: "secondary" })}
              >
                {t.toGames}
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-canvas p-5 sm:p-6">
            <p className="font-display text-lg font-bold text-fg">{copy.responsible.title}</p>
            <ul className="mt-3 grid gap-2 text-sm text-fg">
              {copy.responsible.tipsList.slice(0, 3).map((tip) => (
                <li key={tip} className="flex gap-2">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                  {tip}
                </li>
              ))}
            </ul>
            <Link
              href={routes.responsible}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-text hover:underline"
            >
              {t.rgCta}
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
        </Container>
      </section>

      <Container className="grid gap-12 py-14 lg:grid-cols-2">
        <section aria-labelledby="prossimi-eventi">
          <SectionHeading
            id="prossimi-eventi"
            title={t.upcoming}
            action={
              <Link
                href={routes.sport}
                className="text-sm font-semibold text-accent-text hover:underline"
              >
                {copy.common.viewAll}
              </Link>
            }
          />
          <UpcomingEvents />
        </section>
        <section aria-labelledby="giochi">
          <SectionHeading id="giochi" title={t.games} />
          <ul className="mt-6 grid gap-3">
            {GAMES.map((game) => (
              <li key={game.slug}>
                <Link
                  href={routes.game(game.slug)}
                  className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4 hover:border-accent"
                >
                  <span>
                    <span className="block font-display text-lg font-bold text-fg">
                      {game.name}
                    </span>
                    <span className="block text-[13px] text-fg-muted">{game.tagline}</span>
                  </span>
                  <span className="text-right">
                    <span className="block text-[11px] text-fg-muted">{copy.games.rtpShort}</span>
                    <span className="block font-display font-bold text-fg tabular-nums">
                      {formatPercent(statsOf(game).rtp, 2)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </Container>

      <section aria-labelledby="protezioni" className="border-t border-line bg-surface">
        <Container className="py-14">
          <SectionHeading id="protezioni" title={t.protections} />
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {t.protectionsList.map((item, i) => {
              const Icon = ICONS[i]!;
              return (
                <li key={item.title}>
                  <Icon aria-hidden className="size-6 text-accent-text" />
                  <h3 className="mt-3 font-semibold text-fg">{item.title}</h3>
                  <p className="mt-1 text-sm text-fg-muted">{item.text}</p>
                </li>
              );
            })}
          </ul>
        </Container>
      </section>
    </>
  );
}
