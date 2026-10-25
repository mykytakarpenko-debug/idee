"use client";

import { copy } from "@/content/it";
import { useData } from "@/hooks/use-data";
import { customerStats } from "@/lib/domain/analytics";
import { formatCurrency, formatDate } from "@/lib/format";
import { openDialog } from "@/store/ui-store";
import { OrderStatusBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";

const t = copy.customersPanel;

export function CustomerDialog({ id, onDone }: { id: string; onDone: () => void }) {
  const { customer, orders } = useData((state) => ({
    customer: state.customers.find((c) => c.id === id),
    orders: state.orders,
  }));
  if (!customer) return <DialogContent title={t.title}>{null}</DialogContent>;
  const stats = customerStats(orders, customer.id);
  const own = orders
    .filter((o) => o.customerId === customer.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const address = customer.address;

  return (
    <DialogContent
      title={customer.name}
      description={t.since(formatDate(customer.createdAt, "short"))}
    >
      <DialogBody className="space-y-5 text-sm">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-[13px] text-fg-muted">{copy.checkout.email}</dt>
            <dd className="break-all text-fg">{customer.email}</dd>
          </div>
          <div>
            <dt className="text-[13px] text-fg-muted">{copy.checkout.phone}</dt>
            <dd className="text-fg">{customer.phone}</dd>
          </div>
          {address ? (
            <div className="sm:col-span-2">
              <dt className="text-[13px] text-fg-muted">{copy.checkout.address}</dt>
              <dd className="text-fg">
                {address.street}, {address.postalCode} {address.city} ({address.province})
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-[13px] text-fg-muted">{t.columns.spent}</dt>
            <dd className="font-medium text-fg">
              {formatCurrency(stats.spent)} · {copy.common.orders(stats.orders)}
            </dd>
          </div>
          <div>
            <dt className="text-[13px] text-fg-muted">{t.columns.marketing}</dt>
            <dd className="text-fg">{customer.marketingConsent ? t.yes : t.no}</dd>
          </div>
        </dl>
        <section aria-labelledby={`${id}-ordini`}>
          <h3 id={`${id}-ordini`} className="text-[13px] font-medium text-fg-muted">
            {t.ordersTitle}
          </h3>
          <ul className="mt-2 divide-y divide-line">
            {own.map((order) => (
              <li key={order.id}>
                <button
                  type="button"
                  onClick={() => openDialog({ type: "order", id: order.id })}
                  className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-left hover:underline"
                >
                  <span className="font-medium text-fg">{order.number}</span>
                  <span className="text-fg-muted">{formatDate(order.createdAt, "short")}</span>
                  <span className="ml-auto flex items-center gap-2">
                    <span className="tabular-nums">{formatCurrency(order.total)}</span>
                    <OrderStatusBadge status={order.status} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </DialogBody>
      <DialogFooter>
        <Button variant="secondary" onClick={onDone}>
          {copy.common.close}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
