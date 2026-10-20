"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createDemoData, DEMO_SETTINGS } from "@/lib/demo/seed";
import {
  cartTotals,
  checkCoupon,
  priceCart,
  type CartLine,
} from "@/lib/domain/cart";
import { toISODate } from "@/lib/domain/dates";
import { adjustStock, stockIssues, type StockIssue } from "@/lib/domain/inventory";
import { canCancel, nextStatus, orderNumber, refundAmount } from "@/lib/domain/orders";
import { effectivePrice, priceOn } from "@/lib/domain/pricing";
import type {
  Address,
  Coupon,
  Customer,
  DataSnapshot,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  ReturnStatus,
  ShippingMethod,
  ShopSettings,
} from "@/lib/domain/types";
import { createId } from "@/lib/utils";
import { createDebouncedStorage } from "./persist-storage";

/**
 * Store dei dati del negozio, condiviso da negozio, area cliente e pannello.
 * In demo vive nel browser; in produzione sostituisci il corpo delle azioni con
 * chiamate alle API mantenendo le stesse firme (docs/architettura.md).
 * Prezzi, sconti, scorte e totali sono sempre ricalcolati qui, mai presi dal client.
 */

export const DATA_STORAGE_KEY = "bottega:data";
const DATA_VERSION = 1;

export interface PlaceOrderInput {
  lines: CartLine[];
  couponCode: string | null;
  customerId: string | null;
  email: string;
  address: Address;
  notes?: string;
  shippingMethod: ShippingMethod;
  payment: PaymentMethod;
  marketingConsent: boolean;
}

export type PlaceOrderResult =
  | { ok: true; order: Order }
  | { ok: false; reason: "empty" }
  | { ok: false; reason: "stock"; issues: StockIssue[] };

export type ProductInput = Omit<Product, "id" | "slug" | "priceHistory" | "createdAt">;

interface PersistedData extends DataSnapshot {
  initializedAt: string | null;
}

interface DataActions {
  init: () => Promise<void>;
  resetDemo: () => void;

  placeOrder: (input: PlaceOrderInput) => PlaceOrderResult;
  advanceOrder: (id: string) => OrderStatus | null;
  shipOrder: (id: string, tracking: { carrier: string; code: string }) => void;
  cancelOrder: (id: string) => void;
  requestReturn: (id: string, lines: { index: number; quantity: number }[], reason: string) => void;
  updateReturn: (id: string, status: ReturnStatus) => void;

  createProduct: (input: ProductInput) => Product;
  updateProduct: (id: string, input: Partial<ProductInput>) => void;

  updateCustomer: (id: string, input: Partial<Omit<Customer, "id">>) => void;
  updateSellerCommission: (id: string, rate: number) => void;

  updateSettings: (input: Partial<ShopSettings>) => void;
  addCoupon: (coupon: Coupon) => boolean;
  toggleCoupon: (code: string, active: boolean) => void;
}

export interface DataState extends PersistedData, DataActions {
  ready: boolean;
}

const emptyData: PersistedData = {
  initializedAt: null,
  categories: [],
  sellers: [],
  products: [],
  reviews: [],
  customers: [],
  orders: [],
  settings: DEMO_SETTINGS,
};

const nowIso = () => new Date().toISOString();
const today = () => toISODate(new Date());
let initPromise: Promise<void> | null = null;

function replaceById<T extends { id: string }>(
  items: T[],
  id: string,
  patch: Partial<NoInfer<T>> | ((item: T) => Partial<NoInfer<T>>),
): T[] {
  return items.map((item) =>
    item.id === id ? { ...item, ...(typeof patch === "function" ? patch(item) : patch) } : item,
  );
}

/** Registra nello storico il prezzo applicato oggi, se è cambiato (regola Omnibus). */
function withPriceHistory(product: Product): Product {
  const day = today();
  const price = effectivePrice(product, day);
  if (priceOn(product.priceHistory, day) === price) return product;
  const history = product.priceHistory.filter((p) => p.from !== day);
  return { ...product, priceHistory: [...history, { from: day, price }] };
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      ...emptyData,
      ready: false,

      init() {
        initPromise ??= (async () => {
          await useDataStore.persist.rehydrate();
          if (!get().initializedAt) set({ ...createDemoData(new Date()), initializedAt: nowIso() });
          set({ ready: true });
          // Sincronizza le schede aperte (es. negozio e pannello).
          window.addEventListener("storage", (event) => {
            if (event.key === DATA_STORAGE_KEY) void useDataStore.persist.rehydrate();
          });
        })();
        return initPromise;
      },

      resetDemo() {
        set({ ...createDemoData(new Date()), initializedAt: nowIso() });
      },

      placeOrder(input) {
        const state = get();
        const day = today();
        const priced = priceCart(input.lines, state.products, day);
        if (priced.length === 0) return { ok: false, reason: "empty" };
        const issues = stockIssues(input.lines, state.products);
        if (issues.length > 0) return { ok: false, reason: "stock", issues };

        const subtotal = priced.reduce((acc, line) => acc + line.total, 0);
        const check = input.couponCode
          ? checkCoupon(input.couponCode, state.settings.coupons, subtotal, day)
          : null;
        const coupon = check?.ok ? check.coupon : null;
        const method =
          input.shippingMethod === "pickup" && !state.settings.shipping.pickupEnabled
            ? "standard"
            : input.shippingMethod;
        const totals = cartTotals({ subtotal, coupon, method, settings: state.settings });
        const at = nowIso();
        const sequence =
          state.orders.reduce((max, o) => Math.max(max, Number(o.number.slice(3)) - 10_000), 0) + 1;
        const status: OrderStatus = input.payment === "bank_transfer" ? "awaiting_payment" : "paid";

        const order: Order = {
          id: createId("o"),
          number: orderNumber(sequence),
          customerId: input.customerId,
          email: input.email,
          phone: input.address.phone,
          shippingAddress: input.address,
          lines: priced.map((line) => ({
            productId: line.product.id,
            variantId: line.variant.id,
            sellerId: line.product.sellerId,
            name: line.product.name,
            variantName: line.variant.name,
            unitPrice: line.unitPrice,
            quantity: line.quantity,
          })),
          subtotal: totals.subtotal,
          discount: totals.discount,
          shipping: totals.shipping,
          total: totals.total,
          coupon: coupon?.code ?? null,
          shippingMethod: method,
          payment: input.payment,
          status,
          tracking: null,
          createdAt: at,
          deliveredAt: null,
          history: [{ at, status, note: input.notes || undefined }],
          returnRequest: null,
          marketingConsent: input.marketingConsent,
        };

        set({
          orders: [...state.orders, order],
          products: adjustStock(state.products, order.lines, -1),
          customers: input.customerId
            ? replaceById(state.customers, input.customerId, (customer) => ({
                address: input.address,
                marketingConsent: customer.marketingConsent || input.marketingConsent,
              }))
            : state.customers,
        });
        return { ok: true, order };
      },

      advanceOrder(id) {
        const order = get().orders.find((o) => o.id === id);
        const next = order ? nextStatus(order.status) : null;
        if (!order || !next) return null;
        const at = nowIso();
        set((state) => ({
          orders: replaceById(state.orders, id, (o) => ({
            status: next,
            deliveredAt: next === "delivered" ? at : o.deliveredAt,
            history: [...o.history, { at, status: next }],
          })),
        }));
        return next;
      },

      shipOrder(id, tracking) {
        const at = nowIso();
        set((state) => ({
          orders: replaceById(state.orders, id, (o) =>
            o.status === "processing" || o.status === "paid"
              ? { status: "shipped", tracking, history: [...o.history, { at, status: "shipped" }] }
              : { tracking },
          ),
        }));
      },

      cancelOrder(id) {
        const order = get().orders.find((o) => o.id === id);
        if (!order || !canCancel(order.status)) return;
        const at = nowIso();
        set((state) => ({
          orders: replaceById(state.orders, id, (o) => ({
            status: "cancelled",
            history: [...o.history, { at, status: "cancelled" }],
          })),
          products: adjustStock(state.products, order.lines, 1),
        }));
      },

      requestReturn(id, lines, reason) {
        const state = get();
        const order = state.orders.find((o) => o.id === id);
        if (!order || order.returnRequest || order.status !== "delivered") return;
        const items = lines.filter((l) => l.quantity > 0);
        if (items.length === 0) return;
        const at = nowIso();
        set({
          orders: replaceById(state.orders, id, (o) => ({
            returnRequest: {
              at,
              lines: items,
              reason: reason.trim(),
              status: "requested",
              refund: refundAmount(o, items, state.settings.shipping.standard),
            },
            history: [...o.history, { at, status: "requested" }],
          })),
        });
      },

      updateReturn(id, status) {
        const state = get();
        const order = state.orders.find((o) => o.id === id);
        if (!order?.returnRequest) return;
        const at = nowIso();
        // Gli articoli rientrano a magazzino quando il reso viene rimborsato.
        const restock =
          status === "refunded"
            ? order.returnRequest.lines.map((r) => ({ ...order.lines[r.index]!, quantity: r.quantity }))
            : [];
        set({
          orders: replaceById(state.orders, id, (o) => ({
            returnRequest: o.returnRequest ? { ...o.returnRequest, status } : null,
            history: [...o.history, { at, status }],
          })),
          products: restock.length ? adjustStock(state.products, restock, 1) : state.products,
        });
      },

      createProduct(input) {
        const day = today();
        const base = input.name
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        const taken = new Set(get().products.map((p) => p.slug));
        let slug = base || "prodotto";
        for (let i = 2; taken.has(slug); i += 1) slug = `${base}-${i}`;
        const product = withPriceHistory({
          ...input,
          id: createId("p"),
          slug,
          priceHistory: [],
          createdAt: day,
        });
        set((state) => ({ products: [...state.products, product] }));
        return product;
      },

      updateProduct(id, input) {
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? withPriceHistory({ ...p, ...input }) : p)),
        }));
      },

      updateCustomer(id, input) {
        set((state) => ({ customers: replaceById(state.customers, id, input) }));
      },

      updateSellerCommission(id, rate) {
        set((state) => ({ sellers: replaceById(state.sellers, id, { commissionRate: rate }) }));
      },

      updateSettings(input) {
        set((state) => ({ settings: { ...state.settings, ...input } }));
      },

      addCoupon(coupon) {
        if (get().settings.coupons.some((c) => c.code === coupon.code)) return false;
        set((state) => ({
          settings: { ...state.settings, coupons: [...state.settings.coupons, coupon] },
        }));
        return true;
      },

      toggleCoupon(code, active) {
        set((state) => ({
          settings: {
            ...state.settings,
            coupons: state.settings.coupons.map((c) => (c.code === code ? { ...c, active } : c)),
          },
        }));
      },
    }),
    {
      name: DATA_STORAGE_KEY,
      version: DATA_VERSION,
      storage: createDebouncedStorage<PersistedData>(150),
      skipHydration: true,
      partialize: (state): PersistedData => ({
        initializedAt: state.initializedAt,
        categories: state.categories,
        sellers: state.sellers,
        products: state.products,
        reviews: state.reviews,
        customers: state.customers,
        orders: state.orders,
        settings: state.settings,
      }),
      migrate: (persisted) => persisted as PersistedData,
    },
  ),
);
