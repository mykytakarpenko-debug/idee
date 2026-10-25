"use client";

import { useMemo } from "react";
import { cartCount, cartTotals, checkCoupon, priceCart, type CouponCheck } from "@/lib/domain/cart";
import { stockIssues } from "@/lib/domain/inventory";
import type { ShippingMethod } from "@/lib/domain/types";
import { useCartStore } from "@/store/cart-store";
import { useCatalog, useToday } from "./use-catalog";

/** Carrello con prezzi di oggi, codice sconto, totali e problemi di disponibilità. */
export function useCart(method: ShippingMethod = "standard") {
  const { products, settings, ready } = useCatalog();
  const today = useToday();
  const lines = useCartStore((state) => state.lines);
  const couponCode = useCartStore((state) => state.couponCode);
  const hydrated = useCartStore((state) => state.hydrated);

  return useMemo(() => {
    const priced = priceCart(lines, products, today);
    const subtotal = priced.reduce((acc, line) => acc + line.total, 0);
    const couponCheck: CouponCheck | null = couponCode
      ? checkCoupon(couponCode, settings.coupons, subtotal, today)
      : null;
    const coupon = couponCheck?.ok ? couponCheck.coupon : null;
    const totals = cartTotals({ subtotal, coupon, method, settings });
    return {
      hydrated,
      ready: ready && hydrated,
      lines: priced,
      count: cartCount(lines),
      couponCode,
      couponCheck,
      coupon,
      totals,
      issues: ready ? stockIssues(lines, products) : [],
      settings,
      today,
    };
  }, [lines, products, today, couponCode, settings, method, hydrated, ready]);
}
