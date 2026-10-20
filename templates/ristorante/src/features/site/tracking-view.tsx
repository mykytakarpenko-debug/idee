"use client";

import { Check, CircleX, Clock, PackageSearch } from "lucide-react";
import Link from "next/link";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useData, useDataReady } from "@/hooks/use-data";
import { orderSteps } from "@/lib/domain/orders";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/site/section";

const t = copy.tracking;

/** Stato dell'ordine per il cliente, aggiornato in tempo reale (anche da altre schede). */
export function TrackingView({ number }: { number: string }) {
  const ready = useDataReady();
  const order = useData((state) => state.orders.find((o) => o.number === number));

  if (!ready) return <Container className="min-h-[60vh] py-16" aria-busy="true" />;
  if (!order) {
    return (
      <Container className="py-16">
        <EmptyState
          icon={PackageSearch}
          title={t.notFound}
          description={t.notFoundHint}
          action={
            <Link href={routes.home} className={buttonClasses({ variant: "secondary" })}>
              {t.backHome}
            </Link>
          }
        />
      </Container>
    );
  }

  const steps = orderSteps(order.type);
  const currentIndex = steps.indexOf(order.status);
  const cancelled = order.status === "cancelled";

  return (
    <Container className="max-w-2xl animate-page-in py-12 sm:py-16">
      <p className="text-sm font-medium text-accent-text">{t.thanks}</p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-fg">{t.title(order.number)}</h1>
      <p className="mt-2 flex items-center gap-2 text-fg-muted">
        <Clock aria-hidden className="size-4" />
        {t.scheduledFor(copy.orderType[order.type], formatDate(order.scheduledFor, "time"))}
      </p>

      <section
        aria-labelledby="tracking-steps"
        className="mt-8 rounded-2xl border border-line bg-surface p-6 shadow-sm"
      >
        <h2 id="tracking-steps" className="text-base font-semibold text-fg">
          {t.steps}
        </h2>
        {cancelled ? (
          <p className="mt-4 flex items-center gap-2 text-danger">
            <CircleX aria-hidden className="size-5" />
            {t.cancelled}
          </p>
        ) : (
          <ol className="mt-5 flex flex-col gap-0" aria-live="polite">
            {steps.map((step, index) => {
              const done = index < currentIndex;
              const current = index === currentIndex;
              return (
                <li key={step} className="flex gap-4" aria-current={current ? "step" : undefined}>
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "flex size-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors duration-300",
                        done && "border-success bg-success text-white",
                        current && "border-accent bg-accent-soft text-accent-soft-fg",
                        !done && !current && "border-line text-fg-subtle",
                      )}
                    >
                      {done ? <Check aria-hidden className="size-4" /> : index + 1}
                    </span>
                    {index < steps.length - 1 ? (
                      <span
                        aria-hidden
                        className={cn("h-8 w-0.5", done ? "bg-success" : "bg-line")}
                      />
                    ) : null}
                  </div>
                  <p
                    className={cn(
                      "pt-1.5 text-sm",
                      current ? "font-semibold text-fg" : done ? "text-fg" : "text-fg-muted",
                    )}
                  >
                    {copy.status.order[step]}
                    {current ? <span className="sr-only"> ({t.current})</span> : null}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
        <p className="mt-4 text-xs text-fg-muted">{t.live}</p>
      </section>

      <section
        aria-labelledby="tracking-items"
        className="mt-6 rounded-2xl border border-line bg-surface p-6"
      >
        <h2 id="tracking-items" className="text-base font-semibold text-fg">
          {t.items}
        </h2>
        <ul className="mt-4 space-y-2 text-sm">
          {order.items.map((item) => (
            <li key={item.dishId} className="flex justify-between gap-3">
              <span className="text-fg">
                <span className="text-fg-muted tabular-nums">{item.quantity}×</span> {item.name}
              </span>
              <span className="text-fg tabular-nums">
                {formatCurrency(item.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 border-t border-line pt-4 text-sm">
          {order.deliveryFee ? (
            <div className="flex justify-between">
              <dt className="text-fg-muted">{copy.order.deliveryFee}</dt>
              <dd className="tabular-nums">{formatCurrency(order.deliveryFee)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between font-semibold">
            <dt>{copy.order.total}</dt>
            <dd className="tabular-nums">{formatCurrency(order.total)}</dd>
          </div>
          <div className="flex justify-between text-fg-muted">
            <dt>{copy.checkout.payment}</dt>
            <dd>{copy.payment[order.payment]}</dd>
          </div>
        </dl>
      </section>
    </Container>
  );
}
