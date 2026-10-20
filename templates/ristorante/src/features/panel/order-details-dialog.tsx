"use client";

import { useState } from "react";
import { copy } from "@/content/it";
import { useDataStore } from "@/store/data-store";
import { nextStatus } from "@/lib/domain/orders";
import { formatCurrency, formatDate } from "@/lib/format";
import { OrderStatusBadge } from "@/components/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";

const o = copy.orders;

export function OrderDetailsDialog({ id, onDone }: { id: string; onDone: () => void }) {
  const order = useDataStore((state) => state.orders.find((x) => x.id === id));
  const setOrderStatus = useDataStore((state) => state.setOrderStatus);
  const [confirmCancel, setConfirmCancel] = useState(false);
  if (!order) return <DialogContent title={o.details}>{null}</DialogContent>;
  const next = nextStatus(order);
  const active = order.status !== "completed" && order.status !== "cancelled";

  return (
    <DialogContent
      title={`${copy.tracking.title(order.number)}`}
      description={`${copy.orderType[order.type]} · ${o.due(formatDate(order.scheduledFor, "time"))}`}
    >
      <DialogBody className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2">
          <OrderStatusBadge status={order.status} />
          <Badge>{copy.orderType[order.type]}</Badge>
        </div>
        <ul className="divide-y divide-line rounded-lg border border-line text-sm">
          {order.items.map((item) => (
            <li key={item.dishId} className="flex justify-between gap-3 px-3.5 py-2.5">
              <span>
                <span className="font-semibold tabular-nums">{item.quantity}×</span> {item.name}
              </span>
              <span className="tabular-nums">{formatCurrency(item.price * item.quantity)}</span>
            </li>
          ))}
          <li className="flex justify-between gap-3 px-3.5 py-2.5 font-semibold">
            <span>{copy.order.total}</span>
            <span className="tabular-nums">{formatCurrency(order.total)}</span>
          </li>
        </ul>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-fg-muted">{o.customer}</dt>
            <dd className="mt-0.5 text-fg">
              {order.customer.name}
              <br />
              <a
                href={`tel:${order.customer.phone.replace(/\s/g, "")}`}
                className="text-accent-text hover:underline"
              >
                {order.customer.phone}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-fg-muted">{o.payment}</dt>
            <dd className="mt-0.5 text-fg">{copy.payment[order.payment]}</dd>
          </div>
          {order.address ? (
            <div className="sm:col-span-2">
              <dt className="text-xs text-fg-muted">{o.address}</dt>
              <dd className="mt-0.5 text-fg">
                {order.address.street}, {order.address.postalCode} {order.address.city}
                {order.address.notes ? (
                  <span className="block text-fg-muted">{order.address.notes}</span>
                ) : null}
              </dd>
            </div>
          ) : null}
          {order.notes ? (
            <div className="sm:col-span-2">
              <dt className="text-xs text-fg-muted">{copy.common.notes}</dt>
              <dd className="mt-0.5 text-fg">{order.notes}</dd>
            </div>
          ) : null}
        </dl>
      </DialogBody>
      <DialogFooter className="sm:justify-between">
        {active ? (
          <Button variant="danger-ghost" onClick={() => setConfirmCancel(true)}>
            {o.cancel}
          </Button>
        ) : (
          <span />
        )}
        {next ? (
          <Button
            onClick={() => {
              setOrderStatus(order.id, next);
              toast.success(o.advanced(copy.status.order[next]), {
                description: `#${order.number}`,
              });
              onDone();
            }}
          >
            {o.advance[next as keyof typeof o.advance]}
          </Button>
        ) : null}
      </DialogFooter>
      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title={o.cancelTitle}
        description={o.cancelText}
        confirmLabel={o.cancel}
        onConfirm={() => {
          setOrderStatus(order.id, "cancelled");
          toast.success(o.cancelled, { description: `#${order.number}` });
          onDone();
        }}
      />
    </DialogContent>
  );
}
