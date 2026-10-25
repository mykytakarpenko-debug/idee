"use client";

import { Download, ScrollText } from "lucide-react";
import { useMemo, useState } from "react";
import { copy } from "@/content/it";
import { useData } from "@/hooks/use-data";
import { filterAudit, type AuditFilters } from "@/lib/domain/analytics";
import type { AuditAction } from "@/lib/domain/types";
import { downloadCsv } from "@/lib/csv";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/input";
import { Page, PageHeader, Toolbar } from "@/components/ui/page";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

const t = copy.audit;
const PAGE_SIZE = 20;
const ACTIONS = Object.keys(copy.auditActions) as AuditAction[];

export function AuditView() {
  const { audit, users, organizations, retention } = useData((state) => ({
    audit: state.audit,
    users: state.users,
    organizations: state.organizations,
    retention: state.settings.auditRetentionDays,
  }));
  const [filters, setFilters] = useState<AuditFilters>({
    q: "",
    action: "",
    orgId: "",
    actorId: "",
  });
  const [page, setPage] = useState(1);
  const names = useMemo(() => new Map(users.map((u) => [u.id, u.name])), [users]);
  const rows = useMemo(() => filterAudit(audit, filters, names), [audit, filters, names]);
  const orgName = (id: string | null) =>
    id ? (organizations.find((o) => o.id === id)?.name ?? "—") : t.staff;
  const update = (patch: Partial<AuditFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  };

  return (
    <Page>
      <PageHeader
        title={t.title}
        description={t.description}
        actions={
          <Button
            variant="secondary"
            disabled={rows.length === 0}
            onClick={() =>
              downloadCsv("registro-attivita.csv", rows, [
                { header: t.columns.at, value: (e) => e.at },
                { header: t.columns.actor, value: (e) => names.get(e.actorId) ?? e.actorId },
                { header: t.columns.action, value: (e) => copy.auditActions[e.action] },
                { header: t.columns.target, value: (e) => e.target },
                { header: t.columns.org, value: (e) => orgName(e.orgId) },
                { header: t.columns.ip, value: (e) => e.ip },
              ])
            }
          >
            <Download aria-hidden />
            {copy.common.exportCsv}
          </Button>
        }
      />
      <Toolbar>
        <SearchInput
          label={t.search}
          placeholder={t.search}
          value={filters.q}
          onValueChange={(q) => update({ q })}
          className="sm:max-w-xs"
        />
        <Select
          aria-label={t.allActions}
          value={filters.action}
          onChange={(e) => update({ action: e.target.value as AuditAction | "" })}
          className="sm:w-60"
        >
          <option value="">{t.allActions}</option>
          {ACTIONS.map((action) => (
            <option key={action} value={action}>
              {copy.auditActions[action]}
            </option>
          ))}
        </Select>
        <Select
          aria-label={t.allOrgs}
          value={filters.orgId}
          onChange={(e) => update({ orgId: e.target.value })}
          className="sm:w-56"
        >
          <option value="">{t.allOrgs}</option>
          {organizations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </Select>
      </Toolbar>
      <Card>
        {rows.length === 0 ? (
          <EmptyState icon={ScrollText} title={t.empty} />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>{t.columns.at}</TH>
                  <TH>{t.columns.action}</TH>
                  <TH className="hidden md:table-cell">{t.columns.actor}</TH>
                  <TH className="hidden sm:table-cell">{t.columns.target}</TH>
                  <TH className="hidden lg:table-cell">{t.columns.org}</TH>
                  <TH align="right" className="hidden xl:table-cell">
                    {t.columns.ip}
                  </TH>
                </TR>
              </THead>
              <TBody>
                {rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((event) => (
                  <TR key={event.id}>
                    <TD className="whitespace-nowrap text-fg-muted">
                      {formatDate(event.at, "dateTime")}
                    </TD>
                    <TD className="text-fg">
                      {copy.auditActions[event.action]}
                      <p className="text-[13px] text-fg-muted md:hidden">
                        {names.get(event.actorId) ?? "—"}
                      </p>
                    </TD>
                    <TD className="hidden text-fg md:table-cell">
                      {names.get(event.actorId) ?? "—"}
                    </TD>
                    <TD className="hidden break-all text-fg-muted sm:table-cell">{event.target}</TD>
                    <TD className="hidden text-fg-muted lg:table-cell">{orgName(event.orgId)}</TD>
                    <TD
                      align="right"
                      className="hidden font-mono text-[13px] text-fg-muted xl:table-cell"
                    >
                      {event.ip}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={rows.length}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>
      <p className="text-[13px] text-fg-muted">{t.retention(retention)}</p>
    </Page>
  );
}
