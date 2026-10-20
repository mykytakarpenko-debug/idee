"use client";

import { addDays, startOfDay, startOfMonth } from "date-fns";
import { CalendarDays, Gauge, Hourglass, Inbox, ScanLine, Users } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useData, useDataReady } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import {
  activeMembers,
  checkInsPerDay,
  expiringMembers,
  occupancyRate,
} from "@/lib/domain/analytics";
import { sessionStats } from "@/lib/domain/booking";
import { parseISODate, toISODate, weekStart } from "@/lib/domain/dates";
import { sessionsOn } from "@/lib/domain/schedule";
import { capitalize, formatDate, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDataStore } from "@/store/data-store";
import { openDialog } from "@/store/ui-store";
import type { SeriesPoint } from "@/components/charts/types";
import { ColumnChart } from "@/components/charts/column-chart";
import { TrialBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Page, PageHeader } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { toast } from "@/components/ui/toast";

const d = copy.dashboard;

export function DashboardView() {
  const ready = useDataReady();
  const now = useNow();
  if (!ready || !now) {
    return (
      <Page aria-busy="true">
        <Skeleton className="h-9 w-64" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[118px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </Page>
    );
  }
  return <Dashboard now={now} />;
}

function Dashboard({ now }: { now: Date }) {
  const { members, sessions, bookings, trials, checkIns, courses, instructors, settings } = useData(
    (state) => ({
      members: state.members,
      sessions: state.sessions,
      bookings: state.bookings,
      trials: state.trials,
      checkIns: state.checkIns,
      courses: state.courses,
      instructors: state.instructors,
      settings: state.settings,
    }),
  );
  const setTrialStatus = useDataStore((state) => state.setTrialStatus);
  const renew = useDataStore((state) => state.renewMembership);

  const stats = useMemo(() => {
    const today = startOfDay(now);
    const active = activeMembers(members, today, settings.reminderDays);
    const monthStart = toISODate(startOfMonth(now));
    const perDay = checkInsPerDay(checkIns, today, 14);
    const todayCount = perDay.at(-1)?.value ?? 0;
    // Confronto alla stessa ora di 7 giorni fa, non con l'intera giornata.
    const weekAgoStart = addDays(today, -7).getTime();
    const weekAgoNow = now.getTime() - 7 * 86_400_000;
    const weekAgo = checkIns.filter((c) => {
      const ms = new Date(c.at).getTime();
      return ms >= weekAgoStart && ms <= weekAgoNow;
    }).length;
    const monday = weekStart(now);
    const chart: SeriesPoint[] = perDay.map((point) => {
      const date = parseISODate(point.date);
      return {
        key: point.date,
        label: formatDate(date, "dayMonth"),
        longLabel: capitalize(formatDate(date, "weekdayLong")),
        value: point.value,
      };
    });
    return {
      active: active.length,
      newThisMonth: members.filter((m) => m.joinedAt >= monthStart).length,
      todayCount,
      delta: todayCount - weekAgo,
      occupancy: occupancyRate(sessions, bookings, monday, addDays(monday, 7)),
      expiring: expiringMembers(members, today, settings.reminderDays),
      todaySessions: sessionsOn(sessions, toISODate(now)),
      newTrials: trials.filter((t) => t.status === "new"),
      chart,
    };
  }, [now, members, sessions, bookings, trials, checkIns, settings.reminderDays]);

  return (
    <Page>
      <PageHeader title={d.title} description={capitalize(formatDate(now, "long"))} />

      <section aria-label={d.title} className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label={d.kpi.active}
          value={formatNumber(stats.active)}
          hint={d.kpi.newThisMonth(stats.newThisMonth)}
          icon={<Users />}
        />
        <StatCard
          label={d.kpi.checkinsToday}
          value={formatNumber(stats.todayCount)}
          hint={d.kpi.vsLastWeek(stats.delta)}
          icon={<ScanLine />}
        />
        <StatCard
          label={d.kpi.occupancy}
          value={formatPercent(stats.occupancy, 0)}
          hint={d.kpi.occupancyHint}
          icon={<Gauge />}
        />
        <StatCard
          label={d.kpi.expiring}
          value={formatNumber(stats.expiring.length)}
          hint={d.kpi.expiringHint(settings.reminderDays)}
          icon={<Hourglass />}
        />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title={d.todayClasses}
            action={
              <Link
                href={routes.classes}
                className="text-[13px] font-medium text-accent-text hover:underline"
              >
                {copy.panel.nav.classes}
              </Link>
            }
          />
          {stats.todaySessions.length === 0 ? (
            <EmptyState compact icon={CalendarDays} title={d.todayClassesEmpty} />
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {stats.todaySessions.map((session) => {
                const course = courses.find((c) => c.id === session.courseId);
                const instructor = instructors.find((i) => i.id === session.instructorId);
                const s = sessionStats(session, bookings, trials);
                const ratio = session.capacity ? s.taken / session.capacity : 0;
                const past =
                  new Date(session.start).getTime() + session.durationMin * 60_000 < now.getTime();
                return (
                  <li key={session.id}>
                    <button
                      type="button"
                      onClick={() => openDialog({ type: "session", id: session.id })}
                      className={cn(
                        "flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-surface-2 sm:px-6",
                        past && "text-fg-muted",
                      )}
                    >
                      <span className="w-12 text-sm font-semibold tabular-nums">
                        {formatDate(session.start, "time")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate text-sm font-medium",
                            past ? "text-fg-muted" : "text-fg",
                          )}
                        >
                          {course?.name}
                          {session.cancelled ? ` · ${copy.classes.cancelled}` : ""}
                        </span>
                        <span className="block truncate text-xs text-fg-muted">
                          {instructor?.name}
                        </span>
                      </span>
                      <span className="flex w-36 flex-col items-end gap-1">
                        <span className="text-xs font-medium text-fg tabular-nums">
                          {copy.classes.booked(s.taken, session.capacity)}
                          {s.waitlist > 0 ? ` · ${copy.classes.waitlist(s.waitlist)}` : ""}
                        </span>
                        <span
                          role="meter"
                          aria-label={course?.name}
                          aria-valuemin={0}
                          aria-valuemax={session.capacity}
                          aria-valuenow={s.taken}
                          className="h-1.5 w-full overflow-hidden rounded-full bg-accent-soft"
                        >
                          <span
                            className={cn(
                              "block h-full rounded-full",
                              ratio >= 1 ? "bg-warning" : "bg-accent",
                            )}
                            style={{ width: `${Math.min(100, ratio * 100)}%` }}
                          />
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title={d.trials} />
            {stats.newTrials.length === 0 ? (
              <EmptyState compact icon={Inbox} title={d.trialsEmpty} />
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {stats.newTrials.slice(0, 5).map((trial) => {
                  const session = sessions.find((s) => s.id === trial.sessionId);
                  const course = session && courses.find((c) => c.id === session.courseId);
                  return (
                    <li
                      key={trial.id}
                      className="flex flex-wrap items-center gap-3 px-5 py-3 sm:px-6"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-fg">{trial.name}</p>
                        <p className="truncate text-xs text-fg-muted">
                          {copy.interests[trial.interest]}
                          {course && session
                            ? ` · ${course.name}, ${formatDate(session.start, "weekdayShort")} ${formatDate(session.start, "time")}`
                            : ""}
                          {" · "}
                          <a
                            href={`tel:${trial.phone.replace(/\s/g, "")}`}
                            className="text-accent-text hover:underline"
                          >
                            {trial.phone}
                          </a>
                        </p>
                      </div>
                      <TrialBadge status={trial.status} />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setTrialStatus(trial.id, "contacted");
                          toast.success(d.contacted, {
                            description: trial.name,
                            action: {
                              label: copy.common.cancel,
                              onClick: () => setTrialStatus(trial.id, "new"),
                            },
                          });
                        }}
                      >
                        {d.markContacted}
                        <span className="sr-only"> · {trial.name}</span>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title={d.expiringTitle} />
            {stats.expiring.length === 0 ? (
              <EmptyState compact icon={Hourglass} title={d.expiringEmpty} />
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {stats.expiring.slice(0, 5).map((member) => {
                  const name = `${member.firstName} ${member.lastName}`;
                  return (
                    <li key={member.id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                      <button
                        type="button"
                        onClick={() => openDialog({ type: "member-detail", id: member.id })}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="block truncate text-sm font-medium text-fg hover:underline">
                          {name}
                        </span>
                        <span className="block truncate text-xs text-fg-muted">
                          {member.entriesLeft !== null
                            ? copy.member.overview.entriesLeft(member.entriesLeft)
                            : copy.member.overview.validUntil(
                                formatDate(parseISODate(member.membershipEnd), "dayMonthLong"),
                              )}
                        </span>
                      </button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          renew(member.id);
                          toast.success(d.renewed(name));
                        }}
                      >
                        {d.renew}
                        <span className="sr-only"> · {name}</span>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader title={d.checkinsChart} />
        <CardContent className="pt-6">
          <ColumnChart
            data={stats.chart}
            label={d.checkinsChart}
            formatValue={(value) => copy.common.entries(value)}
            formatTick={(value) => formatNumber(value)}
          />
        </CardContent>
      </Card>
    </Page>
  );
}
