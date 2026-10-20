"use client";

import { addDays } from "date-fns";
import { CalendarX2, Clock, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { copy } from "@/content/it";
import { useData } from "@/hooks/use-data";
import { useCurrentMember } from "@/hooks/use-member";
import { useNow } from "@/hooks/use-now";
import { checkBooking, sessionStats, waitlistPosition } from "@/lib/domain/booking";
import { parseISODate, toISODate } from "@/lib/domain/dates";
import { sessionsOn } from "@/lib/domain/schedule";
import { COURSE_CATEGORIES, type Booking, type CourseCategory } from "@/lib/domain/types";
import { capitalize, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDataStore } from "@/store/data-store";
import { CategoryLabel, IntensityMeter } from "@/components/course-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { toast } from "@/components/ui/toast";
import { CancelBookingDialog, downloadSessionIcs } from "./booking-actions";

const b = copy.member.book;
type Filter = "all" | CourseCategory;

export function BookView() {
  const member = useCurrentMember();
  const now = useNow();
  const data = useData((state) => ({
    plans: state.plans,
    sessions: state.sessions,
    bookings: state.bookings,
    trials: state.trials,
    courses: state.courses,
    instructors: state.instructors,
    settings: state.settings,
  }));
  const bookSession = useDataStore((state) => state.bookSession);
  const [picked, setPicked] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [toCancel, setToCancel] = useState<Booking | null>(null);

  const days = useMemo(
    () =>
      now
        ? Array.from({ length: data.settings.booking.windowDays + 1 }, (_, i) => addDays(now, i))
        : [],
    [now, data.settings.booking.windowDays],
  );
  const date = picked ?? (now ? toISODate(now) : "");
  const list = useMemo(
    () =>
      sessionsOn(data.sessions, date).filter(
        (s) =>
          filter === "all" || data.courses.find((c) => c.id === s.courseId)?.category === filter,
      ),
    [data.sessions, data.courses, date, filter],
  );

  if (!member || !now) return null;
  const plan = data.plans.find((p) => p.id === member.planId);

  const book = (sessionId: string) => {
    const result = bookSession(member.id, sessionId);
    if (!result.ok) {
      toast.error(copy.bookingBlocks[result.reason]);
      return;
    }
    const session = data.sessions.find((s) => s.id === sessionId);
    const course = session && data.courses.find((c) => c.id === session.courseId);
    if (result.booking.status === "waitlist") {
      const position = waitlistPosition(result.booking, [...data.bookings, result.booking]) ?? 1;
      toast.success(b.waitlistToast(position));
    } else if (session && course) {
      toast.success(b.bookedToast(course.name), {
        description: `${capitalize(formatDate(session.start, "weekdayLong"))} · ${formatDate(session.start, "time")}`,
        action: {
          label: copy.common.addToCalendar,
          onClick: () => downloadSessionIcs(session, course, data.settings),
        },
      });
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl animate-page-in flex-col gap-6 px-4 py-8 sm:px-6">
      <PageHeader
        title={b.title}
        description={b.description(
          data.settings.booking.windowDays,
          data.settings.booking.cancelHours,
        )}
      />

      <div
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
        role="radiogroup"
        aria-label={b.day}
      >
        {days.map((day) => {
          const value = toISODate(day);
          const selected = value === date;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={capitalize(formatDate(day, "weekdayLong"))}
              onClick={() => setPicked(value)}
              className={cn(
                "flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-xl border text-sm transition-colors",
                selected
                  ? "border-accent bg-accent text-accent-fg"
                  : "border-line bg-surface text-fg hover:bg-surface-2",
              )}
            >
              <span className={cn("text-xs", selected ? "" : "text-fg-muted")}>
                {capitalize(formatDate(day, "weekdayNarrow"))}
              </span>
              <span className="text-lg font-semibold tabular-nums">{day.getDate()}</span>
            </button>
          );
        })}
      </div>

      <SegmentedControl<Filter>
        ariaLabel={b.category}
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: copy.courses.allCategories },
          ...COURSE_CATEGORIES.map((c) => ({ value: c, label: copy.categories[c] })),
        ]}
      />

      {list.length === 0 ? (
        <Card>
          <EmptyState icon={CalendarX2} title={b.empty} description={b.emptyHint} />
        </Card>
      ) : (
        <ul
          className="flex flex-col gap-3"
          aria-label={capitalize(formatDate(date ? parseISODate(date) : now, "weekdayLong"))}
        >
          {list.map((session) => {
            const course = data.courses.find((c) => c.id === session.courseId);
            if (!course) return null;
            const instructor = data.instructors.find((i) => i.id === session.instructorId);
            const stats = sessionStats(session, data.bookings, data.trials);
            const own = data.bookings.find(
              (x) =>
                x.sessionId === session.id &&
                x.memberId === member.id &&
                (x.status === "booked" || x.status === "waitlist"),
            );
            const check = own
              ? null
              : checkBooking({
                  member,
                  plan,
                  session,
                  sessions: data.sessions,
                  bookings: data.bookings,
                  trials: data.trials,
                  settings: data.settings,
                  now,
                });
            const start = new Date(session.start);
            return (
              <li
                key={session.id}
                className={cn(
                  "flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border bg-surface p-4 shadow-xs sm:p-5",
                  own ? "border-accent/50" : "border-line",
                )}
              >
                <div className="w-16 shrink-0">
                  <p className="font-display text-xl font-bold text-fg tabular-nums">
                    {formatDate(start, "time")}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-fg-muted">
                    <Clock aria-hidden className="size-3" />
                    {copy.common.minutes(session.durationMin)}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-fg">{course.name}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <CategoryLabel category={course.category} />
                    <IntensityMeter value={course.intensity} />
                  </div>
                  <p className="mt-1 text-xs text-fg-muted">
                    {instructor?.name} · {copy.rooms[session.room]}
                  </p>
                </div>
                <p
                  className={cn(
                    "flex items-center gap-1.5 text-sm",
                    stats.full ? "text-warning" : "text-fg-muted",
                  )}
                >
                  <Users aria-hidden className="size-4" />
                  {session.cancelled
                    ? copy.classes.cancelled
                    : stats.full
                      ? b.full
                      : b.free(stats.free, session.capacity)}
                </p>
                <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                  {own ? (
                    <>
                      <Badge tone={own.status === "waitlist" ? "warning" : "accent"}>
                        {own.status === "waitlist"
                          ? b.waitlist(waitlistPosition(own, data.bookings) ?? 1)
                          : b.booked}
                      </Badge>
                      <Button variant="secondary" size="sm" onClick={() => setToCancel(own)}>
                        {own.status === "waitlist" ? b.leave : b.cancel}
                        <span className="sr-only"> · {course.name}</span>
                      </Button>
                    </>
                  ) : check?.ok ? (
                    <Button
                      size="sm"
                      variant={check.waitlist ? "secondary" : "primary"}
                      onClick={() => book(session.id)}
                    >
                      {check.waitlist
                        ? stats.waitlist > 0
                          ? b.join(stats.waitlist)
                          : b.joinEmpty
                        : b.book}
                      <span className="sr-only">
                        {" "}
                        · {course.name} {formatDate(start, "time")}
                      </span>
                    </Button>
                  ) : check ? (
                    <span className="text-[13px] text-fg-muted">
                      {copy.bookingBlocks[check.reason]}
                    </span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <CancelBookingDialog
        booking={toCancel}
        session={toCancel ? data.sessions.find((s) => s.id === toCancel.sessionId) : undefined}
        onClose={() => setToCancel(null)}
      />
    </div>
  );
}
