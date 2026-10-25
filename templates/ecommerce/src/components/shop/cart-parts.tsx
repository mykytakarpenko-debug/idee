"use client";

import { TicketPercent, Trash2, TriangleAlert, X } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { checkCoupon, type CartTotals, type PricedLine } from "@/lib/domain/cart";
import type { StockIssue } from "@/lib/domain/inventory";
import type { Coupon, ShopSettings } from "@/lib/domain/types";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { ProductArt } from "@/components/product/product-art";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { QuantityInput } from "./quantity-input";

const c = copy.cart;

/** Righe del carrello con quantità modificabile e rimozione. */
export function CartLines({
  lines,
  issues,
  onNavigate,
  compact = false,
}: {
  lines: PricedLine[];
  issues: StockIssue[];
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const setQuantity = useCartStore((state) => state.setQuantity);
  const remove = useCartStore((state) => state.remove);
  return (
    <ul className="divide-y divide-line">
      {lines.map((line) => {
        const issue = issues.find(
          (i) => i.productId === line.productId && i.variantId === line.variantId,
        );
        const label = `${line.product.name}, ${line.variant.name}`;
        return (
          <li key={`${line.productId}-${line.variantId}`} className="flex gap-4 py-4">
            <div
              className={cn(
                "shrink-0 overflow-hidden rounded-lg bg-surface-2",
                compact ? "size-16" : "size-20 sm:size-24",
              )}
            >
              <ProductArt kind={line.product.art} color={line.variant.color} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={routes.product(line.product.slug)}
                    onClick={onNavigate}
                    className="text-sm font-medium text-fg hover:underline"
                  >
                    {line.product.name}
                  </Link>
                  <p className="text-[13px] text-fg-muted">
                    {line.variant.name} · {c.each(formatCurrency(line.unitPrice))}
                  </p>
                </div>
                <p className="text-sm font-semibold text-fg tabular-nums">
                  {formatCurrency(line.total)}
                </p>
              </div>
              {issue ? (
                <p className="flex items-center gap-1.5 text-[13px] font-medium text-warning">
                  <TriangleAlert aria-hidden className="size-3.5 shrink-0" />
                  {issue.available === 0 ? c.unavailableLine : copy.product.low(issue.available)}
                </p>
              ) : null}
              <div className="flex items-center justify-between gap-3">
                <QuantityInput
                  size="sm"
                  value={line.quantity}
                  max={Math.max(line.quantity, line.variant.stock)}
                  label={`${copy.common.quantity}: ${label}`}
                  onChange={(n) => setQuantity(line.productId, line.variantId, n)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(line.productId, line.variantId)}
                  aria-label={c.removeItem(label)}
                >
                  <Trash2 aria-hidden />
                  <span className="max-sm:sr-only">{c.remove}</span>
                </Button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Totali del carrello (spedizione standard nel carrello, quella scelta al checkout). */
export function CartTotalsList({
  totals,
  coupon,
  className,
}: {
  totals: CartTotals;
  coupon: Coupon | null;
  className?: string;
}) {
  const shippingValue = totals.shipping === 0 ? copy.common.free : formatCurrency(totals.shipping);
  return (
    <div className={className}>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-fg-muted">{c.subtotal}</dt>
          <dd className="text-fg tabular-nums">{formatCurrency(totals.subtotal)}</dd>
        </div>
        {totals.discount > 0 && coupon ? (
          <div className="flex justify-between gap-4">
            <dt className="text-fg-muted">
              {c.discount} ({coupon.code})
            </dt>
            <dd className="text-success tabular-nums">−{formatCurrency(totals.discount)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-4">
          <dt className="text-fg-muted">{c.shipping}</dt>
          <dd className="text-fg tabular-nums">{shippingValue}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-line pt-3 text-base font-semibold">
          <dt className="text-fg">{c.total}</dt>
          <dd className="text-fg tabular-nums">{formatCurrency(totals.total)}</dd>
        </div>
      </dl>
      <p className="mt-2 text-right text-xs text-fg-muted">
        {c.vatIncluded(formatCurrency(totals.vat))}
      </p>
    </div>
  );
}

/** Avanzamento verso la spedizione gratuita (testo + barra decorativa). */
export function FreeShippingNote({
  remaining,
  threshold,
}: {
  remaining: number;
  threshold: number;
}) {
  const progress = threshold > 0 ? Math.min(1, 1 - remaining / threshold) : 1;
  return (
    <div className="rounded-lg bg-surface-2 p-3">
      <p className="text-[13px] text-fg" aria-live="polite">
        {remaining > 0 ? c.freeShippingRemaining(formatCurrency(remaining)) : c.freeShippingReached}
      </p>
      <div aria-hidden className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}

/** Codice sconto: applicazione con messaggio d'errore accessibile, rimozione. */
export function CouponForm({
  subtotal,
  coupons,
  today,
  applied,
}: {
  subtotal: number;
  coupons: ShopSettings["coupons"];
  today: string;
  applied: Coupon | null;
}) {
  const id = useId();
  const setCoupon = useCartStore((state) => state.setCoupon);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (applied) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-2">
        <p className="flex items-center gap-2 text-sm text-fg">
          <TicketPercent aria-hidden className="size-4 text-success" />
          {c.couponApplied(applied.code)}
        </p>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setCoupon(null)}
          aria-label={c.couponRemove}
        >
          <X aria-hidden />
        </Button>
      </div>
    );
  }

  // Non è un <form>: il campo sta anche dentro il modulo del checkout.
  const apply = () => {
    if (!code.trim()) return;
    const result = checkCoupon(code, coupons, subtotal, today);
    if (!result.ok) {
      setError(
        result.reason === "min_subtotal"
          ? c.couponErrors.min_subtotal(formatCurrency(result.minSubtotal ?? 0))
          : c.couponErrors[result.reason],
      );
      return;
    }
    setCoupon(result.coupon.code);
    setCode("");
    setError(null);
    toast.success(c.couponApplied(result.coupon.code));
  };

  return (
    <div>
      <label htmlFor={id} className="text-[13px] font-medium text-fg">
        {c.couponLabel}
      </label>
      <div className="mt-1.5 flex gap-2">
        <Input
          id={id}
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
            setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              apply();
            }
          }}
          autoComplete="off"
          autoCapitalize="characters"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="uppercase"
        />
        <Button type="button" variant="secondary" onClick={apply}>
          {c.couponApply}
        </Button>
      </div>
      <p id={`${id}-error`} className="mt-1.5 min-h-5 text-[13px] text-danger" aria-live="polite">
        {error}
      </p>
    </div>
  );
}
