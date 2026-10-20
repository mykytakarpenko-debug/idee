"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useCart } from "@/hooks/use-cart";
import {
  CartLines,
  CartTotalsList,
  CouponForm,
  FreeShippingNote,
} from "@/components/shop/cart-parts";
import { Container, SectionHeading } from "@/components/site/section";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

const c = copy.cart;

export function CartView() {
  const cart = useCart();
  if (!cart.hydrated) return <Container className="min-h-[60vh] py-14" aria-busy="true" />;

  return (
    <Container className="animate-page-in py-10 sm:py-14">
      <SectionHeading as="h1" title={c.title} />
      {cart.lines.length === 0 ? (
        <EmptyState
          className="mt-10"
          icon={ShoppingBag}
          title={c.empty}
          description={c.emptyHint}
          action={
            <Link href={routes.shop} className={buttonClasses({})}>
              {copy.site.cta}
            </Link>
          }
        />
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
          <section aria-label={copy.common.items(cart.count)}>
            <CartLines lines={cart.lines} issues={cart.issues} />
            <Link
              href={routes.shop}
              className={buttonClasses({ variant: "ghost", className: "mt-4 -ml-3" })}
            >
              {c.continue}
            </Link>
          </section>
          <aside
            aria-label={copy.checkout.summary}
            className="h-fit space-y-5 rounded-2xl border border-line bg-surface p-6 lg:sticky lg:top-24"
          >
            <FreeShippingNote
              remaining={cart.totals.freeShippingRemaining}
              threshold={cart.settings.shipping.freeThreshold}
            />
            <CouponForm
              subtotal={cart.totals.subtotal}
              coupons={cart.settings.coupons}
              today={cart.today}
              applied={cart.coupon}
            />
            <CartTotalsList totals={cart.totals} coupon={cart.coupon} />
            <Link
              href={routes.checkout}
              className={buttonClasses({ size: "lg", className: "w-full" })}
              aria-disabled={cart.issues.length > 0 || undefined}
            >
              {c.checkout}
            </Link>
            {cart.issues.length > 0 ? (
              <p className="text-[13px] text-warning" role="status">
                {copy.checkout.stockChanged}
              </p>
            ) : null}
          </aside>
        </div>
      )}
    </Container>
  );
}
