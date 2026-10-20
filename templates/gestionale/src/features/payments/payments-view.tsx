"use client";

import { startOfDay, startOfYear, subDays } from "date-fns";
import {
  Check,
  Download,
  Ellipsis,
  Pencil,
  Plus,
  Printer,
  SearchX,
  Trash2,
  Undo2,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useData, useDataReady } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { averageTicket, monthToDate, revenue } from "@/lib/domain/analytics";
import { fullName } from "@/lib/domain/clients";
import { paymentDisplayStatus, paymentTotals } from "@/lib/domain/payments";
import type { Client, Payment, PaymentDisplayStatus, PaymentMethod } from "@/lib/domain/types";
import { csvAmount, downloadCsv } from "@/lib/csv";
import { formatCurrency, formatDate } from "@/lib/format";
import { matchesQuery } from "@/lib/utils";
import { useDataStore } from "@/store/data-store";
import { openDialog } from "@/store/ui-store";
import { PaymentStatusBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/input";
import { Page, PageHeader, Toolbar } from "@/components/ui/page";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
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
import { toast } from "@/components/ui/toast";

const t = copy.payments;
const PAGE_SIZE = 25;
const METHODS: PaymentMethod[] = ["card", "cash", "transfer", "voucher"];

type StatusFilter = "all" | PaymentDisplayStatus;
type Period = "all" | "30d" | "90d" | "year";
type SortKey = "date" | "due" | "amount";

function nameOf(clients: Map<string, Client>, id: string): string {
  const client = clients.get(id);
  return client ? fullName(client) : copy.common.deletedClient;
}

export function PaymentsView() {
  const ready = useDataReady();
  const now = useNow();
  const { payments, clients } = useData((state) => ({
    payments: state.payments,
    clients: state.clients,
  }));
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [method, setMethod] = useState<"" | PaymentMethod>("");
  const [period, setPeriod] = useState<Period>("90d");
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({
    key: "date",
    direction: "desc",
  });
  const [page, setPage] = useState(1);

  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const clientName = (id: string) => nameOf(clientById, id);

  const kpi = useMemo(() => {
    if (!now) return null;
    const mtd = monthToDate(now);
    const totals = paymentTotals(payments, now);
    return {
      collected: revenue(payments, mtd.current),
      average: averageTicket(payments, mtd.current),
      totals,
    };
  }, [payments, now]);

  const filtered = useMemo(() => {
    if (!now) return [];
    const today = startOfDay(now);
    const since =
      period === "30d"
        ? subDays(today, 29)
        : period === "90d"
          ? subDays(today, 89)
          : period === "year"
            ? startOfYear(now)
            : null;
    const result = payments.filter((p) => {
      const displayStatus = paymentDisplayStatus(p, now);
      // Gli insoluti restano sempre visibili, anche se emessi prima del periodo.
      const inPeriod = !since || new Date(p.issuedAt) >= since || displayStatus === "overdue";
      return (
        inPeriod &&
        (status === "all" || displayStatus === status) &&
        (!method || p.method === method) &&
        matchesQuery(`${nameOf(clientById, p.clientId)} ${p.number} ${p.description}`, query)
      );
    });
    const factor = sort.direction === "asc" ? 1 : -1;
    return result.sort((a, b) => {
      if (sort.key === "amount") return factor * (a.amount - b.amount);
      if (sort.key === "due") return factor * a.dueAt.localeCompare(b.dueAt);
      return factor * a.issuedAt.localeCompare(b.issuedAt);
    });
  }, [payments, now, period, status, method, query, sort, clientById]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const withReset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };
  const onSort = (key: SortKey) =>
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));

  const exportCsv = () => {
    if (!now) return;
    downloadCsv(`pagamenti-${formatDate(now, "inputDate")}.csv`, filtered, [
      { header: "Numero", value: (p) => p.number },
      { header: "Data", value: (p) => formatDate(p.issuedAt, "numeric") },
      { header: "Scadenza", value: (p) => formatDate(p.dueAt, "numeric") },
      { header: "Cliente", value: (p) => clientName(p.clientId) },
      { header: "Descrizione", value: (p) => p.description },
      { header: "Metodo", value: (p) => copy.paymentMethod[p.method] },
      { header: "Stato", value: (p) => copy.status.payment[paymentDisplayStatus(p, now)] },
      { header: "Importo (€)", value: (p) => csvAmount(p.amount) },
      { header: "Incassato il", value: (p) => (p.paidAt ? formatDate(p.paidAt, "numeric") : "") },
    ]);
  };

  return (
    <Page>
      <PageHeader
        title={t.title}
        description={t.description}
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
            <Button onClick={() => openDialog({ type: "payment" })}>
              <Plus aria-hidden />
              {t.new}
            </Button>
          </>
        }
      />

      <section aria-label={t.title} className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {kpi ? (
          <>
            <StatCard
              label={t.kpi.collected}
              value={formatCurrency(kpi.collected, { round: true })}
            />
            <StatCard
              label={t.kpi.pending}
              value={formatCurrency(kpi.totals.pending, { round: true })}
              hint={t.kpi.documents(kpi.totals.pendingCount)}
            />
            <StatCard
              label={t.kpi.overdue}
              value={formatCurrency(kpi.totals.overdue, { round: true })}
              hint={
                <span className={kpi.totals.overdueCount > 0 ? "text-danger" : undefined}>
                  {t.kpi.documents(kpi.totals.overdueCount)}
                </span>
              }
            />
            <StatCard label={t.kpi.averageTicket} value={formatCurrency(kpi.average)} />
          </>
        ) : (
          Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[110px] rounded-xl" />)
        )}
      </section>

      <Toolbar>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            value={query}
            onValueChange={withReset(setQuery)}
            label={copy.common.search}
            placeholder={t.searchPlaceholder}
            className="sm:w-72"
          />
          <SegmentedControl<StatusFilter>
            ariaLabel={t.columns.status}
            value={status}
            onChange={withReset(setStatus)}
            options={[
              { value: "all", label: copy.common.all },
              { value: "paid", label: t.filters.paid },
              { value: "pending", label: t.filters.pending },
              { value: "overdue", label: t.filters.overdue },
              { value: "refunded", label: t.filters.refunded },
            ]}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 lg:flex">
          <div className="lg:w-44">
            <Select
              aria-label={copy.reports.period}
              value={period}
              onChange={(e) => withReset(setPeriod)(e.target.value as Period)}
            >
              {(Object.keys(t.periods) as Period[]).map((value) => (
                <option key={value} value={value}>
                  {t.periods[value]}
                </option>
              ))}
            </Select>
          </div>
          <div className="lg:w-40">
            <Select
              aria-label={t.columns.method}
              value={method}
              onChange={(e) => withReset(setMethod)(e.target.value as "" | PaymentMethod)}
            >
              <option value="">{t.allMethods}</option>
              {METHODS.map((value) => (
                <option key={value} value={value}>
                  {copy.paymentMethod[value]}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Toolbar>

      <Card className="overflow-hidden">
        {!ready || !now ? (
          <div className="space-y-3 p-6" aria-busy="true">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title={t.empty}
            description={t.emptyHint}
            action={
              <Button onClick={() => openDialog({ type: "payment" })}>
                <Plus aria-hidden />
                {t.new}
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState icon={SearchX} title={t.noResults} description={copy.clients.noResultsHint} />
        ) : (
          <>
            <p className="sr-only" aria-live="polite">
              {t.count(filtered.length)}
            </p>
            <div className="hidden md:block">
              <Table>
                <THead>
                  <tr>
                    <TH>{t.columns.number}</TH>
                    <TH>{t.columns.client}</TH>
                    <TH className="hidden xl:table-cell">{t.columns.description}</TH>
                    <SortableTH
                      label={t.columns.date}
                      sortKey="date"
                      current={sort.key}
                      direction={sort.direction}
                      onSort={onSort}
                    />
                    <SortableTH
                      label={t.columns.due}
                      sortKey="due"
                      current={sort.key}
                      direction={sort.direction}
                      onSort={onSort}
                      className="hidden lg:table-cell"
                    />
                    <TH className="hidden lg:table-cell">{t.columns.method}</TH>
                    <SortableTH
                      label={t.columns.amount}
                      sortKey="amount"
                      current={sort.key}
                      direction={sort.direction}
                      onSort={onSort}
                      align="right"
                    />
                    <TH>{t.columns.status}</TH>
                    <TH>
                      <span className="sr-only">{copy.common.actions}</span>
                    </TH>
                  </tr>
                </THead>
                <TBody>
                  {visible.map((payment) => (
                    <TR key={payment.id} className="hover:bg-surface-2/60">
                      <TD className="font-medium text-fg tabular-nums">{payment.number}</TD>
                      <TD>
                        {clientById.has(payment.clientId) ? (
                          <Link
                            href={routes.client(payment.clientId)}
                            className="text-fg hover:underline"
                          >
                            {clientName(payment.clientId)}
                          </Link>
                        ) : (
                          <span className="text-fg-muted">{copy.common.deletedClient}</span>
                        )}
                      </TD>
                      <TD className="hidden max-w-56 truncate text-fg-muted xl:table-cell">
                        {payment.description}
                      </TD>
                      <TD className="text-fg-muted">{formatDate(payment.issuedAt, "short")}</TD>
                      <TD className="hidden text-fg-muted lg:table-cell">
                        {formatDate(payment.dueAt, "short")}
                      </TD>
                      <TD className="hidden text-fg-muted lg:table-cell">
                        {copy.paymentMethod[payment.method]}
                      </TD>
                      <TD align="right" className="font-medium text-fg">
                        {formatCurrency(payment.amount)}
                      </TD>
                      <TD>
                        <PaymentStatusBadge status={paymentDisplayStatus(payment, now)} />
                      </TD>
                      <TD align="right" className="w-12">
                        <PaymentActions payment={payment} />
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
            <ul className="divide-y divide-line md:hidden">
              {visible.map((payment) => (
                <li key={payment.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">
                      {clientName(payment.clientId)}
                    </p>
                    <p className="truncate text-[13px] text-fg-muted">
                      {payment.number} · {formatDate(payment.issuedAt, "dayMonth")} ·{" "}
                      {copy.paymentMethod[payment.method]}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-medium text-fg tabular-nums">
                      {formatCurrency(payment.amount)}
                    </span>
                    <PaymentStatusBadge status={paymentDisplayStatus(payment, now)} />
                  </div>
                  <PaymentActions payment={payment} />
                </li>
              ))}
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

function PaymentActions({ payment }: { payment: Payment }) {
  const markPaid = useDataStore((state) => state.markPaymentPaid);
  const refund = useDataStore((state) => state.refundPayment);
  const updatePayment = useDataStore((state) => state.updatePayment);
  const remove = useDataStore((state) => state.deletePayment);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`${copy.common.moreActions}: ${payment.number}`}
          >
            <Ellipsis aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          {payment.status === "pending" ? (
            <DropdownMenuItem
              onSelect={() => {
                markPaid(payment.id);
                toast.success(t.markedPaid, {
                  description: payment.number,
                  action: {
                    label: copy.common.cancel,
                    onClick: () => updatePayment(payment.id, { status: "pending", paidAt: null }),
                  },
                });
              }}
            >
              <Check aria-hidden />
              {t.markPaid}
            </DropdownMenuItem>
          ) : null}
          {payment.status === "paid" ? (
            <DropdownMenuItem
              onSelect={() => {
                refund(payment.id);
                toast.success(t.refunded, { description: payment.number });
              }}
            >
              <Undo2 aria-hidden />
              {t.refund}
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem
            onSelect={() =>
              window.open(`/ricevuta/${encodeURIComponent(payment.id)}`, "_blank", "noopener")
            }
          >
            <Printer aria-hidden />
            {t.receipt}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => openDialog({ type: "payment", id: payment.id })}>
            <Pencil aria-hidden />
            {copy.common.edit}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem tone="danger" onSelect={() => setConfirmOpen(true)}>
            <Trash2 aria-hidden />
            {copy.common.delete}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t.delete.title}
        description={t.delete.description}
        confirmLabel={t.delete.confirm}
        onConfirm={() => {
          remove(payment.id);
          toast.success(t.delete.done);
        }}
      />
    </>
  );
}
