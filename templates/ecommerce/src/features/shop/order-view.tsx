"use client";

import { CircleCheck, Landmark, PackageSearch } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useCustomer } from "@/hooks/use-customer";
import { useData, useDataReady } from "@/hooks/use-data";
import { formatCurrency, formatDate } from "@/lib/format";
import { OrderStatusBadge, ReturnStatusBadge } from "@/components/status-badges";
import { OrderLines, OrderTimeline, OrderTotals } from "@/components/shop/order-parts";
import { Container } from "@/components/site/section";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

const o = copy.order;

/**
 * Riepilogo e stato dell'ordine. In demo si apre con il numero; in produzione
 * il link nell'email contiene un token non indovinabile (docs/sicurezza-privacy.md).
 */
export function OrderView({ number }: { number: string }) {
  const params = useSearchParams();
  const justPlaced = params.get("conferma") === "1";
  const ready = useDataReady();
  const { customer } = useCustomer();
  const { order, products, settings } = useData((state) => ({
    order: state.orders.find((item) => item.number === number),
    products: state.products,
    settings: state.settings,
  }));

  if (!ready) return <Container className="min-h-[60vh] py-14" aria-busy="true" />;
  if (!order) {
    return (
      <Container className="py-16">
        <h1 className="sr-only">{o.title(number)}</h1>
        <EmptyState
          icon={PackageSearch}
          title={o.notFound}
          description={o.notFoundHint}
          action={
            <Link href={routes.shop} className={buttonClasses({})}>
              {o.continue}
            </Link>
          }
        />
      </Container>
    );
  }

  const address = order.shippingAddress;
  return (
    <Container className="animate-page-in max-w-4xl py-10 sm:py-14">
      {justPlaced ? (
        <div className="mb-8 flex gap-4 rounded-2xl border border-line bg-surface p-6">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-success-soft">
            <CircleCheck aria-hidden className="size-6 text-success" />
          </span>
          <div>
            <p className="font-display text-2xl font-medium text-fg">{o.thanks}</p>
            <p className="mt-1 text-sm text-fg-muted">{o.thanksText(order.email)}</p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl font-medium tracking-tight text-fg">
          {o.title(order.number)}
        </h1>
        <OrderStatusBadge status={order.status} />
        {order.returnRequest ? <ReturnStatusBadge status={order.returnRequest.status} /> : null}
      </div>
      <p className="mt-2 text-sm text-fg-muted">
        {o.placedAt}: {formatDate(order.createdAt, "dateTime")}
      </p>

      {order.status === "awaiting_payment" ? (
        <section
          aria-labelledby="bonifico"
          className="mt-6 flex gap-3 rounded-xl border border-warning/30 bg-warning-soft p-5"
        >
          <Landmark aria-hidden className="mt-0.5 size-5 shrink-0 text-warning" />
          <div className="text-sm text-fg">
            <h2 id="bonifico" className="font-semibold">
              {o.bankTitle}
            </h2>
            <p className="mt-1">{o.bankText(formatCurrency(order.total), order.number)}</p>
            <p className="mt-2 font-mono text-[13px]">{o.bankDetails}</p>
          </div>
        </section>
      ) : null}

      <div className="mt-8 grid gap-8 md:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="articoli" className="rounded-2xl border border-line bg-surface p-6">
          <h2 id="articoli" className="text-sm font-semibold text-fg">
            {o.items}
          </h2>
          <OrderLines order={order} products={products} />
          <div className="mt-4 border-t border-line pt-4">
            <OrderTotals order={order} vatRate={settings.vatRate} />
          </div>
        </section>

        <div className="space-y-6">
          <section aria-labelledby="consegna" className="rounded-2xl border border-line bg-surface p-6 text-sm">
            <h2 id="consegna" className="font-semibold text-fg">
              {order.shippingMethod === "pickup" ? o.pickupAt : o.shippingTo}
            </h2>
            {order.shippingMethod === "pickup" ? (
              <p className="mt-2 text-fg">{settings.shipping.pickupAddress}</p>
            ) : (
              <address className="mt-2 text-fg not-italic">
                {address.name}
                <br />
                {address.street}
                <br />
                {address.postalCode} {address.city} ({address.province})
              </address>
            )}
            <h2 className="mt-5 font-semibold text-fg">{o.payment}</h2>
            <p className="mt-1 text-fg">{copy.paymentMethods[order.payment]}</p>
            {order.tracking ? (
              <>
                <h2 className="mt-5 font-semibold text-fg">{o.tracking}</h2>
                <p className="mt-1 font-mono text-[13px] text-fg">
                  {o.trackingCode(order.tracking.carrier, order.tracking.code)}
                </p>
              </>
            ) : null}
          </section>
          <section aria-labelledby="avanzamento" className="rounded-2xl border border-line bg-surface p-6">
            <h2 id="avanzamento" className="text-sm font-semibold text-fg">
              {o.timeline}
            </h2>
            <div className="mt-3">
              <OrderTimeline order={order} />
            </div>
          </section>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={routes.shop} className={buttonClasses({ variant: "secondary" })}>
          {o.continue}
        </Link>
        {customer && order.customerId === customer.id ? (
          <Link href={routes.account} className={buttonClasses({ variant: "ghost" })}>
            {o.account}
          </Link>
        ) : null}
      </div>
    </Container>
  );
}
