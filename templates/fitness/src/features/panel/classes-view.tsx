"use client";

import { addDays, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { copy } from "@/content/it";
import { useData, useDataReady } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { sessionStats } from "@/lib/domain/booking";
import { toISODate, weekDays } from "@/lib/domain/dates";
import { sessionsOn } from "@/lib/domain/schedule";
import type { ClassSession } from "@/lib/domain/types";
import { capitalize, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { openDialog } from "@/store/ui-store";
import { categoryColor } from "@/components/course-badges";
import { Button } from "@/components/ui/button";
import { Page, PageHeader, Toolbar } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";

const t = copy.classes;

export function ClassesView() {
  const ready = useDataReady();
  const now = useNow();
  const [offset, setOffset] = useState(0);
  const [pickedDay, setPickedDay] = useState<number | null>(null);

  const days = useMemo(() => (now ? weekDays(addDays(now, offset * 7)) : []), [now, offset]);
  const todayIndex = now ? days.findIndex((d) => isSameDay(d, now)) : -1;
  const dayIndex = pickedDay ?? (todayIndex >= 0 ? todayIndex : 0);

  return (
    <Page>
      <PageHeader title={t.title} description={t.description} />
      <Toolbar>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setOffset(0);
              setPickedDay(null);
            }}
          >
            {t.thisWeek}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={copy.common.previous}
            onClick={() => setOffset((o) => o - 1)}
          >
            <ChevronLeft aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={copy.common.next}
            onClick={() => setOffset((o) => o + 1)}
          >
            <ChevronRight aria-hidden />
          </Button>
          {days[0] ? (
            <p className="text-sm font-medium text-fg" aria-live="polite">
              {t.weekOf(formatDate(days[0], "dayMonthLong"))}
            </p>
          ) : null}
        </div>
      </Toolbar>

      {!ready || !now ? (
        <div className="grid gap-3 lg:grid-cols-7" aria-busy="true">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div
            className="-mx-4 flex gap-1.5 overflow-x-auto px-4 lg:hidden"
            role="radiogroup"
            aria-label={copy.schedule.day}
          >
            {days.map((day, i) => (
              <button
                key={toISODate(day)}
                type="button"
                role="radio"
                aria-checked={i === dayIndex}
                aria-label={capitalize(formatDate(day, "weekdayLong"))}
                onClick={() => setPickedDay(i)}
                className={cn(
                  "flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-xl border text-sm",
                  i === dayIndex
                    ? "border-accent bg-accent text-accent-fg"
                    : "border-line bg-surface text-fg",
                )}
              >
                <span className="text-[11px]">{capitalize(formatDate(day, "weekdayNarrow"))}</span>
                <span className="font-semibold tabular-nums">{day.getDate()}</span>
              </button>
            ))}
          </div>
          <div className="grid gap-3 lg:grid-cols-7">
            {days.map((day, i) => (
              <DayColumn
                key={toISODate(day)}
                day={day}
                today={now !== null && isSameDay(day, now)}
                className={cn(i !== dayIndex && "max-lg:hidden")}
              />
            ))}
          </div>
        </>
      )}
    </Page>
  );
}

function DayColumn({ day, today, className }: { day: Date; today: boolean; className?: string }) {
  const { sessions, bookings, trials, courses, instructors } = useData((state) => ({
    sessions: state.sessions,
    bookings: state.bookings,
    trials: state.trials,
    courses: state.courses,
    instructors: state.instructors,
  }));
  const list = sessionsOn(sessions, toISODate(day));
  const label = capitalize(formatDate(day, "weekdayLong"));

  return (
    <section aria-label={label} className={cn("min-w-0", className)}>
      <h2
        className={cn(
          "mb-2 rounded-lg px-2 py-1.5 text-sm font-semibold",
          today ? "bg-accent-soft text-accent-soft-fg" : "text-fg",
        )}
      >
        <span className="lg:hidden">{label}</span>
        <span className="max-lg:hidden">{capitalize(formatDate(day, "weekdayShort"))}</span>
      </h2>
      {list.length === 0 ? (
        <p className="px-2 text-[13px] text-fg-muted">{t.empty}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              courseName={courses.find((c) => c.id === session.courseId)?.name ?? ""}
              category={courses.find((c) => c.id === session.courseId)?.category}
              instructor={instructors.find((x) => x.id === session.instructorId)?.name ?? ""}
              stats={sessionStats(session, bookings, trials)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function SessionCard({
  session,
  courseName,
  category,
  instructor,
  stats,
}: {
  session: ClassSession;
  courseName: string;
  category: Parameters<typeof categoryColor>[0] | undefined;
  instructor: string;
  stats: ReturnType<typeof sessionStats>;
}) {
  const ratio = session.capacity ? stats.taken / session.capacity : 0;
  return (
    <li>
      <button
        type="button"
        onClick={() => openDialog({ type: "session", id: session.id })}
        className={cn(
          "w-full rounded-xl border border-line bg-surface p-3 text-left shadow-xs transition-shadow hover:shadow-md",
          session.cancelled && "border-dashed bg-transparent",
        )}
        style={
          category ? { borderLeftColor: categoryColor(category), borderLeftWidth: 3 } : undefined
        }
      >
        <span className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-bold text-fg tabular-nums">
            {formatDate(session.start, "time")}
          </span>
          <span
            className={cn(
              "text-xs font-medium tabular-nums",
              stats.full ? "text-warning" : "text-fg-muted",
            )}
          >
            {t.booked(stats.taken, session.capacity)}
          </span>
        </span>
        <span
          className={cn(
            "mt-0.5 block text-[13px] leading-snug font-medium",
            session.cancelled ? "text-fg-muted line-through" : "text-fg",
          )}
        >
          {courseName}
        </span>
        <span className="block truncate text-xs text-fg-muted">{instructor}</span>
        {session.cancelled ? (
          <span className="mt-1 block text-xs font-medium text-danger">{t.cancelled}</span>
        ) : (
          <>
            <span
              aria-hidden
              className="mt-2 block h-1 overflow-hidden rounded-full bg-accent-soft"
            >
              <span
                className={cn("block h-full rounded-full", ratio >= 1 ? "bg-warning" : "bg-accent")}
                style={{ width: `${Math.min(100, ratio * 100)}%` }}
              />
            </span>
            {stats.waitlist > 0 ? (
              <span className="mt-1 block text-xs text-warning">{t.waitlist(stats.waitlist)}</span>
            ) : null}
          </>
        )}
      </button>
    </li>
  );
}
