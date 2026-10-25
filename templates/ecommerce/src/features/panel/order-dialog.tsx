"use client";

import { Ban, Check, Truck, X } from "lucide-react";
import { useState } from "react";
import { copy } from "@/content/it";
import { useData } from "@/hooks/use-data";
import { useZodForm } from "@/hooks/use-zod-form";
import { canCancel, nextStatus } from "@/lib/domain/orders";
import { trackingSchema } from "@/lib/domain/schemas";
import type { Order, ReturnStatus } from "@/lib/domain/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { useDataStore } from "@/store/data-store";
import { OrderLines, OrderTimeline, OrderTotals } from "@/components/shop/order-parts";
import { OrderStatusBadge, ReturnStatusBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

const t = copy.ordersPanel;

/** Scheda dell'ordine nel pannello: avanzamento, tracciamento, annullamento e reso. */
export function OrderDialog({ id, onDone }: { id: string; onDone: () => void }) {
  const { order, products, settings } = useData((state) => ({
    order: state.orders.find((o) => o.id === id),
    products: state.products,
    settings: state.settings,
  }));
  const advance = useDataStore((state) => state.advanceOrder);
  const cancel = useDataStore((state) => state.cancelOrder);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!order) return <DialogContent title={t.title}>{null}</DialogContent>;

  const next = nextStatus(order.status);
  const needsTracking = order.status === "processing" && order.shippingMethod !== "pickup";
  const address = order.shippingAddress;

  return (
    <DialogContent
      title={copy.order.title(order.number)}
      description={formatDate(order.createdAt, "dateTime")}
      className="sm:max-w-2xl"
    >
      {/* tabIndex: il contenuto lungo deve poter scorrere anche da tastiera */}
      <DialogBody className="space-y-6" tabIndex={0}>
        <div className="flex flex-wrap gap-2">
          <OrderStatusBadge status={order.status} />
          {order.returnRequest ? <ReturnStatusBadge status={order.returnRequest.status} /> : null}
        </div>

        <div className="grid gap-5 text-sm sm:grid-cols-3">
          <div>
            <h3 className="text-[13px] font-medium text-fg-muted">{t.customer}</h3>
            <p className="mt-1 text-fg">{address.name}</p>
            <p className="break-all text-fg">{order.email}</p>
            <p className="text-fg">{order.phone}</p>
          </div>
          <div>
            <h3 className="text-[13px] font-medium text-fg-muted">{t.address}</h3>
            {order.shippingMethod === "pickup" ? (
              <p className="mt-1 text-fg">{copy.shippingMethods.pickup}</p>
            ) : (
              <address className="mt-1 text-fg not-italic">
                {address.street}
                <br />
                {address.postalCode} {address.city} ({address.province})
              </address>
            )}
            {order.tracking ? (
              <p className="mt-1 font-mono text-[12px] text-fg-muted">
                {copy.order.trackingCode(order.tracking.carrier, order.tracking.code)}
              </p>
            ) : null}
          </div>
          <div>
            <h3 className="text-[13px] font-medium text-fg-muted">{t.payment}</h3>
            <p className="mt-1 text-fg">{copy.paymentMethods[order.payment]}</p>
            <p className="text-fg">{copy.shippingMethods[order.shippingMethod]}</p>
          </div>
        </div>

        <section aria-labelledby={`${id}-righe`}>
          <h3 id={`${id}-righe`} className="text-[13px] font-medium text-fg-muted">
            {copy.order.items}
          </h3>
          <OrderLines order={order} products={products} />
          <div className="mt-3 border-t border-line pt-3">
            <OrderTotals order={order} vatRate={settings.vatRate} />
          </div>
        </section>

        {needsTracking ? <TrackingForm order={order} /> : null}
        {order.returnRequest ? <ReturnSection order={order} /> : null}

        <section aria-labelledby={`${id}-storia`}>
          <h3 id={`${id}-storia`} className="text-[13px] font-medium text-fg-muted">
            {t.history}
          </h3>
          <div className="mt-2">
            <OrderTimeline order={order} />
          </div>
        </section>
      </DialogBody>

      <DialogFooter className="flex-wrap sm:justify-between">
        {canCancel(order.status) ? (
          <Button variant="danger-ghost" onClick={() => setConfirmCancel(true)}>
            <Ban aria-hidden />
            {t.actions.cancel}
          </Button>
        ) : (
          <span />
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onDone}>
            {copy.common.close}
          </Button>
          {next && !needsTracking ? (
            <Button
              onClick={() => {
                const reached = advance(order.id);
                if (reached) toast.success(t.advanced(copy.orderStatus[reached]));
              }}
            >
              <Check aria-hidden />
              {t.actions[next as keyof typeof t.actions] as string}
            </Button>
          ) : null}
        </div>
      </DialogFooter>

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title={t.actions.cancelTitle}
        description={t.actions.cancelText}
        confirmLabel={t.actions.cancel}
        onConfirm={() => {
          cancel(order.id);
          toast.success(t.cancelled);
        }}
      />
    </DialogContent>
  );
}

function TrackingForm({ order }: { order: Order }) {
  const ship = useDataStore((state) => state.shipOrder);
  const form = useZodForm(trackingSchema, { carrier: "BRT", code: "" });
  const { errors, text } = form;
  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((data) => {
        ship(order.id, data);
        toast.success(t.advanced(copy.orderStatus.shipped));
      })}
      className="rounded-xl border border-line p-4"
    >
      <h3 className="text-sm font-semibold text-fg">{t.tracking}</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-[160px_1fr]">
        <Field label={t.carrier} name="carrier" error={errors.carrier}>
          {(props) => <Input {...props} {...text("carrier")} />}
        </Field>
        <Field label={t.trackingCode} name="code" error={errors.code}>
          {(props) => <Input {...props} {...text("code")} className="font-mono" />}
        </Field>
      </div>
      <Button type="submit" className="mt-3">
        <Truck aria-hidden />
        {t.trackingSave}
      </Button>
    </form>
  );
}

function ReturnSection({ order }: { order: Order }) {
  const update = useDataStore((state) => state.updateReturn);
  const request = order.returnRequest!;
  const set = (status: ReturnStatus) => {
    update(order.id, status);
    toast.success(t.returnUpdated(copy.returnStatus[status]));
  };
  return (
    <section
      className="rounded-xl border border-line p-4 text-sm"
      aria-labelledby={`${order.id}-reso`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 id={`${order.id}-reso`} className="font-semibold text-fg">
          {t.returnTitle}
        </h3>
        <ReturnStatusBadge status={request.status} />
      </div>
      <ul className="mt-2 text-fg">
        {request.lines.map((item) => {
          const line = order.lines[item.index];
          return line ? (
            <li key={item.index}>
              {item.quantity} × {line.name} ({line.variantName})
            </li>
          ) : null;
        })}
      </ul>
      {request.reason ? (
        <p className="mt-2 text-fg-muted">
          {t.returnReason}: “{request.reason}”
        </p>
      ) : null}
      <p className="mt-1 text-fg">
        {t.returnRefund}: <span className="font-medium">{formatCurrency(request.refund)}</span>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {request.status === "requested" ? (
          <>
            <Button size="sm" onClick={() => set("approved")}>
              <Check aria-hidden />
              {t.approve}
            </Button>
            <Button size="sm" variant="danger-ghost" onClick={() => set("rejected")}>
              <X aria-hidden />
              {t.reject}
            </Button>
          </>
        ) : null}
        {request.status === "approved" ? (
          <Button size="sm" onClick={() => set("refunded")}>
            <Check aria-hidden />
            {t.refund}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
