import { copy } from "@/content/it";
import { includedVat } from "@/lib/domain/pricing";
import type { Order, Product } from "@/lib/domain/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { ProductArt } from "@/components/product/product-art";

/** Righe dell'ordine con miniatura (usate da conferma, area cliente e pannello). */
export function OrderLines({ order, products }: { order: Order; products: readonly Product[] }) {
  return (
    <ul className="divide-y divide-line">
      {order.lines.map((line, index) => {
        const product = products.find((p) => p.id === line.productId);
        const variant = product?.variants.find((v) => v.id === line.variantId);
        const returned = order.returnRequest?.lines.find((r) => r.index === index)?.quantity ?? 0;
        return (
          <li key={`${line.variantId}-${index}`} className="flex items-center gap-3 py-3">
            <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-surface-2">
              {product ? (
                <ProductArt kind={product.art} color={variant?.color ?? "#cccccc"} />
              ) : null}
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium text-fg">{line.name}</p>
              <p className="text-[13px] text-fg-muted">
                {line.variantName} · {copy.common.quantity} {line.quantity} ·{" "}
                {copy.cart.each(formatCurrency(line.unitPrice))}
                {returned > 0 ? ` · ${copy.returnStatus.requested}: ${returned}` : ""}
              </p>
            </div>
            <p className="text-sm text-fg tabular-nums">
              {formatCurrency(line.unitPrice * line.quantity)}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

export function OrderTotals({ order, vatRate }: { order: Order; vatRate: number }) {
  const c = copy.cart;
  const vat = includedVat(order.total, vatRate);
  return (
    <div>
      <dl className="space-y-1.5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-fg-muted">{c.subtotal}</dt>
          <dd className="tabular-nums">{formatCurrency(order.subtotal)}</dd>
        </div>
        {order.discount > 0 ? (
          <div className="flex justify-between gap-4">
            <dt className="text-fg-muted">
              {c.discount}
              {order.coupon ? ` (${order.coupon})` : ""}
            </dt>
            <dd className="text-success tabular-nums">−{formatCurrency(order.discount)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-4">
          <dt className="text-fg-muted">
            {c.shipping} · {copy.shippingMethods[order.shippingMethod]}
          </dt>
          <dd className="tabular-nums">
            {order.shipping === 0 ? copy.common.free : formatCurrency(order.shipping)}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-line pt-2 font-semibold">
          <dt>{c.total}</dt>
          <dd className="tabular-nums">{formatCurrency(order.total)}</dd>
        </div>
      </dl>
      <p className="mt-1.5 text-right text-xs text-fg-muted">
        {c.vatIncluded(formatCurrency(vat))}
      </p>
    </div>
  );
}

export function OrderTimeline({ order }: { order: Order }) {
  return (
    <ol className="space-y-3">
      {order.history.map((event, i) => {
        const label =
          event.status in copy.orderStatus
            ? copy.orderStatus[event.status as keyof typeof copy.orderStatus]
            : copy.returnStatus[event.status as keyof typeof copy.returnStatus];
        return (
          <li key={`${event.at}-${i}`} className="flex gap-3 text-sm">
            <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" />
            <span className="flex-1 text-fg">{label}</span>
            <span className="text-fg-muted tabular-nums">{formatDate(event.at, "dateTime")}</span>
          </li>
        );
      })}
    </ol>
  );
}
