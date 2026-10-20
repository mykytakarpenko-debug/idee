/**
 * Modello dati di Tavola.
 *
 * Convenzioni: importi in centesimi (interi), date ISO 8601 in UTC,
 * orari locali "HH:mm". Gli ID sono stringhe opache.
 */

export type ID = string;
export type ISODateTime = string;
export type Cents = number;
export type TimeOfDay = string;
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** I 14 allergeni da dichiarare (Reg. UE 1169/2011, allegato II). */
export const ALLERGENS = [
  "glutine",
  "crostacei",
  "uova",
  "pesce",
  "arachidi",
  "soia",
  "latte",
  "frutta_a_guscio",
  "sedano",
  "senape",
  "sesamo",
  "solfiti",
  "lupini",
  "molluschi",
] as const;
export type Allergen = (typeof ALLERGENS)[number];

export interface MenuCategory {
  id: ID;
  name: string;
  /** Ordine di visualizzazione. */
  position: number;
}

export interface Dish {
  id: ID;
  categoryId: ID;
  name: string;
  description: string;
  price: Cents;
  allergens: Allergen[];
  vegetarian: boolean;
  vegan: boolean;
  spicy: boolean;
  /** Disponibile oggi (false = "esaurito"). */
  available: boolean;
  /** Ordinabile per asporto e consegna. */
  orderable: boolean;
  /** Mostrato in home tra i consigliati. */
  featured: boolean;
}

export type TableZone = "sala" | "dehors" | "prive";
export type TableShape = "round" | "square" | "rect";

export interface DiningTable {
  id: ID;
  name: string;
  seats: number;
  zone: TableZone;
  shape: TableShape;
  /** Posizione nella mappa di sala (colonna e riga, base 1). */
  x: number;
  y: number;
}

export type ReservationStatus =
  "requested" | "confirmed" | "seated" | "completed" | "no_show" | "cancelled";
export type ReservationSource = "online" | "phone" | "walk_in";

export interface Reservation {
  id: ID;
  /** Codice comunicato al cliente, es. "LU-4F7K". */
  code: string;
  name: string;
  phone: string;
  email: string;
  partySize: number;
  start: ISODateTime;
  durationMin: number;
  status: ReservationStatus;
  tableId: ID | null;
  source: ReservationSource;
  notes?: string;
  marketingConsent: boolean;
  createdAt: ISODateTime;
}

export type OrderType = "delivery" | "takeaway";
export type OrderStatus =
  "new" | "preparing" | "ready" | "out_for_delivery" | "completed" | "cancelled";
export type PaymentMethod = "cash" | "card_on_delivery" | "online";

export interface OrderItem {
  dishId: ID;
  name: string;
  /** Prezzo unitario al momento dell'ordine. */
  price: Cents;
  quantity: number;
}

export interface DeliveryAddress {
  street: string;
  postalCode: string;
  city: string;
  notes?: string;
}

export interface Order {
  id: ID;
  /** Numero progressivo leggibile, es. "1042". */
  number: string;
  type: OrderType;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: Cents;
  deliveryFee: Cents;
  total: Cents;
  customer: { name: string; phone: string; email: string };
  address: DeliveryAddress | null;
  /** Orario di ritiro o consegna richiesto. */
  scheduledFor: ISODateTime;
  payment: PaymentMethod;
  notes?: string;
  createdAt: ISODateTime;
}

export interface ServiceWindow {
  open: boolean;
  from: TimeOfDay;
  to: TimeOfDay;
}

export interface OpeningDay {
  day: IsoWeekday;
  lunch: ServiceWindow;
  dinner: ServiceWindow;
}

export interface RestaurantSettings {
  name: string;
  tagline: string;
  description: string;
  address: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
  vatNumber: string;
  hours: OpeningDay[];
  booking: {
    enabled: boolean;
    slotMinutes: 15 | 30;
    durationMin: number;
    maxPartySize: number;
    /** Anticipo minimo per prenotare online (minuti). */
    leadTimeMin: number;
    /** Ultimo orario di arrivo prima della chiusura del servizio (minuti). */
    lastSeatingBeforeCloseMin: number;
  };
  delivery: {
    enabled: boolean;
    takeawayEnabled: boolean;
    minOrder: Cents;
    fee: Cents;
    freeAbove: Cents;
    prepMinutes: number;
    deliveryMinutes: number;
    postalCodes: string[];
  };
}

export interface DataSnapshot {
  categories: MenuCategory[];
  dishes: Dish[];
  tables: DiningTable[];
  reservations: Reservation[];
  orders: Order[];
  settings: RestaurantSettings;
}

export interface DateRange {
  start: Date;
  end: Date;
}
