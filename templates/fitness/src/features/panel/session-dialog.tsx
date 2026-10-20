"use client";

import { Ban, Check, UserMinus, UserPlus } from "lucide-react";
import { useState } from "react";
import { copy } from "@/content/it";
import { useData } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { sessionStats } from "@/lib/domain/booking";
import { capitalize, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDataStore } from "@/store/data-store";
import { CategoryLabel } from "@/components/course-badges";
import { TrialBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

const s = copy.classes.session;

export function SessionDialog({ id, onDone }: { id: string; onDone: () => void }) {
  const now = useNow();
  const { session, bookings, members, courses, instructors, trials } = useData((state) => ({
    session: state.sessions.find((x) => x.id === id),
    bookings: state.bookings,
    members: state.members,
    courses: state.courses,
    instructors: state.instructors,
    trials: state.trials,
  }));
  const setAttendance = useDataStore((state) => state.setAttendance);
  const promote = useDataStore((state) => state.promote);
  const cancelSession = useDataStore((state) => state.cancelSession);
  const setCapacity = useDataStore((state) => state.setSessionCapacity);
  const [capacity, setCapacityValue] = useState(String(session?.capacity ?? ""));
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!session) return <DialogContent title={copy.classes.title}>{null}</DialogContent>;
  const course = courses.find((c) => c.id === session.courseId);
  const instructor = instructors.find((i) => i.id === session.instructorId);
  const stats = sessionStats(session, bookings, trials);
  const memberName = (memberId: string) => {
    const m = members.find((x) => x.id === memberId);
    return m ? `${m.firstName} ${m.lastName}` : memberId;
  };
  const roster = bookings
    .filter(
      (b) =>
        b.sessionId === session.id &&
        (b.status === "booked" || b.status === "attended" || b.status === "no_show"),
    )
    .sort((a, b) => memberName(a.memberId).localeCompare(memberName(b.memberId)));
  const queue = bookings
    .filter((b) => b.sessionId === session.id && b.status === "waitlist")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const sessionTrials = trials.filter((t) => t.sessionId === session.id);
  const started = now !== null && new Date(session.start).getTime() <= now.getTime();
  const capacityNumber = Number.parseInt(capacity, 10);
  const capacityValid =
    Number.isFinite(capacityNumber) && capacityNumber >= stats.taken && capacityNumber <= 60;

  return (
    <DialogContent
      title={course?.name ?? copy.classes.title}
      description={`${capitalize(formatDate(session.start, "weekdayLong"))} · ${formatDate(session.start, "time")} · ${copy.rooms[session.room]}`}
      size="lg"
    >
      <DialogBody className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {course ? <CategoryLabel category={course.category} /> : null}
          <span className="text-fg-muted">
            {s.instructor}: <span className="text-fg">{instructor?.name}</span>
          </span>
          <span className="font-medium text-fg tabular-nums">
            {copy.classes.booked(stats.taken, session.capacity)}
          </span>
          {session.cancelled ? (
            <span className="font-medium text-danger">{copy.classes.cancelled}</span>
          ) : null}
        </div>

        <section aria-labelledby="roster">
          <h3 id="roster" className="text-[13px] font-medium text-fg-muted">
            {s.roster} ({roster.length})
          </h3>
          {roster.length === 0 ? (
            <p className="mt-2 text-sm text-fg-muted">{s.rosterEmpty}</p>
          ) : (
            <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
              {roster.map((booking) => (
                <li key={booking.id} className="flex items-center gap-3 px-3.5 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate text-fg">
                    {memberName(booking.memberId)}
                  </span>
                  {started ? (
                    <div
                      className="flex gap-1"
                      role="group"
                      aria-label={memberName(booking.memberId)}
                    >
                      {(
                        [
                          ["attended", s.present, Check],
                          ["no_show", s.absent, UserMinus],
                        ] as const
                      ).map(([value, label, Icon]) => (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={booking.status === value}
                          onClick={() => {
                            setAttendance(booking.id, booking.status === value ? "booked" : value);
                          }}
                          className={cn(
                            "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors",
                            booking.status === value
                              ? value === "attended"
                                ? "border-success/40 bg-success-soft text-success"
                                : "border-danger/40 bg-danger-soft text-danger"
                              : "border-line text-fg-muted hover:bg-surface-2",
                          )}
                        >
                          <Icon aria-hidden className="size-3.5" />
                          {label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-fg-muted">{copy.status.booking.booked}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {queue.length > 0 ? (
          <section aria-labelledby="queue">
            <h3 id="queue" className="text-[13px] font-medium text-fg-muted">
              {s.waitlist} ({queue.length})
            </h3>
            <ol className="mt-2 divide-y divide-line rounded-lg border border-line">
              {queue.map((booking, index) => (
                <li key={booking.id} className="flex items-center gap-3 px-3.5 py-2 text-sm">
                  <span className="w-6 text-fg-muted tabular-nums">{index + 1}.</span>
                  <span className="min-w-0 flex-1 truncate text-fg">
                    {memberName(booking.memberId)}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={stats.free <= 0 || session.cancelled}
                    onClick={() => {
                      promote(booking.id);
                      toast.success(s.promoted(memberName(booking.memberId)));
                    }}
                  >
                    <UserPlus aria-hidden />
                    {s.promote}
                  </Button>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {sessionTrials.length > 0 ? (
          <section aria-labelledby="trials">
            <h3 id="trials" className="text-[13px] font-medium text-fg-muted">
              {s.trials} ({sessionTrials.length})
            </h3>
            <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
              {sessionTrials.map((trial) => (
                <li key={trial.id} className="flex items-center gap-3 px-3.5 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate text-fg">{trial.name}</span>
                  <TrialBadge status={trial.status} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {!started && !session.cancelled ? (
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!capacityValid) return;
              setCapacity(session.id, capacityNumber);
              toast.success(s.capacitySaved);
            }}
          >
            <label className="flex flex-col gap-1.5 text-[13px] font-medium text-fg">
              {s.capacity}
              <Input
                type="number"
                inputMode="numeric"
                min={stats.taken}
                max={60}
                value={capacity}
                onChange={(event) => setCapacityValue(event.target.value)}
                aria-invalid={capacityValid ? undefined : true}
                className="w-28"
              />
            </label>
            <Button
              type="submit"
              variant="secondary"
              disabled={!capacityValid || capacityNumber === session.capacity}
            >
              {copy.common.save}
            </Button>
          </form>
        ) : null}
      </DialogBody>
      <DialogFooter className="sm:justify-between">
        {!started && !session.cancelled ? (
          <Button variant="danger-ghost" onClick={() => setConfirmCancel(true)}>
            <Ban aria-hidden />
            {s.cancel}
          </Button>
        ) : (
          <span />
        )}
        <Button onClick={onDone}>{copy.common.close}</Button>
      </DialogFooter>
      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title={s.cancelTitle}
        description={s.cancelText}
        confirmLabel={s.cancel}
        onConfirm={() => {
          cancelSession(session.id);
          toast.success(s.cancelledToast);
          onDone();
        }}
      />
    </DialogContent>
  );
}
