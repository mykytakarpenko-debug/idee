"use client";

import { Download, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import { copy } from "@/content/it";
import { useData, useDataReady } from "@/hooks/use-data";
import { csvAmount, downloadCsv } from "@/lib/csv";
import { normalize } from "@/lib/domain/catalog";
import { itemsCount } from "@/lib/domain/orders";
import type { Order, OrderStatus } from "@/lib/domain/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { openDialog } from "@/store/ui-store";
import { OrderStatusBadge, ReturnStatusBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Checkbox, Select } from "@/components/ui/input";
import { Page, PageHeader, Toolbar } from "@/components/ui/page";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

const t = copy.ordersPanel;
const PAGE_SIZE = 20;
const STATUSES = Object.keys(copy.orderStatus) as OrderStatus[];

export function OrdersView() {
  const ready = useDataReady();
  const orders = useData((state) => state.orders);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [returnsOnly, setReturnsOnly] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = normalize(query);
    return orders
      .filter((o) => !status || o.status === status)
      .filter(
        (o) =>
          !returnsOnly ||
          o.returnRequest?.status === "requested" ||
          o.returnRequest?.status === "approved",
      )
      .filter(
        (o) => !q || normalize(`${o.number} ${o.shippingAddress.name} ${o.email}`).includes(q),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [orders, query, status, returnsOnly]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const reset = (fn: () => void) => {
    fn();
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
            onClick={() =>
              downloadCsv("ordini.csv", filtered, [
                { header: "Numero", value: (o) => o.number },
                { header: "Data", value: (o) => formatDate(o.createdAt, "numeric") },
                { header: "Cliente", value: (o) => o.shippingAddress.name },
                { header: "Email", value: (o) => o.email },
                { header: "Articoli", value: (o) => String(itemsCount(o)) },
                { header: "Totale", value: (o) => csvAmount(o.total) },
                { header: "Stato", value: (o) => copy.orderStatus[o.status] },
              ])
            }
          >
            <Download aria-hidden />
            {t.exportCsv}
          </Button>
        }
      />

      <Toolbar>
        <SearchInput
          label={t.search}
          placeholder={t.search}
          value={query}
          onValueChange={(value) => reset(() => setQuery(value))}
          className="sm:max-w-xs"
        />
        <div className="flex flex-wrap items-center gap-3">
          <Select
            aria-label={t.filter}
            value={status}
            onChange={(e) => reset(() => setStatus(e.target.value as OrderStatus | ""))}
            className="w-auto"
          >
            <option value="">{t.allStatuses}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {copy.orderStatus[s]}
              </option>
            ))}
          </Select>
          <label className="flex items-center gap-2 text-sm text-fg">
            <Checkbox
              checked={returnsOnly}
              onChange={(e) => reset(() => setReturnsOnly(e.target.checked))}
            />
            {t.returnsFilter}
          </label>
        </div>
      </Toolbar>

      <Card>
        {!ready ? (
          <div className="space-y-2 p-5" aria-busy="true">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState icon={ShoppingBag} title={t.empty} />
        ) : (
          <>
            <ul className="divide-y divide-line md:hidden">
              {visible.map((order) => (
                <li key={order.id}>
                  <button
                    type="button"
                    onClick={() => openDialog({ type: "order", id: order.id })}
                    className="flex w-full flex-col gap-1.5 px-5 py-3 text-left hover:bg-surface-2"
                  >
                    <span className="flex w-full items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-fg">{order.number}</span>
                      <span className="text-sm font-medium text-fg tabular-nums">
                        {formatCurrency(order.total)}
                      </span>
                    </span>
                    <span className="text-[13px] text-fg-muted">
                      {formatDate(order.createdAt, "dateTime")} · {order.shippingAddress.name}
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      <OrderStatusBadge status={order.status} />
                      {order.returnRequest ? (
                        <ReturnStatusBadge status={order.returnRequest.status} />
                      ) : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="hidden md:block">
              <OrdersTable orders={visible} />
            </div>
          </>
        )}
        <Pagination
          page={current}
          pageSize={PAGE_SIZE}
          total={filtered.length}
          onPageChange={setPage}
        />
      </Card>
    </Page>
  );
}

function OrdersTable({ orders }: { orders: Order[] }) {
  const c = t.columns;
  return (
    <Table>
      <THead>
        <TR>
          <TH>{c.number}</TH>
          <TH>{c.date}</TH>
          <TH>{c.customer}</TH>
          <TH align="right">{c.items}</TH>
          <TH align="right">{c.total}</TH>
          <TH>{c.status}</TH>
        </TR>
      </THead>
      <TBody>
        {orders.map((order) => (
          <TR key={order.id}>
            <TD>
              <button
                type="button"
                onClick={() => openDialog({ type: "order", id: order.id })}
                className="font-medium text-fg hover:underline"
              >
                {order.number}
              </button>
            </TD>
            <TD className="text-fg-muted tabular-nums">
              {formatDate(order.createdAt, "dateTime")}
            </TD>
            <TD>
              <span className="block text-fg">{order.shippingAddress.name}</span>
              <span className="block text-[13px] text-fg-muted">
                {order.customerId ? order.email : `${t.guest} · ${order.email}`}
              </span>
            </TD>
            <TD align="right" className="tabular-nums">
              {itemsCount(order)}
            </TD>
            <TD align="right" className="font-medium tabular-nums">
              {formatCurrency(order.total)}
            </TD>
            <TD>
              <span className="flex flex-wrap gap-1.5">
                <OrderStatusBadge status={order.status} />
                {order.returnRequest ? (
                  <ReturnStatusBadge status={order.returnRequest.status} />
                ) : null}
              </span>
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
