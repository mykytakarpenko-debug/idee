"use client";

import { Download, LineChart } from "lucide-react";
import { useMemo, useState } from "react";
import { copy } from "@/content/it";
import { useData, useDataReady } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import {
  appointmentsInRange,
  attendanceRate,
  averageTicket,
  deltaRatio,
  newClientsCount,
  periodRanges,
  revenue,
  revenueByService,
  revenueSeries,
  staffUtilization,
  statusCounts,
  topClients,
  type ReportPeriod,
} from "@/lib/domain/analytics";
import type { AppointmentStatus } from "@/lib/domain/types";
import { csvAmount, downloadCsv } from "@/lib/csv";
import {
  formatCurrency,
  formatCurrencyCompact,
  formatDate,
  formatNumber,
  formatPercent,
} from "@/lib/format";
import { appointmentStatusColor } from "@/components/status-badges";
import { BarList } from "@/components/charts/bar-list";
import { ColumnChart } from "@/components/charts/column-chart";
import { Meter } from "@/components/charts/meter";
import { StackedBar } from "@/components/charts/stacked-bar";
import { ColorDot } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Page, PageHeader } from "@/components/ui/page";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";

const t = copy.reports;
const STATUS_ORDER: AppointmentStatus[] = [
  "completed",
  "confirmed",
  "pending",
  "no_show",
  "cancelled",
];

export function ReportsView() {
  const ready = useDataReady();
  const now = useNow();
  const [period, setPeriod] = useState<ReportPeriod>("30d");

  return (
    <Page>
      <PageHeader
        title={t.title}
        description={t.description}
        actions={
          <SegmentedControl<ReportPeriod>
            ariaLabel={t.period}
            value={period}
            onChange={setPeriod}
            options={[
              { value: "30d", label: t.periods["30d"] },
              { value: "90d", label: t.periods["90d"] },
              { value: "12m", label: t.periods["12m"] },
            ]}
          />
        }
      />
      {!ready || !now ? <ReportsSkeleton /> : <Reports now={now} period={period} />}
    </Page>
  );
}

function Reports({ now, period }: { now: Date; period: ReportPeriod }) {
  const { appointments, payments, clients, services, staff, settings } = useData((state) => ({
    appointments: state.appointments,
    payments: state.payments,
    clients: state.clients,
    services: state.services,
    staff: state.staff,
    settings: state.settings,
  }));

  const data = useMemo(() => {
    const { current, previous, bucket } = periodRanges(period, now);
    const currentAppointments = appointmentsInRange(appointments, current);
    const previousAppointments = appointmentsInRange(appointments, previous);
    const completed = statusCounts(currentAppointments).completed;
    const completedPrev = statusCounts(previousAppointments).completed;
    const rev = revenue(payments, current);
    const revPrev = revenue(payments, previous);
    const avg = averageTicket(payments, current);
    const avgPrev = averageTicket(payments, previous);
    const newClients = newClientsCount(clients, current);
    const newClientsPrev = newClientsCount(clients, previous);
    return {
      current,
      revenue: rev,
      revenueDelta: deltaRatio(rev, revPrev),
      completed,
      completedDelta: deltaRatio(completed, completedPrev),
      average: avg,
      averageDelta: avgPrev === 0 ? null : deltaRatio(avg, avgPrev),
      newClients,
      newClientsDelta: deltaRatio(newClients, newClientsPrev),
      attendance: attendanceRate(currentAppointments),
      series: revenueSeries(payments, current, bucket),
      byService: revenueByService(payments, appointments, services, current, 6),
      statuses: statusCounts(currentAppointments),
      utilization: staffUtilization(appointments, staff, settings.hours, current),
      top: topClients(payments, appointments, clients, current, 5),
    };
  }, [appointments, payments, clients, services, staff, settings.hours, period, now]);

  const exportCsv = () => {
    const rows = [
      ...data.series.map((point) => ({
        section: t.revenueOverTime,
        label: point.longLabel,
        value: point.value,
      })),
      ...data.byService.map((item) => ({
        section: t.revenueByService,
        label: item.label,
        value: item.value,
      })),
    ];
    downloadCsv(`${t.exportName}-${period}-${formatDate(now, "inputDate")}.csv`, rows, [
      { header: "Sezione", value: (r) => r.section },
      { header: "Voce", value: (r) => r.label },
      { header: "Importo (€)", value: (r) => csvAmount(r.value) },
    ]);
  };

  const hasData = data.revenue > 0 || data.completed > 0;

  return (
    <>
      <div className="-mt-2 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-fg-muted">
          {formatDate(data.current.start, "short")} –{" "}
          {formatDate(new Date(data.current.end.getTime() - 1), "short")}
        </p>
        <Button variant="secondary" size="sm" onClick={exportCsv} disabled={!hasData}>
          <Download aria-hidden />
          {copy.common.exportCsv}
        </Button>
      </div>

      <section aria-label={t.title} className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label={t.kpi.revenue}
          value={formatCurrency(data.revenue, { round: true })}
          delta={data.revenueDelta}
          deltaLabel={copy.common.vsPrevious}
        />
        <StatCard
          label={t.kpi.appointments}
          value={formatNumber(data.completed)}
          delta={data.completedDelta}
          deltaLabel={copy.common.vsPrevious}
        />
        <StatCard
          label={t.kpi.averageTicket}
          value={formatCurrency(data.average)}
          delta={data.averageDelta}
          deltaLabel={copy.common.vsPrevious}
        />
        <StatCard
          label={t.kpi.newClients}
          value={formatNumber(data.newClients)}
          delta={data.newClientsDelta}
          deltaLabel={copy.common.vsPrevious}
        />
      </section>

      {!hasData ? (
        <Card>
          <EmptyState icon={LineChart} title={t.noData} />
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader title={t.revenueOverTime} description={formatCurrency(data.revenue)} />
            <CardContent className="pt-6">
              <ColumnChart
                data={data.series}
                label={t.revenueOverTime}
                height={240}
                formatValue={(value) => formatCurrency(value, { round: true })}
                formatTick={formatCurrencyCompact}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title={t.revenueByService} />
              <CardContent>
                <BarList
                  label={t.revenueByService}
                  items={data.byService.map((item) => ({
                    id: item.id,
                    label: item.label,
                    value: item.value,
                  }))}
                  formatValue={(value) => formatCurrency(value, { round: true })}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                title={t.statusBreakdown}
                description={
                  data.attendance === null
                    ? undefined
                    : `${t.kpi.attendance}: ${formatPercent(data.attendance)}`
                }
              />
              <CardContent>
                <StackedBar
                  label={t.statusBreakdown}
                  segments={STATUS_ORDER.map((status) => ({
                    id: status,
                    label: copy.status.appointment[status],
                    value: data.statuses[status],
                    color: appointmentStatusColor[status],
                  }))}
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title={t.staffUtilization} description={t.staffUtilizationHint} />
              <CardContent>
                <ul className="flex flex-col gap-4">
                  {data.utilization.map((item) => (
                    <li key={item.staff.id} className="flex flex-col gap-1.5">
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="flex items-center gap-2 text-fg">
                          <ColorDot color={item.staff.color} />
                          {item.staff.name}
                        </span>
                        <span className="text-fg tabular-nums">
                          <span className="font-medium">{formatPercent(item.ratio, 0)}</span>
                          <span className="ml-1.5 text-xs text-fg-muted">
                            {t.bookedHours(
                              `${formatNumber(Math.round(item.bookedMinutes / 60))} h`,
                              `${formatNumber(Math.round(item.availableMinutes / 60))} h`,
                            )}
                          </span>
                        </span>
                      </div>
                      <Meter
                        value={item.ratio}
                        label={`${t.staffUtilization}: ${item.staff.name}`}
                      />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader title={t.topClients} />
              <div className="mt-3">
                <Table>
                  <THead>
                    <tr>
                      <TH>{t.columns.client}</TH>
                      <TH align="right">{t.columns.visits}</TH>
                      <TH align="right">{t.columns.revenue}</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {data.top.map((item) => (
                      <TR key={item.id}>
                        <TD className="font-medium text-fg">{item.label}</TD>
                        <TD align="right" className="text-fg-muted">
                          {formatNumber(item.visits)}
                        </TD>
                        <TD align="right" className="font-medium text-fg">
                          {formatCurrency(item.value)}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
            </Card>
          </div>
        </>
      )}
    </>
  );
}

function ReportsSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <span className="sr-only">{copy.common.loading}</span>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[126px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[340px] rounded-xl" />
    </div>
  );
}
