"use client";

import { startOfMonth } from "date-fns";
import { CalendarPlus, CalendarX2, CircleAlert, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useData } from "@/hooks/use-data";
import { useCurrentMember } from "@/hooks/use-member";
import { useNow } from "@/hooks/use-now";
import { waitlistPosition } from "@/lib/domain/booking";
import { parseISODate, toISODate } from "@/lib/domain/dates";
import { certificateStatus, membershipStatus, nextChargeDate } from "@/lib/domain/membership";
import type { Booking } from "@/lib/domain/types";
import { capitalize, formatDate } from "@/lib/format";
import { CertificateBadge, MembershipBadge } from "@/components/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { CancelBookingDialog, downloadSessionIcs } from "./booking-actions";

const o = copy.member.overview;

export function OverviewView() {
  const member = useCurrentMember();
  const now = useNow();
  const { plans, sessions, bookings, courses, instructors, checkIns, settings } = useData(
    (state) => ({
      plans: state.plans,
      sessions: state.sessions,
      bookings: state.bookings,
      courses: state.courses,
      instructors: state.instructors,
      checkIns: state.checkIns,
      settings: state.settings,
    }),
  );
  const [toCancel, setToCancel] = useState<Booking | null>(null);

  const upcoming = useMemo(() => {
    if (!member || !now) return [];
    return bookings
      .filter((b) => b.memberId === member.id && (b.status === "booked" || b.status === "waitlist"))
      .map((booking) => ({ booking, session: sessions.find((s) => s.id === booking.sessionId) }))
      .filter((x) => x.session && new Date(x.session.start).getTime() > now.getTime())
      .sort((a, b) => a.session!.start.localeCompare(b.session!.start));
  }, [member, now, bookings, sessions]);

  const month = useMemo(() => {
    if (!member || !now) return { visits: 0, classes: 0 };
    const from = toISODate(startOfMonth(now));
    return {
      visits: checkIns.filter((c) => c.memberId === member.id && toISODate(new Date(c.at)) >= from)
        .length,
      classes: bookings.filter((b) => {
        if (b.memberId !== member.id || b.status !== "attended") return false;
        const session = sessions.find((s) => s.id === b.sessionId);
        return session ? toISODate(new Date(session.start)) >= from : false;
      }).length,
    };
  }, [member, now, checkIns, bookings, sessions]);

  if (!member || !now) return null;
  const plan = plans.find((p) => p.id === member.planId);
  const status = membershipStatus(member, now, settings.reminderDays);
  const cert = certificateStatus(member.medicalCertExpiry, now, settings.requireMedicalCert);
  const charge = nextChargeDate(member);
  const long = (iso: string) => formatDate(parseISODate(iso), "dayMonthLong");

  return (
    <div className="mx-auto flex max-w-5xl animate-page-in flex-col gap-6 px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-fg">
        {copy.member.greeting(member.firstName)}
      </h1>

      {cert === "expiring" && member.medicalCertExpiry ? (
        <p
          role="status"
          className="flex gap-3 rounded-xl border border-warning/30 bg-warning-soft p-4 text-sm text-warning"
        >
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {o.certificateExpiring(long(member.medicalCertExpiry))}
        </p>
      ) : cert === "expired" || cert === "missing" ? (
        <p
          role="alert"
          className="flex gap-3 rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger"
        >
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {o.certificateExpired}
        </p>
      ) : null}
      {status === "expiring" && member.entriesLeft === null ? (
        <p
          role="status"
          className="flex gap-3 rounded-xl border border-warning/30 bg-warning-soft p-4 text-sm text-warning"
        >
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {o.membershipExpiring(long(member.membershipEnd))}{" "}
          <Link href={routes.memberMembership} className="font-medium underline">
            {copy.member.nav.membership}
          </Link>
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <Card className="p-6">
          <p className="text-[13px] font-medium text-fg-muted">{o.membership}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="font-display text-2xl font-bold text-fg">{plan?.name}</p>
            <MembershipBadge status={status} />
          </div>
          <p className="mt-2 text-sm text-fg">
            {charge ? o.renewsOn(long(charge)) : o.validUntil(long(member.membershipEnd))}
          </p>
          {member.entriesLeft !== null ? (
            <p className="mt-1 text-sm font-medium text-fg">{o.entriesLeft(member.entriesLeft)}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <CertificateBadge status={cert} />
          </div>
          <div className="mt-6 border-t border-line pt-4">
            <p className="text-xs text-fg-muted">{o.monthStats}</p>
            <p className="mt-1 text-lg font-semibold text-fg">
              {o.visits(month.visits)} · {o.classes(month.classes)}
            </p>
          </div>
        </Card>
        <Card className="flex flex-col justify-between p-6">
          <div>
            <p className="text-[13px] font-medium text-fg-muted">{o.code}</p>
            <p className="mt-3 font-mono text-4xl font-semibold tracking-widest text-fg">
              {member.code}
            </p>
          </div>
          <p className="mt-4 text-sm text-fg-muted">{o.codeHint}</p>
        </Card>
      </div>

      <Card>
        <CardHeader
          title={o.next}
          action={
            <Link href={routes.memberBook} className={buttonClasses({ size: "sm" })}>
              <CalendarPlus aria-hidden />
              {o.bookCta}
            </Link>
          }
        />
        {upcoming.length === 0 ? (
          <EmptyState compact icon={CalendarX2} title={o.nextEmpty} description={o.nextEmptyHint} />
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {upcoming.map(({ booking, session }) => {
              if (!session) return null;
              const course = courses.find((c) => c.id === session.courseId);
              const instructor = instructors.find((i) => i.id === session.instructorId);
              const start = new Date(session.start);
              const position = waitlistPosition(booking, bookings);
              return (
                <li
                  key={booking.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 sm:px-6"
                >
                  <div className="w-28 shrink-0">
                    <p className="text-sm font-semibold text-fg">
                      {capitalize(formatDate(start, "weekdayShort"))}
                    </p>
                    <p className="text-sm text-fg-muted tabular-nums">
                      {formatDate(start, "time")}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-fg">{course?.name}</p>
                    <p className="truncate text-xs text-fg-muted">
                      {instructor?.name} · {copy.rooms[session.room]}
                    </p>
                  </div>
                  {position !== null ? (
                    <Badge tone="warning">{copy.member.book.waitlist(position)}</Badge>
                  ) : (
                    <Badge tone="accent">{copy.member.book.booked}</Badge>
                  )}
                  <div className="flex gap-1">
                    {course && booking.status === "booked" ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`${copy.common.addToCalendar}: ${course.name}`}
                        onClick={() => downloadSessionIcs(session, course, settings)}
                      >
                        <CalendarPlus aria-hidden />
                      </Button>
                    ) : null}
                    <Button variant="secondary" size="sm" onClick={() => setToCancel(booking)}>
                      {booking.status === "waitlist"
                        ? copy.member.book.leave
                        : copy.member.book.cancel}
                      <span className="sr-only"> · {course?.name}</span>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <CancelBookingDialog
        booking={toCancel}
        session={toCancel ? sessions.find((s) => s.id === toCancel.sessionId) : undefined}
        onClose={() => setToCancel(null)}
      />
    </div>
  );
}
