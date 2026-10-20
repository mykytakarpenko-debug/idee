"use client";

import { subDays } from "date-fns";
import { Download, Pause, Pencil, Play, RefreshCw, ScanLine } from "lucide-react";
import { useMemo } from "react";
import { copy } from "@/content/it";
import { useData } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { checkInEligibility } from "@/lib/domain/checkin";
import { parseISODate } from "@/lib/domain/dates";
import { certificateStatus, membershipStatus } from "@/lib/domain/membership";
import { downloadFile } from "@/lib/csv";
import { capitalize, formatCurrency, formatDate } from "@/lib/format";
import { useDataStore } from "@/store/data-store";
import { openDialog } from "@/store/ui-store";
import {
  BookingBadge,
  CertificateBadge,
  MembershipBadge,
  PaymentBadge,
} from "@/components/status-badges";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";

const d = copy.members.detail;

export function MemberDetailDialog({ id, onDone }: { id: string; onDone: () => void }) {
  const now = useNow();
  const { member, plans, bookings, sessions, courses, checkIns, payments, settings } = useData(
    (state) => ({
      member: state.members.find((m) => m.id === id),
      plans: state.plans,
      bookings: state.bookings,
      sessions: state.sessions,
      courses: state.courses,
      checkIns: state.checkIns,
      payments: state.payments,
      settings: state.settings,
    }),
  );
  const updateMember = useDataStore((state) => state.updateMember);
  const renew = useDataStore((state) => state.renewMembership);
  const checkIn = useDataStore((state) => state.checkIn);

  const activity = useMemo(() => {
    if (!member || !now) return null;
    const from = subDays(now, 30).getTime();
    const own = bookings.filter((b) => b.memberId === member.id);
    const sessionById = new Map(sessions.map((s) => [s.id, s]));
    return {
      visits: checkIns.filter((c) => c.memberId === member.id && new Date(c.at).getTime() >= from)
        .length,
      classes: own.filter((b) => {
        const s = sessionById.get(b.sessionId);
        return b.status === "attended" && s && new Date(s.start).getTime() >= from;
      }).length,
      upcoming: own
        .filter(
          (b) =>
            (b.status === "booked" || b.status === "waitlist") &&
            (sessionById.get(b.sessionId)?.start ?? "") > now.toISOString(),
        )
        .map((b) => ({ booking: b, session: sessionById.get(b.sessionId)! }))
        .sort((a, b) => a.session.start.localeCompare(b.session.start))
        .slice(0, 5),
      payments: payments.filter((p) => p.memberId === member.id).slice(0, 4),
    };
  }, [member, now, bookings, sessions, checkIns, payments]);

  if (!member || !now || !activity) return <DialogContent title={d.title}>{null}</DialogContent>;
  const name = `${member.firstName} ${member.lastName}`;
  const plan = plans.find((p) => p.id === member.planId);
  const status = membershipStatus(member, now, settings.reminderDays);
  const cert = certificateStatus(member.medicalCertExpiry, now, settings.requireMedicalCert);
  const eligibility = checkInEligibility(member, plan, checkIns, settings, now);
  const day = (iso: string) => formatDate(parseISODate(iso), "short");

  const exportData = () => {
    const state = useDataStore.getState();
    downloadFile(
      `dati-${member.code}.json`,
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          member,
          plan,
          bookings: state.bookings.filter((b) => b.memberId === member.id),
          checkIns: state.checkIns.filter((c) => c.memberId === member.id),
          payments: state.payments.filter((p) => p.memberId === member.id),
        },
        null,
        2,
      ),
      "application/json",
    );
  };

  return (
    <DialogContent
      title={name}
      description={`${member.code} · ${d.since(day(member.joinedAt))}`}
      size="lg"
    >
      <DialogBody className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <Avatar name={name} size="lg" />
          <div className="flex flex-wrap gap-2">
            <MembershipBadge status={status} />
            <CertificateBadge status={cert} />
          </div>
        </div>

        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-fg-muted">{d.membership}</dt>
            <dd className="mt-1 font-medium text-fg">
              {plan?.name} · {copy.member.membership.cycle[member.cycle]}
            </dd>
            <dd className="text-fg-muted">
              {day(member.membershipStart)} – {day(member.membershipEnd)}
            </dd>
            {member.entriesLeft !== null ? (
              <dd className="text-fg-muted">
                {copy.member.overview.entriesLeft(member.entriesLeft)}
              </dd>
            ) : null}
          </div>
          <div>
            <dt className="text-xs text-fg-muted">{d.contacts}</dt>
            <dd className="mt-1 truncate text-fg">
              <a
                href={`mailto:${member.email}`}
                className="inline-flex min-h-7 items-center text-accent-text hover:underline"
              >
                {member.email}
              </a>
            </dd>
            <dd className="text-fg">
              <a
                href={`tel:${member.phone.replace(/\s/g, "")}`}
                className="inline-flex min-h-7 items-center hover:underline"
              >
                {member.phone}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-fg-muted">{d.activity}</dt>
            <dd className="mt-1 text-fg">
              {d.visits30}: <strong className="tabular-nums">{activity.visits}</strong>
            </dd>
            <dd className="text-fg">
              {d.classes30}: <strong className="tabular-nums">{activity.classes}</strong>
            </dd>
          </div>
        </dl>

        {member.notes ? (
          <p className="rounded-lg bg-surface-2 p-3 text-sm text-fg">{member.notes}</p>
        ) : null}

        <section aria-labelledby="detail-upcoming">
          <h3 id="detail-upcoming" className="text-[13px] font-medium text-fg-muted">
            {d.upcoming}
          </h3>
          {activity.upcoming.length === 0 ? (
            <p className="mt-2 text-sm text-fg-muted">—</p>
          ) : (
            <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
              {activity.upcoming.map(({ booking, session }) => (
                <li key={booking.id} className="flex items-center gap-3 px-3.5 py-2.5 text-sm">
                  <span className="w-32 text-fg tabular-nums">
                    {capitalize(formatDate(session.start, "weekdayShort"))}{" "}
                    {formatDate(session.start, "time")}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {courses.find((c) => c.id === session.courseId)?.name}
                  </span>
                  <BookingBadge status={booking.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="detail-payments">
          <h3 id="detail-payments" className="text-[13px] font-medium text-fg-muted">
            {d.payments}
          </h3>
          <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
            {activity.payments.map((payment) => (
              <li key={payment.id} className="flex items-center gap-3 px-3.5 py-2.5 text-sm">
                <span className="w-24 text-fg tabular-nums">{day(payment.date)}</span>
                <span className="min-w-0 flex-1 truncate">{payment.description}</span>
                <span className="tabular-nums">{formatCurrency(payment.amount)}</span>
                <PaymentBadge status={payment.status} />
              </li>
            ))}
          </ul>
        </section>
      </DialogBody>
      <DialogFooter className="flex-wrap sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openDialog({ type: "member", id: member.id })}
          >
            <Pencil aria-hidden />
            {copy.common.edit}
          </Button>
          <Button variant="ghost" size="sm" onClick={exportData}>
            <Download aria-hidden />
            {d.export}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              updateMember(member.id, { suspended: !member.suspended });
              toast.success(member.suspended ? d.resumed : d.suspended, { description: name });
            }}
          >
            {member.suspended ? <Play aria-hidden /> : <Pause aria-hidden />}
            {member.suspended ? d.resume : d.suspend}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              renew(member.id);
              toast.success(copy.dashboard.renewed(name));
            }}
          >
            <RefreshCw aria-hidden />
            {d.renew}
          </Button>
          <Button
            disabled={!eligibility.ok}
            onClick={() => {
              checkIn(member.id);
              toast.success(copy.checkin.registered(name));
              onDone();
            }}
          >
            <ScanLine aria-hidden />
            {d.checkin}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}
