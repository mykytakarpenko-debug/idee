"use client";

import { ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useCart } from "@/hooks/use-cart";
import { useUiStore } from "@/store/ui-store";
import { buttonClasses } from "@/components/ui/button";
import { Dialog, DialogClose, SheetContent } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { CartLines, CartTotalsList, FreeShippingNote } from "./cart-parts";

const c = copy.cart;

/** Carrello laterale, aperto dall'intestazione e dopo "Aggiungi al carrello". */
export function CartDrawer() {
  const open = useUiStore((state) => state.cartOpen);
  const setOpen = useUiStore((state) => state.setCartOpen);
  const cart = useCart();
  const close = () => setOpen(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <SheetContent title={c.title} side="right" className="w-[min(28rem,100%)]">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
          <h2 className="font-display text-xl font-medium text-fg">
            {c.title}
            {cart.count > 0 ? (
              <span className="ml-2 text-sm font-normal text-fg-muted">
                ({copy.common.items(cart.count)})
              </span>
            ) : null}
          </h2>
          <DialogClose
            className={buttonClasses({ variant: "ghost", size: "icon" })}
            aria-label={copy.common.close}
          >
            <X aria-hidden />
          </DialogClose>
        </div>

        {cart.lines.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <EmptyState
              icon={ShoppingBag}
              title={c.empty}
              description={c.emptyHint}
              action={
                <Link href={routes.shop} onClick={close} className={buttonClasses({})}>
                  {copy.site.cta}
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5">
              <CartLines lines={cart.lines} issues={cart.issues} onNavigate={close} compact />
            </div>
            <div className="space-y-4 border-t border-line bg-surface px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <FreeShippingNote
                remaining={cart.totals.freeShippingRemaining}
                threshold={cart.settings.shipping.freeThreshold}
              />
              <CartTotalsList totals={cart.totals} coupon={cart.coupon} />
              <div className="grid gap-2">
                <Link
                  href={routes.checkout}
                  onClick={close}
                  className={buttonClasses({ size: "lg", className: "w-full" })}
                >
                  {c.checkout}
                </Link>
                <Link
                  href={routes.cart}
                  onClick={close}
                  className={buttonClasses({ variant: "secondary", size: "lg", className: "w-full" })}
                >
                  {c.openPage}
                </Link>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Dialog>
  );
}
