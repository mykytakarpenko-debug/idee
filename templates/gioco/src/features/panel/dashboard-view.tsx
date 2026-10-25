"use client";

import { Activity, CircleDollarSign, Receipt, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useData } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { dailyActivity, operatorKpis } from "@/lib/domain/analytics";
import { riskSignals } from "@/lib/domain/responsible";
import { formatCurrency, formatCurrencyCompact, formatDate, formatNumber } from "@/lib/format";
import { ColumnChart } from "@/components/charts/column-chart";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Page, PageHeader } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";

const t = copy.panel.dashboard;

export function DashboardView() {
  const now = useNow();
  const data = useData((state) => ({
    ready: state.ready,
    settings: state.settings,
    events: state.events,
    players: state.players,
    bets: state.bets,
    transactions: state.transactions,
    spins: state.spins,
    sessions: state.sessions,
    rgEvents: state.rgEvents,
  }));

  const view = useMemo(() => {
    if (!now || !data.ready) return null;
    const flagged = data.players
      .map((player) => ({
        player,
        signals: riskSignals({
          player,
          transactions: data.transactions,
          sessions: data.sessions,
          rgEvents: data.rgEvents,
          now,
        }),
      }))
      .filter((row) => row.signals.length > 0);
    return {
      kpis: operatorKpis(data, now),
      days: dailyActivity(data.transactions, now, 30),
      flagged,
      pending: data.players.filter((p) => p.kyc === "pending"),
    };
  }, [data, now]);

  if (!view || !now) {
    return (
      <Page>
        <PageHeader title={t.title} description={t.description} />
        <Skeleton className="h-96" aria-busy="true" />
      </Page>
    );
  }
  const { kpis } = view;

  return (
    <Page>
      <PageHeader title={t.title} description={t.description} />
      <section aria-label={t.title} className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label={t.active} value={formatNumber(kpis.activePlayers)} icon={<Activity />} />
        <StatCard
          label={t.staked}
          value={formatCurrency(kpis.staked, { round: true })}
          icon={<CircleDollarSign />}
        />
        <StatCard
          label={t.ggr}
          value={formatCurrency(kpis.ggr, { round: true })}
          icon={<TrendingUp />}
        />
        <StatCard
          label={t.exposure}
          value={formatNumber(kpis.openBets)}
          hint={t.exposureHint(formatCurrency(kpis.exposure, { round: true }))}
          icon={<Receipt />}
        />
      </section>

      <Card>
        <CardHeader title={t.chart} />
        <CardContent className="pt-4">
          <ColumnChart
            label={t.chartLabel}
            data={view.days.map((d) => ({
              key: d.day,
              label: formatDate(`${d.day}T12:00:00`, "dayMonth"),
              longLabel: formatDate(`${d.day}T12:00:00`, "weekdayLong"),
              value: d.staked / 100,
            }))}
            formatValue={(v) => formatCurrency(Math.round(v * 100))}
            formatTick={(v) => formatCurrencyCompact(Math.round(v * 100))}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title={t.attention} description={t.attentionText} />
          {view.flagged.length === 0 ? (
            <EmptyState compact icon={Activity} title={t.attentionEmpty} />
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {view.flagged.map(({ player, signals }) => (
                <li key={player.id} className="px-5 py-3 sm:px-6">
                  <Link
                    href={`${routes.players}?giocatore=${player.id}`}
                    className="text-sm font-medium text-fg hover:underline"
                  >
                    {player.firstName} {player.lastName}
                  </Link>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {signals.map((s) => (
                      <Badge key={s} tone="warning">
                        {copy.signals[s]}
                      </Badge>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <CardHeader title={t.kyc} />
          {view.pending.length === 0 ? (
            <EmptyState compact icon={Receipt} title={t.kycEmpty} />
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {view.pending.map((player) => (
                <li
                  key={player.id}
                  className="flex items-center justify-between gap-3 px-5 py-3 sm:px-6"
                >
                  <Link
                    href={`${routes.players}?giocatore=${player.id}`}
                    className="text-sm font-medium text-fg hover:underline"
                  >
                    {player.firstName} {player.lastName}
                  </Link>
                  <span className="text-[13px] text-fg-muted">
                    {formatDate(player.createdAt, "short")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </Page>
  );
}
