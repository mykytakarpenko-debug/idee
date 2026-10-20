"use client";

import { Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { copy } from "@/content/it";
import { useData, useDataReady } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { conflictsWithTimeOff, rangesValid } from "@/lib/domain/availability";
import { parseISODate, toISODate } from "@/lib/domain/dates";
import type { IsoWeekday, TimeRange, WeeklyHours } from "@/lib/domain/types";
import { formatDate } from "@/lib/format";
import { useDataStore } from "@/store/data-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { Page, PageHeader } from "@/components/ui/page";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";

const t = copy.availability;
const DAYS: IsoWeekday[] = [1, 2, 3, 4, 5, 6, 7];

export function AvailabilityView() {
  const ready = useDataReady();
  const { staff, hours } = useData((state) => ({ staff: state.staff, hours: state.hours }));
  const [picked, setPicked] = useState<string | null>(null);
  const staffId = picked ?? staff[0]?.id ?? "";

  return (
    <Page>
      <PageHeader title={t.title} description={t.description} />
      {!ready ? (
        <Skeleton className="h-96 rounded-xl" aria-busy="true" />
      ) : (
        <>
          <SegmentedControl<string>
            ariaLabel={copy.booking.staff.who}
            value={staffId}
            onChange={setPicked}
            options={staff.map((person) => ({ value: person.id, label: person.name }))}
          />
          <WeeklyEditor
            key={`${staffId}-${JSON.stringify(hours.filter((h) => h.staffId === staffId))}`}
            staffId={staffId}
            initial={hours.filter((h) => h.staffId === staffId)}
          />
          <TimeOffSection />
        </>
      )}
    </Page>
  );
}

function WeeklyEditor({ staffId, initial }: { staffId: string; initial: WeeklyHours[] }) {
  const setHours = useDataStore((state) => state.setHours);
  const [draft, setDraft] = useState<Record<number, TimeRange[]>>(() =>
    Object.fromEntries(DAYS.map((day) => [day, initial.find((h) => h.day === day)?.ranges ?? []])),
  );
  const [error, setError] = useState(false);

  const update = (day: IsoWeekday, ranges: TimeRange[]) => {
    setDraft((prev) => ({ ...prev, [day]: ranges }));
    setError(false);
  };

  const save = () => {
    if (DAYS.some((day) => !rangesValid(draft[day] ?? []))) {
      setError(true);
      return;
    }
    setHours(
      staffId,
      DAYS.filter((day) => (draft[day] ?? []).length > 0).map((day) => ({
        staffId,
        day,
        ranges: [...(draft[day] ?? [])].sort((a, b) => a.from.localeCompare(b.from)),
      })),
    );
    toast.success(t.saved);
  };

  return (
    <Card>
      <CardHeader title={t.weekly} description={t.weeklyHint} />
      <CardContent>
        <ul className="divide-y divide-line">
          {DAYS.map((day) => {
            const ranges = draft[day] ?? [];
            const dayName = copy.weekdays[day - 1] ?? "";
            const invalid = error && !rangesValid(ranges);
            return (
              <li
                key={day}
                className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 lg:flex-row lg:items-start"
              >
                <span className="w-28 pt-2 text-sm font-medium text-fg">{dayName}</span>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  {ranges.length === 0 ? (
                    <p className="pt-2 text-sm text-fg-muted">{t.closed}</p>
                  ) : null}
                  {ranges.map((range, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        type="time"
                        step={900}
                        value={range.from}
                        aria-label={`${dayName}, ${t.from}`}
                        aria-invalid={invalid || undefined}
                        className="min-w-0 flex-1 sm:w-36 sm:flex-none"
                        onChange={(e) =>
                          update(
                            day,
                            ranges.map((r, j) => (j === i ? { ...r, from: e.target.value } : r)),
                          )
                        }
                      />
                      <span aria-hidden className="text-fg-muted">
                        –
                      </span>
                      <Input
                        type="time"
                        step={900}
                        value={range.to}
                        aria-label={`${dayName}, ${t.to}`}
                        aria-invalid={invalid || undefined}
                        className="min-w-0 flex-1 sm:w-36 sm:flex-none"
                        onChange={(e) =>
                          update(
                            day,
                            ranges.map((r, j) => (j === i ? { ...r, to: e.target.value } : r)),
                          )
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`${t.removeRange}: ${dayName} ${range.from}–${range.to}`}
                        onClick={() =>
                          update(
                            day,
                            ranges.filter((_, j) => j !== i),
                          )
                        }
                      >
                        <X aria-hidden />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const last = ranges.at(-1);
                    update(day, [
                      ...ranges,
                      last ? { from: last.to, to: last.to } : { from: "09:00", to: "13:00" },
                    ]);
                  }}
                >
                  <Plus aria-hidden />
                  {t.addRange}
                  <span className="sr-only"> · {dayName}</span>
                </Button>
              </li>
            );
          })}
        </ul>
        {error ? (
          <p role="alert" className="mt-3 text-[13px] text-danger">
            {t.invalid}
          </p>
        ) : null}
      </CardContent>
      <div className="flex justify-end border-t border-line px-5 py-4 sm:px-6">
        <Button onClick={save}>{copy.common.saveChanges}</Button>
      </div>
    </Card>
  );
}

function TimeOffSection() {
  const now = useNow();
  const { timeOff, staff, appointments } = useData((state) => ({
    timeOff: state.timeOff,
    staff: state.staff,
    appointments: state.appointments,
  }));
  const addTimeOff = useDataStore((state) => state.addTimeOff);
  const removeTimeOff = useDataStore((state) => state.removeTimeOff);
  const today = now ? toISODate(now) : "";
  const [who, setWho] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | undefined>();
  const day = (iso: string) => formatDate(parseISODate(iso), "short");
  const personName = (id: string | null) =>
    id ? (staff.find((p) => p.id === id)?.name ?? "") : t.wholeStudio;

  return (
    <Card>
      <CardHeader title={t.timeOff} description={t.timeOffHint} />
      <CardContent className="flex flex-col gap-6">
        {timeOff.length === 0 ? (
          <EmptyState compact icon={Trash2} title={t.timeOffEmpty} />
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line">
            {[...timeOff]
              .sort((a, b) => a.from.localeCompare(b.from))
              .map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-fg">{personName(entry.staffId)}</span>
                    <span className="block text-fg-muted">
                      {day(entry.from)} – {day(entry.to)} · {entry.reason}
                    </span>
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${copy.common.delete}: ${personName(entry.staffId)} ${day(entry.from)}`}
                    onClick={() => {
                      removeTimeOff(entry.id);
                      toast.success(t.timeOffRemoved);
                    }}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </li>
              ))}
          </ul>
        )}

        <form
          noValidate
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!from || !to || to < from) {
              setError(t.timeOffInvalid);
              return;
            }
            const entry = { staffId: who || null, from, to, reason: reason.trim() || t.timeOff };
            const conflicts = conflictsWithTimeOff(appointments, entry).length;
            addTimeOff(entry);
            toast.success(
              t.timeOffAdded,
              conflicts > 0 ? { description: t.conflicts(conflicts) } : undefined,
            );
            setFrom("");
            setTo("");
            setReason("");
            setError(undefined);
          }}
        >
          <Field label={t.timeOffWho} name="who">
            {(props) => (
              <Select
                {...props}
                required={undefined}
                value={who}
                onChange={(e) => setWho(e.target.value)}
              >
                <option value="">{t.wholeStudio}</option>
                {staff.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={t.timeOffFrom} name="from" error={error}>
            {(props) => (
              <Input
                {...props}
                type="date"
                min={today}
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            )}
          </Field>
          <Field label={t.timeOffTo} name="to">
            {(props) => (
              <Input
                {...props}
                type="date"
                min={from || today}
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            )}
          </Field>
          <Field label={t.timeOffReason} name="reason" optional>
            {(props) => (
              <Input {...props} value={reason} onChange={(e) => setReason(e.target.value)} />
            )}
          </Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <Button type="submit" variant="secondary">
              <Plus aria-hidden />
              {t.addTimeOff}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
