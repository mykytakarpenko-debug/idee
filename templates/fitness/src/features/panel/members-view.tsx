"use client";

import { SearchX, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { copy } from "@/content/it";
import { useData, useDataReady } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { parseISODate } from "@/lib/domain/dates";
import {
  certificateStatus,
  membershipStatus,
  type MembershipStatus,
} from "@/lib/domain/membership";
import { formatDate } from "@/lib/format";
import { matchesQuery } from "@/lib/utils";
import { openDialog } from "@/store/ui-store";
import { CertificateBadge, MembershipBadge } from "@/components/status-badges";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/input";
import { Page, PageHeader, Toolbar } from "@/components/ui/page";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

const t = copy.members;
const PAGE_SIZE = 20;
type StatusFilter = "all" | Exclude<MembershipStatus, "suspended">;

export function MembersView() {
  const ready = useDataReady();
  const now = useNow();
  const { members, plans, checkIns, settings } = useData((state) => ({
    members: state.members,
    plans: state.plans,
    checkIns: state.checkIns,
    settings: state.settings,
  }));
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [certFilter, setCertFilter] = useState<"" | "issues">("");
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    if (!now) return [];
    const lastVisit = new Map<string, string>();
    for (const c of checkIns) {
      const prev = lastVisit.get(c.memberId);
      if (!prev || c.at > prev) lastVisit.set(c.memberId, c.at);
    }
    const planName = new Map(plans.map((p) => [p.id, p.name]));
    return members
      .map((member) => ({
        member,
        name: `${member.firstName} ${member.lastName}`,
        plan: planName.get(member.planId) ?? "",
        status: membershipStatus(member, now, settings.reminderDays),
        cert: certificateStatus(member.medicalCertExpiry, now, settings.requireMedicalCert),
        lastVisit: lastVisit.get(member.id) ?? null,
      }))
      .filter((row) => status === "all" || row.status === status)
      .filter(
        (row) =>
          certFilter === "" ||
          row.cert === "expired" ||
          row.cert === "missing" ||
          row.cert === "expiring",
      )
      .filter((row) => matchesQuery(`${row.name} ${row.member.email} ${row.member.code}`, query))
      .sort(
        (a, b) =>
          a.member.lastName.localeCompare(b.member.lastName) ||
          a.member.firstName.localeCompare(b.member.firstName),
      );
  }, [now, members, plans, checkIns, settings, status, certFilter, query]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visible = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const reset = (fn: () => void) => {
    fn();
    setPage(1);
  };
  const day = (iso: string) => formatDate(parseISODate(iso), "short");

  return (
    <Page>
      <PageHeader
        title={t.title}
        description={t.description}
        actions={
          <Button onClick={() => openDialog({ type: "member" })}>
            <UserPlus aria-hidden />
            {copy.panel.newMember}
          </Button>
        }
      />
      <Toolbar>
        <SegmentedControl<StatusFilter>
          ariaLabel={t.filters.status}
          value={status}
          onChange={(value) => reset(() => setStatus(value))}
          options={[
            { value: "all", label: copy.common.all },
            { value: "active", label: copy.status.membership.active },
            { value: "expiring", label: copy.status.membership.expiring },
            { value: "expired", label: copy.status.membership.expired },
          ]}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <SearchInput
            value={query}
            onValueChange={(value) => reset(() => setQuery(value))}
            label={copy.common.search}
            placeholder={t.searchPlaceholder}
            className="sm:w-72"
          />
          <div className="sm:w-56">
            <Select
              aria-label={t.filters.certificate}
              value={certFilter}
              onChange={(e) => reset(() => setCertFilter(e.target.value as "" | "issues"))}
            >
              <option value="">{t.filters.anyCertificate}</option>
              <option value="issues">{t.filters.certificateIssues}</option>
            </Select>
          </div>
        </div>
      </Toolbar>

      <Card>
        {!ready || !now ? (
          <div className="space-y-3 p-6" aria-busy="true">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={SearchX} title={t.empty} description={t.emptyHint} />
        ) : (
          <>
            <p className="px-5 pt-4 text-[13px] text-fg-muted sm:px-6" aria-live="polite">
              {t.count(rows.length)}
            </p>
            <div className="hidden md:block">
              <Table>
                <THead>
                  <tr>
                    <TH>{t.columns.name}</TH>
                    <TH>{t.columns.plan}</TH>
                    <TH>{t.columns.status}</TH>
                    <TH>{t.columns.expiry}</TH>
                    <TH className="hidden lg:table-cell">{t.columns.certificate}</TH>
                    <TH className="hidden xl:table-cell">{t.columns.lastVisit}</TH>
                  </tr>
                </THead>
                <TBody>
                  {visible.map((row) => (
                    <TR key={row.member.id} className="relative hover:bg-surface-2/60">
                      <TD>
                        <div className="flex items-center gap-3">
                          <Avatar name={row.name} />
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() =>
                                openDialog({ type: "member-detail", id: row.member.id })
                              }
                              className="block truncate text-left font-medium text-fg after:absolute after:inset-0 hover:underline"
                            >
                              {row.name}
                            </button>
                            <p className="truncate font-mono text-xs text-fg-muted">
                              {row.member.code}
                            </p>
                          </div>
                        </div>
                      </TD>
                      <TD className="text-fg">{row.plan}</TD>
                      <TD>
                        <MembershipBadge status={row.status} />
                      </TD>
                      <TD className="text-fg-muted tabular-nums">
                        {row.member.entriesLeft !== null
                          ? copy.common.entries(row.member.entriesLeft)
                          : day(row.member.membershipEnd)}
                      </TD>
                      <TD className="hidden lg:table-cell">
                        <CertificateBadge status={row.cert} />
                      </TD>
                      <TD className="hidden text-fg-muted xl:table-cell">
                        {row.lastVisit ? formatDate(row.lastVisit, "dayMonth") : t.never}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
            <ul className="mt-2 divide-y divide-line md:hidden">
              {visible.map((row) => (
                <li key={row.member.id} className="relative flex items-center gap-3 px-4 py-3.5">
                  <Avatar name={row.name} />
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => openDialog({ type: "member-detail", id: row.member.id })}
                      className="block truncate text-left font-medium text-fg after:absolute after:inset-0"
                    >
                      {row.name}
                    </button>
                    <p className="truncate text-[13px] text-fg-muted">
                      {row.plan} · {day(row.member.membershipEnd)}
                    </p>
                  </div>
                  <MembershipBadge status={row.status} />
                </li>
              ))}
            </ul>
            <Pagination
              page={currentPage}
              pageSize={PAGE_SIZE}
              total={rows.length}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>
    </Page>
  );
}
