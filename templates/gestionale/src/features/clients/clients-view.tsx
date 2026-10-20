"use client";

import { Download, SearchX, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useData, useDataReady } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { collectTags, computeClientStats, fullName, type ClientStats } from "@/lib/domain/clients";
import type { Client, ClientStatus } from "@/lib/domain/types";
import { csvAmount, downloadCsv } from "@/lib/csv";
import { formatCurrency, formatDate } from "@/lib/format";
import { matchesQuery } from "@/lib/utils";
import { openDialog } from "@/store/ui-store";
import { ClientStatusBadge } from "@/components/status-badges";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/input";
import { Page, PageHeader, Toolbar } from "@/components/ui/page";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SortableTH,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
  type SortDirection,
} from "@/components/ui/table";
import { ClientRowMenu } from "./client-row-menu";

const t = copy.clients;
const PAGE_SIZE = 20;

type StatusFilter = "all" | ClientStatus;
type SortKey = "name" | "recent" | "lastVisit" | "spent";

const EMPTY_STATS: ClientStats = {
  totalSpent: 0,
  completedVisits: 0,
  lastVisit: null,
  nextAppointment: null,
};

export function ClientsView() {
  const ready = useDataReady();
  const now = useNow();
  const { clients, appointments, payments } = useData((state) => ({
    clients: state.clients,
    appointments: state.appointments,
    payments: state.payments,
  }));

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({
    key: "name",
    direction: "asc",
  });
  const [page, setPage] = useState(1);

  const stats = useMemo(
    () => (now ? computeClientStats(appointments, payments, now) : new Map<string, ClientStats>()),
    [appointments, payments, now],
  );
  const tags = useMemo(() => collectTags(clients), [clients]);

  const filtered = useMemo(() => {
    const result = clients.filter(
      (client) =>
        (status === "all" || client.status === status) &&
        (!tag || client.tags.includes(tag)) &&
        matchesQuery(
          `${fullName(client)} ${client.email} ${client.phone} ${client.company ?? ""}`,
          query,
        ),
    );
    const factor = sort.direction === "asc" ? 1 : -1;
    const statOf = (client: Client) => stats.get(client.id) ?? EMPTY_STATS;
    return result.sort((a, b) => {
      switch (sort.key) {
        case "name":
          return factor * fullName(a).localeCompare(fullName(b), "it");
        case "recent":
          return factor * a.createdAt.localeCompare(b.createdAt);
        case "lastVisit":
          return factor * (statOf(a).lastVisit ?? "").localeCompare(statOf(b).lastVisit ?? "");
        case "spent":
          return factor * (statOf(a).totalSpent - statOf(b).totalSpent);
      }
    });
  }, [clients, status, tag, query, sort, stats]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const hasFilters = query !== "" || status !== "all" || tag !== "";

  // I filtri riportano sempre alla prima pagina.
  const withReset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };

  const onSort = (key: SortKey) =>
    setSort((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "asc" ? "desc" : key === "name" ? "asc" : "desc",
    }));

  const exportCsv = () => {
    downloadCsv(`clienti-${formatDate(new Date(), "inputDate")}.csv`, filtered, [
      { header: "Nome", value: (c) => c.firstName },
      { header: "Cognome", value: (c) => c.lastName },
      { header: "Email", value: (c) => c.email },
      { header: "Telefono", value: (c) => c.phone },
      { header: "Azienda", value: (c) => c.company },
      { header: "Città", value: (c) => c.city },
      { header: "Stato", value: (c) => copy.status.client[c.status] },
      { header: "Etichette", value: (c) => c.tags.join(", ") },
      { header: "Consenso marketing", value: (c) => (c.marketingConsent ? "Sì" : "No") },
      { header: "Cliente dal", value: (c) => formatDate(c.createdAt, "numeric") },
      {
        header: "Ultima visita",
        value: (c) => {
          const v = stats.get(c.id)?.lastVisit;
          return v ? formatDate(v, "numeric") : "";
        },
      },
      { header: "Spesa totale (€)", value: (c) => csvAmount(stats.get(c.id)?.totalSpent ?? 0) },
    ]);
  };

  return (
    <Page>
      <PageHeader
        title={t.title}
        description={ready ? `${t.count(clients.length)} · ${t.description}` : t.description}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={exportCsv}
              disabled={!ready || filtered.length === 0}
            >
              <Download aria-hidden />
              {copy.common.exportCsv}
            </Button>
            <Button onClick={() => openDialog({ type: "client" })}>
              <UserPlus aria-hidden />
              {t.new}
            </Button>
          </>
        }
      />

      <Toolbar>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            value={query}
            onValueChange={withReset(setQuery)}
            label={copy.common.search}
            placeholder={t.searchPlaceholder}
            className="sm:w-80"
          />
          <SegmentedControl<StatusFilter>
            ariaLabel={t.columns.status}
            value={status}
            onChange={withReset(setStatus)}
            options={[
              { value: "all", label: copy.common.all },
              { value: "active", label: t.filters.active },
              { value: "lead", label: t.filters.lead },
              { value: "inactive", label: t.filters.inactive },
            ]}
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1 lg:w-48 lg:flex-none">
            <Select
              aria-label={t.tag}
              value={tag}
              onChange={(event) => withReset(setTag)(event.target.value)}
            >
              <option value="">{t.allTags}</option>
              {tags.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex-1 md:hidden">
            <Select
              aria-label={t.sort.label}
              value={sort.key}
              onChange={(event) => {
                const key = event.target.value as SortKey;
                setSort({ key, direction: key === "name" ? "asc" : "desc" });
              }}
            >
              <option value="name">{t.sort.name}</option>
              <option value="recent">{t.sort.recent}</option>
              <option value="lastVisit">{t.sort.lastVisit}</option>
              <option value="spent">{t.sort.spent}</option>
            </Select>
          </div>
        </div>
      </Toolbar>

      <Card className="overflow-hidden">
        {!ready || !now ? (
          <ListSkeleton />
        ) : clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title={t.empty}
            description={t.emptyHint}
            action={
              <Button onClick={() => openDialog({ type: "client" })}>
                <UserPlus aria-hidden />
                {t.new}
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title={t.noResults}
            description={t.noResultsHint}
            action={
              hasFilters ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery("");
                    setStatus("all");
                    setTag("");
                    setPage(1);
                  }}
                >
                  {copy.common.resetFilters}
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            <p className="sr-only" aria-live="polite">
              {copy.common.results(filtered.length)}
            </p>
            {/* Tabella: tablet e desktop */}
            <div className="hidden md:block">
              <Table>
                <THead>
                  <tr>
                    <SortableTH
                      label={t.columns.client}
                      sortKey="name"
                      current={sort.key}
                      direction={sort.direction}
                      onSort={onSort}
                    />
                    <TH className="hidden xl:table-cell">{t.columns.phone}</TH>
                    <TH>{t.columns.status}</TH>
                    <SortableTH
                      label={t.columns.lastVisit}
                      sortKey="lastVisit"
                      current={sort.key}
                      direction={sort.direction}
                      onSort={onSort}
                    />
                    <SortableTH
                      label={t.columns.spent}
                      sortKey="spent"
                      current={sort.key}
                      direction={sort.direction}
                      onSort={onSort}
                      align="right"
                    />
                    <TH className="hidden lg:table-cell">{t.columns.tags}</TH>
                    <TH>
                      <span className="sr-only">{copy.common.actions}</span>
                    </TH>
                  </tr>
                </THead>
                <TBody>
                  {visible.map((client) => {
                    const s = stats.get(client.id) ?? EMPTY_STATS;
                    return (
                      <TR key={client.id} className="relative hover:bg-surface-2/60">
                        <TD>
                          <div className="flex items-center gap-3">
                            <Avatar name={fullName(client)} />
                            <div className="min-w-0">
                              <Link
                                href={routes.client(client.id)}
                                className="block truncate font-medium text-fg after:absolute after:inset-0 hover:underline"
                              >
                                {fullName(client)}
                              </Link>
                              <p className="truncate text-[13px] text-fg-muted">
                                {client.email || client.phone}
                              </p>
                            </div>
                          </div>
                        </TD>
                        <TD className="hidden text-fg-muted tabular-nums xl:table-cell">
                          {client.phone}
                        </TD>
                        <TD>
                          <ClientStatusBadge status={client.status} />
                        </TD>
                        <TD className="text-fg-muted">
                          {s.lastVisit ? formatDate(s.lastVisit, "short") : t.never}
                        </TD>
                        <TD align="right" className="font-medium text-fg">
                          {formatCurrency(s.totalSpent)}
                        </TD>
                        <TD className="hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {client.tags.slice(0, 2).map((value) => (
                              <Badge key={value}>{value}</Badge>
                            ))}
                            {client.tags.length > 2 ? (
                              <Badge>+{client.tags.length - 2}</Badge>
                            ) : null}
                          </div>
                        </TD>
                        <TD align="right" className="w-12">
                          <ClientRowMenu client={client} />
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </div>

            {/* Elenco: smartphone */}
            <ul className="divide-y divide-line md:hidden">
              {visible.map((client) => {
                const s = stats.get(client.id) ?? EMPTY_STATS;
                return (
                  <li key={client.id} className="relative flex items-center gap-3 px-4 py-3.5">
                    <Avatar name={fullName(client)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={routes.client(client.id)}
                          className="truncate font-medium text-fg after:absolute after:inset-0"
                        >
                          {fullName(client)}
                        </Link>
                      </div>
                      <p className="truncate text-[13px] text-fg-muted">
                        {s.lastVisit
                          ? `${t.columns.lastVisit}: ${formatDate(s.lastVisit, "dayMonth")}`
                          : client.phone}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <ClientStatusBadge status={client.status} />
                      <span className="text-[13px] font-medium text-fg tabular-nums">
                        {formatCurrency(s.totalSpent, { round: true })}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
            <Pagination
              page={currentPage}
              pageSize={PAGE_SIZE}
              total={filtered.length}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>
    </Page>
  );
}

function ListSkeleton() {
  return (
    <div className="divide-y divide-line" aria-busy="true">
      <span className="sr-only">{copy.common.loading}</span>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-4 sm:px-6">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
