/**
 * Modello dati di Bottega (negozio online e marketplace).
 * Importi in centesimi di euro (interi), IVA inclusa; date ISO.
 */

export type ID = string;
export type Cents = number;
/** Data di calendario locale "YYYY-MM-DD". */
export type ISODate = string;
/** Istante ISO 8601. */
export type ISODateTime = string;

export interface Category {
  id: ID;
  slug: string;
  name: string;
  description: string;
}

/** Dati identificativi del venditore (trasparenza per i marketplace, DSA art. 30). */
export interface SellerLegal {
  company: string;
  vatNumber: string;
  address: string;
  email: string;
}

export interface Seller {
  id: ID;
  slug: string;
  name: string;
  /** Mestiere mostrato nella scheda, es. "Laboratorio di ceramica". */
  craft: string;
  city: string;
  since: number;
  bio: string;
  legal: SellerLegal;
  /** Commissione trattenuta dal marketplace (0–1). */
  commissionRate: number;
  active: boolean;
}

/** Tipo di illustrazione SVG usata come immagine del prodotto. */
export type ArtKind =
  | "mug"
  | "cups"
  | "plate"
  | "bowl"
  | "vase"
  | "teapot"
  | "towel"
  | "napkins"
  | "apron"
  | "basket"
  | "board"
  | "spoons"
  | "tray"
  | "notebook"
  | "cards"
  | "candle"
  | "tapers";

export interface Variant {
  id: ID;
  name: string;
  /** Colore principale dell'illustrazione. */
  color: string;
  sku: string;
  stock: number;
}

/** Prezzo applicato a partire da una data (storico per la regola Omnibus). */
export interface PricePoint {
  from: ISODate;
  price: Cents;
}

export interface Sale {
  price: Cents;
  from: ISODate;
  to: ISODate;
}

export interface Product {
  id: ID;
  slug: string;
  name: string;
  sellerId: ID;
  categoryId: ID;
  art: ArtKind;
  shortDescription: string;
  description: string;
  /** Materiali, misure, cura: elenco puntato nella scheda. */
  details: string[];
  /** Prezzo di listino. */
  price: Cents;
  sale: Sale | null;
  /** Prezzi effettivamente applicati, in ordine di data (promozioni comprese). */
  priceHistory: PricePoint[];
  variants: Variant[];
  /** Peso in grammi per la spedizione. */
  weight: number;
  featured: boolean;
  active: boolean;
  createdAt: ISODate;
}

export interface Review {
  id: ID;
  productId: ID;
  author: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string;
  body: string;
  date: ISODate;
  /** Scritta da un cliente che ha acquistato il prodotto (ordine collegato). */
  verified: boolean;
}

export interface Address {
  name: string;
  street: string;
  postalCode: string;
  city: string;
  province: string;
  country: "IT";
  phone: string;
}

export interface Customer {
  id: ID;
  name: string;
  email: string;
  phone: string;
  address: Address | null;
  marketingConsent: boolean;
  createdAt: ISODateTime;
}

export type ShippingMethod = "standard" | "express" | "pickup";
export type PaymentMethod = "card" | "paypal" | "bank_transfer";

export type OrderStatus =
  | "awaiting_payment"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderLine {
  productId: ID;
  variantId: ID;
  sellerId: ID;
  name: string;
  variantName: string;
  unitPrice: Cents;
  quantity: number;
}

export type ReturnStatus = "requested" | "approved" | "refunded" | "rejected";

export interface ReturnRequest {
  at: ISODateTime;
  /** Quantità restituite per indice di riga. */
  lines: { index: number; quantity: number }[];
  reason: string;
  status: ReturnStatus;
  refund: Cents;
}

export interface OrderEvent {
  at: ISODateTime;
  status: OrderStatus | ReturnStatus;
  note?: string;
}

export interface Order {
  id: ID;
  number: string;
  customerId: ID | null;
  email: string;
  phone: string;
  shippingAddress: Address;
  lines: OrderLine[];
  subtotal: Cents;
  discount: Cents;
  shipping: Cents;
  total: Cents;
  coupon: string | null;
  shippingMethod: ShippingMethod;
  payment: PaymentMethod;
  status: OrderStatus;
  tracking: { carrier: string; code: string } | null;
  createdAt: ISODateTime;
  deliveredAt: ISODateTime | null;
  history: OrderEvent[];
  returnRequest: ReturnRequest | null;
  marketingConsent: boolean;
}

export type CouponType = "percent" | "fixed" | "free_shipping";

export interface Coupon {
  code: string;
  type: CouponType;
  /** Percentuale (0–100) o importo in centesimi; ignorato per free_shipping. */
  value: number;
  minSubtotal: Cents;
  expiresAt: ISODate | null;
  active: boolean;
}

export interface ShopSettings {
  name: string;
  tagline: string;
  description: string;
  legal: {
    company: string;
    vatNumber: string;
    rea: string;
    address: string;
    email: string;
    pec: string;
    phone: string;
  };
  shipping: {
    standard: Cents;
    express: Cents;
    freeThreshold: Cents;
    pickupEnabled: boolean;
    pickupAddress: string;
  };
  /** Aliquota IVA ordinaria (0–1), per scorporare l'imposta dai prezzi. */
  vatRate: number;
  /** Giorni per il recesso (minimo legale 14). */
  returnDays: number;
  lowStockThreshold: number;
  coupons: Coupon[];
}

export interface DataSnapshot {
  categories: Category[];
  sellers: Seller[];
  products: Product[];
  reviews: Review[];
  customers: Customer[];
  orders: Order[];
  settings: ShopSettings;
}
