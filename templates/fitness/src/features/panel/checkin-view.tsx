"use client";

import { CircleAlert, CircleCheck, ScanLine, TriangleAlert, UserSearch } from "lucide-react";
import { useMemo, useState } from "react";
import { copy } from "@/content/it";
import { useData, useDataReady } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { checkInEligibility } from "@/lib/domain/checkin";
import { toISODate } from "@/lib/domain/dates";
import { membershipStatus } from "@/lib/domain/membership";
import { formatDate } from "@/lib/format";
import { cn, matchesQuery } from "@/lib/utils";
import { useDataStore } from "@/store/data-store";
import { MembershipBadge } from "@/components/status-badges";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Page, PageHeader } from "@/components/ui/page";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";

const t = copy.checkin;

export function CheckInView() {
  const ready = useDataReady();
  const now = useNow();
  const { members, plans, checkIns, settings } = useData((state) => ({
    members: state.members,
    plans: state.plans,
    checkIns: state.checkIns,
    settings: state.settings,
  }));
  const checkIn = useDataStore((state) => state.checkIn);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim();
    if (q.length < 2) return [];
    return members
      .filter((m) => matchesQuery(`${m.firstName} ${m.lastName} ${m.code}`, q))
      .slice(0, 6);
  }, [members, query]);

  const todayList = useMemo(() => {
    if (!now) return [];
    const today = toISODate(now);
    return checkIns
      .filter((c) => toISODate(new Date(c.at)) === today)
      .sort((a, b) => b.at.localeCompare(a.at));
  }, [checkIns, now]);

  const selected = members.find((m) => m.id === selectedId) ?? null;
  const plan = selected ? plans.find((p) => p.id === selected.planId) : undefined;
  const result =
    selected && now ? checkInEligibility(selected, plan, checkIns, settings, now) : null;
  const memberName = (id: string) => {
    const m = members.find((x) => x.id === id);
    return m ? `${m.firstName} ${m.lastName}` : id;
  };

  return (
    <Page>
      <PageHeader title={t.title} description={t.description} />
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-4">
          <Card className="p-5 sm:p-6">
            <SearchInput
              value={query}
              onValueChange={(value) => {
                setQuery(value);
                setSelectedId(null);
              }}
              label={t.searchPlaceholder}
              placeholder={t.searchPlaceholder}
              className="w-full"
            />
            {query.trim().length < 2 ? (
              <p className="mt-3 text-[13px] text-fg-muted">{t.hint}</p>
            ) : results.length === 0 ? (
              <p className="mt-3 text-sm text-fg-muted" role="status">
                {t.noResults}
              </p>
            ) : (
              <ul
                className="mt-3 divide-y divide-line rounded-lg border border-line"
                aria-label={copy.common.results(results.length)}
              >
                {results.map((member) => {
                  const name = `${member.firstName} ${member.lastName}`;
                  return (
                    <li key={member.id}>
                      <button
                        type="button"
                        aria-pressed={selectedId === member.id}
                        onClick={() => setSelectedId(member.id)}
                        className={cn(
                          "flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm transition-colors",
                          selectedId === member.id ? "bg-accent-soft" : "hover:bg-surface-2",
                        )}
                      >
                        <Avatar name={name} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-fg">{name}</span>
                          <span className="block font-mono text-xs text-fg-muted">
                            {member.code}
                          </span>
                        </span>
                        {now ? (
                          <MembershipBadge
                            status={membershipStatus(member, now, settings.reminderDays)}
                          />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {selected && result ? (
            <Card
              className={cn("p-5 sm:p-6", result.ok ? "border-success/40" : "border-danger/40")}
              aria-live="polite"
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex size-11 items-center justify-center rounded-full",
                    result.ok ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
                  )}
                >
                  {result.ok ? (
                    <CircleCheck aria-hidden className="size-6" />
                  ) : (
                    <CircleAlert aria-hidden className="size-6" />
                  )}
                </span>
                <div>
                  <p className={cn("font-semibold", result.ok ? "text-success" : "text-danger")}>
                    {result.ok ? t.allowed : t.denied}
                  </p>
                  <p className="text-sm text-fg">
                    {selected.firstName} {selected.lastName} · {plan?.name}
                  </p>
                </div>
              </div>
              {result.blocks.length + result.warnings.length > 0 ? (
                <ul className="mt-4 space-y-1.5 text-sm">
                  {result.blocks.map((block) => (
                    <li key={block} className="flex items-center gap-2 text-danger">
                      <CircleAlert aria-hidden className="size-4" />
                      {t.blocks[block]}
                    </li>
                  ))}
                  {result.warnings.map((warning) => (
                    <li key={warning} className="flex items-center gap-2 text-warning">
                      <TriangleAlert aria-hidden className="size-4" />
                      {t.warnings[warning]}
                    </li>
                  ))}
                </ul>
              ) : null}
              <Button
                size="lg"
                className="mt-5 w-full sm:w-auto"
                disabled={!result.ok}
                onClick={() => {
                  checkIn(selected.id);
                  toast.success(t.registered(`${selected.firstName} ${selected.lastName}`));
                  setSelectedId(null);
                  setQuery("");
                }}
              >
                <ScanLine aria-hidden />
                {t.register}
              </Button>
            </Card>
          ) : null}
        </div>

        <Card>
          <CardHeader title={t.today} description={t.todayCount(todayList.length)} />
          {!ready || !now ? (
            <div className="space-y-2 p-6">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : todayList.length === 0 ? (
            <EmptyState compact icon={UserSearch} title={t.todayEmpty} />
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {todayList.slice(0, 40).map((entry) => (
                <li key={entry.id} className="flex items-center gap-3 px-5 py-2.5 text-sm sm:px-6">
                  <span className="w-12 font-medium text-fg tabular-nums">
                    {formatDate(entry.at, "time")}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-fg">
                    {memberName(entry.memberId)}
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
