"use client";

import { Users } from "lucide-react";
import { useMemo, useState } from "react";
import { copy } from "@/content/it";
import { useData, useDataReady } from "@/hooks/use-data";
import { customerStats, type CustomerStats } from "@/lib/domain/analytics";
import { normalize } from "@/lib/domain/catalog";
import type { Customer } from "@/lib/domain/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { openDialog } from "@/store/ui-store";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Page, PageHeader, Toolbar } from "@/components/ui/page";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

const t = copy.customersPanel;
const PAGE_SIZE = 20;

export function CustomersView() {
  const ready = useDataReady();
  const { customers, orders } = useData((state) => ({
    customers: state.customers,
    orders: state.orders,
  }));
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    const q = normalize(query);
    return customers
      .filter((c) => !q || normalize(`${c.name} ${c.email}`).includes(q))
      .map((customer) => ({ customer, stats: customerStats(orders, customer.id) }))
      .sort((a, b) => b.stats.spent - a.stats.spent);
  }, [customers, orders, query]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <Page>
      <PageHeader title={t.title} description={t.description} />
      <Toolbar>
        <SearchInput
          label={t.search}
          placeholder={t.search}
          value={query}
          onValueChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
          className="sm:max-w-xs"
        />
      </Toolbar>
      <Card>
        {!ready ? (
          <div className="space-y-2 p-5" aria-busy="true">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState icon={Users} title={t.empty} />
        ) : (
          <>
            <ul className="divide-y divide-line md:hidden">
              {visible.map(({ customer, stats }) => (
                <li key={customer.id}>
                  <button
                    type="button"
                    onClick={() => openDialog({ type: "customer", id: customer.id })}
                    className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left hover:bg-surface-2"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-fg">
                        {customer.name}
                      </span>
                      <span className="block text-[13px] text-fg-muted">
                        {customer.address?.city} · {copy.common.orders(stats.orders)}
                      </span>
                    </span>
                    <span className="text-sm font-medium text-fg tabular-nums">
                      {formatCurrency(stats.spent, { round: true })}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="hidden md:block">
              <CustomersTable rows={visible} />
            </div>
          </>
        )}
        <Pagination
          page={current}
          pageSize={PAGE_SIZE}
          total={rows.length}
          onPageChange={setPage}
        />
      </Card>
    </Page>
  );
}

function CustomersTable({ rows }: { rows: { customer: Customer; stats: CustomerStats }[] }) {
  const c = t.columns;
  return (
    <Table>
      <THead>
        <TR>
          <TH>{c.name}</TH>
          <TH>{c.city}</TH>
          <TH align="right">{c.orders}</TH>
          <TH align="right">{c.spent}</TH>
          <TH>{c.last}</TH>
          <TH>{c.marketing}</TH>
        </TR>
      </THead>
      <TBody>
        {rows.map(({ customer, stats }) => (
          <TR key={customer.id}>
            <TD>
              <button
                type="button"
                onClick={() => openDialog({ type: "customer", id: customer.id })}
                className="text-left font-medium text-fg hover:underline"
              >
                {customer.name}
              </button>
              <span className="block text-[13px] text-fg-muted">{customer.email}</span>
            </TD>
            <TD className="text-fg-muted">{customer.address?.city}</TD>
            <TD align="right">{stats.orders}</TD>
            <TD align="right">{formatCurrency(stats.spent)}</TD>
            <TD className="text-fg-muted tabular-nums">
              {stats.lastOrderAt ? formatDate(stats.lastOrderAt, "short") : "—"}
            </TD>
            <TD>{customer.marketingConsent ? t.yes : t.no}</TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
