"use client";

import { Minus, Plus, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useNow } from "@/hooks/use-now";
import { useSiteData } from "@/hooks/use-site-data";
import { acceptsOrders, cartTotals } from "@/lib/domain/orders";
import type { OrderType } from "@/lib/domain/types";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedControl } from "@/components/ui/segmented-control";

const o = copy.order;

/** Riepilogo del carrello con modalità, quantità e totali. */
export function CartPanel({ onNavigate }: { onNavigate?: () => void }) {
  const now = useNow();
  const { dishes, settings } = useSiteData();
  const lines = useCartStore((state) => state.lines);
  const type = useCartStore((state) => state.type);
  const setType = useCartStore((state) => state.setType);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const totals = cartTotals(lines, dishes, type, settings);
  const open = now ? acceptsOrders(type, settings, now) : true;
  const canCheckout = totals.items > 0 && totals.missingForMinimum === 0 && open;

  const options: { value: OrderType; label: string }[] = [];
  if (settings.delivery.enabled)
    options.push({ value: "delivery", label: copy.orderType.delivery });
  if (settings.delivery.takeawayEnabled)
    options.push({ value: "takeaway", label: copy.orderType.takeaway });

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-fg">{o.cart}</h2>
        {options.length > 1 ? (
          <SegmentedControl<OrderType>
            ariaLabel={o.mode}
            value={type}
            onChange={setType}
            options={options}
            size="sm"
          />
        ) : null}
      </div>

      {lines.length === 0 ? (
        <EmptyState compact icon={ShoppingBag} title={o.emptyCart} description={o.emptyCartHint} />
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {lines.map((line) => {
            const dish = dishes.find((d) => d.id === line.dishId);
            if (!dish) return null;
            return (
              <li key={line.dishId} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">{dish.name}</p>
                  <p className="text-xs text-fg-muted tabular-nums">{formatCurrency(dish.price)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(line.dishId, line.quantity - 1)}
                    aria-label={copy.a11y.decrease(dish.name)}
                    className="flex size-8 items-center justify-center rounded-full border border-line text-fg hover:bg-surface-2"
                  >
                    <Minus aria-hidden className="size-3.5" />
                  </button>
                  <span
                    className="w-6 text-center text-sm font-medium tabular-nums"
                    aria-live="polite"
                  >
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(line.dishId, line.quantity + 1)}
                    aria-label={copy.a11y.increase(dish.name)}
                    className="flex size-8 items-center justify-center rounded-full border border-line text-fg hover:bg-surface-2"
                  >
                    <Plus aria-hidden className="size-3.5" />
                  </button>
                </div>
                <span className="w-16 text-right text-sm font-medium text-fg tabular-nums">
                  {formatCurrency(dish.price * line.quantity)}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {lines.length > 0 ? (
        <>
          <dl className="mt-2 space-y-1.5 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-fg-muted">{o.subtotal}</dt>
              <dd className="text-fg tabular-nums">{formatCurrency(totals.subtotal)}</dd>
            </div>
            {type === "delivery" ? (
              <div className="flex justify-between">
                <dt className="text-fg-muted">{o.deliveryFee}</dt>
                <dd className="text-fg tabular-nums">
                  {totals.deliveryFee ? formatCurrency(totals.deliveryFee) : o.free}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between text-base font-semibold">
              <dt className="text-fg">{o.total}</dt>
              <dd className="text-fg tabular-nums">{formatCurrency(totals.total)}</dd>
            </div>
          </dl>
          <div className="mt-3 space-y-1 text-[13px]" aria-live="polite">
            {totals.missingForMinimum > 0 ? (
              <p className="text-warning">{o.minimum(formatCurrency(totals.missingForMinimum))}</p>
            ) : totals.missingForFreeDelivery > 0 ? (
              <p className="text-fg-muted">
                {o.freeDeliveryIn(formatCurrency(totals.missingForFreeDelivery))}
              </p>
            ) : null}
            {!open ? <p className="text-warning">{o.closed}</p> : null}
          </div>
        </>
      ) : null}

      <Link
        href={routes.checkout}
        onClick={(event) => {
          if (!canCheckout) event.preventDefault();
          else onNavigate?.();
        }}
        aria-disabled={!canCheckout}
        className={buttonClasses({
          size: "lg",
          className: cn("mt-5 w-full", !canCheckout && "opacity-50"),
        })}
      >
        {o.checkout}
      </Link>
    </div>
  );
}
