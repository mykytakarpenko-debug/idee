import { z } from "zod";
import { copy } from "@/content/it";
import { parseEurosToCents } from "@/lib/format";

/**
 * Schemi di validazione dei moduli (negozio, area cliente e pannello).
 * Riutilizzali lato server: la validazione nel browser migliora l'esperienza,
 * non la sicurezza. Prezzi e totali vanno sempre ricalcolati sul server.
 */

const v = copy.validation;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s().-]{6,20}$/;

const text = (max: number) => z.string().trim().min(1, v.required).max(max, v.tooLong(max));
const optionalText = (max: number) => z.string().trim().max(max, v.tooLong(max));
const email = z.string().trim().min(1, v.required).regex(EMAIL_RE, v.email);
const phone = z.string().trim().min(1, v.required).regex(PHONE_RE, v.phone);
const postalCode = z
  .string()
  .trim()
  .regex(/^\d{5}$/, v.postalCode);
const province = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .refine((value) => /^[A-Z]{2}$/.test(value), v.province);

const amount = (options: { allowZero?: boolean } = {}) =>
  z
    .string()
    .trim()
    .transform((value, ctx) => {
      const cents = parseEurosToCents(value);
      if (Number.isNaN(cents) || cents < 0 || (!options.allowZero && cents === 0)) {
        ctx.addIssue({ code: "custom", message: v.amount });
        return z.NEVER;
      }
      return cents;
    });

const integer = (min: number, max: number) =>
  z
    .string()
    .trim()
    .transform((value, ctx) => {
      const n = Number.parseInt(value, 10);
      if (!/^\d+$/.test(value) || n < min || n > max) {
        ctx.addIssue({ code: "custom", message: v.number(min, max) });
        return z.NEVER;
      }
      return n;
    });

export const addressFields = {
  name: text(80),
  street: text(120),
  postalCode,
  city: text(60),
  province,
  phone,
};

export const checkoutSchema = z.object({
  email,
  ...addressFields,
  notes: optionalText(300),
  shippingMethod: z.enum(["standard", "express", "pickup"]),
  payment: z.enum(["card", "paypal", "bank_transfer"]),
  terms: z.boolean().refine((value) => value, v.terms),
  marketing: z.boolean(),
});
export type CheckoutValues = z.input<typeof checkoutSchema>;

export const loginSchema = z.object({
  email,
  password: z.string().min(1, v.required),
});
export type LoginValues = z.input<typeof loginSchema>;

export const profileSchema = z.object({
  email,
  ...addressFields,
  marketing: z.boolean(),
});
export type ProfileValues = z.input<typeof profileSchema>;

export const couponCodeSchema = z
  .string()
  .trim()
  .min(1, v.required)
  .transform((value) => value.toUpperCase().replace(/\s+/g, ""));

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, v.date);

export const productFormSchema = z
  .object({
    name: text(80),
    shortDescription: text(160),
    description: text(1200),
    categoryId: z.string().min(1, v.required),
    sellerId: z.string().min(1, v.required),
    price: amount(),
    salePrice: z.string().trim(),
    saleFrom: z.string(),
    saleTo: z.string(),
    featured: z.boolean(),
    active: z.boolean(),
  })
  .transform((data, ctx) => {
    if (data.salePrice === "") return { ...data, sale: null };
    const price = parseEurosToCents(data.salePrice);
    if (Number.isNaN(price) || price <= 0 || price >= data.price) {
      ctx.addIssue({ code: "custom", path: ["salePrice"], message: v.salePrice });
      return z.NEVER;
    }
    if (!isoDate.safeParse(data.saleFrom).success) {
      ctx.addIssue({ code: "custom", path: ["saleFrom"], message: v.date });
      return z.NEVER;
    }
    if (!isoDate.safeParse(data.saleTo).success || data.saleTo < data.saleFrom) {
      ctx.addIssue({ code: "custom", path: ["saleTo"], message: v.dateOrder });
      return z.NEVER;
    }
    return { ...data, sale: { price, from: data.saleFrom, to: data.saleTo } };
  });
export type ProductFormValues = z.input<typeof productFormSchema>;

export const variantSchema = z.object({
  name: text(40),
  stock: integer(0, 9999),
});

export const couponFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .transform((value) => value.toUpperCase())
      .refine((value) => /^[A-Z0-9]{4,20}$/.test(value), v.couponCode),
    type: z.enum(["percent", "fixed", "free_shipping"]),
    value: z.string().trim(),
    minSubtotal: amount({ allowZero: true }),
    expiresAt: z.string(),
  })
  .transform((data, ctx) => {
    let value = 0;
    if (data.type === "percent") {
      value = Number.parseInt(data.value, 10);
      if (!/^\d+$/.test(data.value) || value < 1 || value > 90) {
        ctx.addIssue({ code: "custom", path: ["value"], message: v.number(1, 90) });
        return z.NEVER;
      }
    } else if (data.type === "fixed") {
      value = parseEurosToCents(data.value);
      if (Number.isNaN(value) || value <= 0) {
        ctx.addIssue({ code: "custom", path: ["value"], message: v.amount });
        return z.NEVER;
      }
    }
    if (data.expiresAt !== "" && !isoDate.safeParse(data.expiresAt).success) {
      ctx.addIssue({ code: "custom", path: ["expiresAt"], message: v.date });
      return z.NEVER;
    }
    return {
      code: data.code,
      type: data.type,
      value,
      minSubtotal: data.minSubtotal,
      expiresAt: data.expiresAt || null,
      active: true,
    };
  });
export type CouponFormValues = z.input<typeof couponFormSchema>;

export const shopInfoSchema = z.object({
  name: text(60),
  tagline: text(140),
  company: text(80),
  vatNumber: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase().replace(/\s+/g, ""))
    .refine((value) => /^IT\d{11}$/.test(value), v.vatNumber),
  rea: text(20),
  address: text(140),
  email,
  pec: email,
  phone,
});
export type ShopInfoValues = z.input<typeof shopInfoSchema>;

export const shippingSchema = z.object({
  standard: amount({ allowZero: true }),
  express: amount({ allowZero: true }),
  freeThreshold: amount({ allowZero: true }),
  pickupEnabled: z.boolean(),
  pickupAddress: optionalText(140),
  returnDays: integer(14, 90),
});
export type ShippingValues = z.input<typeof shippingSchema>;

export const trackingSchema = z.object({
  carrier: text(40),
  code: text(40),
});
export type TrackingValues = z.input<typeof trackingSchema>;

export const commissionSchema = z.object({
  commission: integer(0, 50),
});
