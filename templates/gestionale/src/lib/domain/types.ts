/**
 * Modello dati del gestionale.
 *
 * Convenzioni:
 * - Gli importi sono in centesimi di euro (interi) per evitare errori di arrotondamento.
 * - Le date sono stringhe ISO 8601 (UTC); la UI le mostra nel fuso orario del browser.
 * - Gli ID sono stringhe opache: in produzione possono arrivare dal database.
 */

export type ID = string;
/** Data e ora in formato ISO 8601, es. "2026-10-20T08:30:00.000Z". */
export type ISODateTime = string;
/** Importo in centesimi di euro. */
export type Cents = number;
/** Orario locale "HH:mm". */
export type TimeOfDay = string;

/** Indice di colore identità (1–8) mappato sui token `--series-*`. */
export type ColorSlot = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type ClientStatus = "active" | "lead" | "inactive";

export interface Client {
  id: ID;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  city?: string;
  tags: string[];
  status: ClientStatus;
  notes?: string;
  /** Consenso facoltativo e separato per comunicazioni promozionali (GDPR art. 7). */
  marketingConsent: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Service {
  id: ID;
  name: string;
  category: string;
  description?: string;
  durationMin: number;
  price: Cents;
  active: boolean;
  createdAt: ISODateTime;
}

export interface StaffMember {
  id: ID;
  name: string;
  role: string;
  email: string;
  color: ColorSlot;
  active: boolean;
}

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
export type BookingChannel = "online" | "phone" | "walk_in" | "staff";

export interface Appointment {
  id: ID;
  clientId: ID;
  serviceId: ID;
  staffId: ID;
  start: ISODateTime;
  end: ISODateTime;
  status: AppointmentStatus;
  /** Prezzo concordato (può differire dal listino). */
  price: Cents;
  channel: BookingChannel;
  notes?: string;
}

/** Stato salvato. "Scaduto" non si salva: si calcola dalla scadenza (vedi payments.ts). */
export type PaymentStatus = "paid" | "pending" | "refunded";
/** Stato mostrato all'utente, incluso quello derivato "overdue". */
export type PaymentDisplayStatus = PaymentStatus | "overdue";
export type PaymentMethod = "card" | "cash" | "transfer" | "voucher";

export interface Payment {
  id: ID;
  /** Numero progressivo leggibile, es. "2026/0142". */
  number: string;
  clientId: ID;
  appointmentId: ID | null;
  description: string;
  amount: Cents;
  method: PaymentMethod;
  status: PaymentStatus;
  issuedAt: ISODateTime;
  dueAt: ISODateTime;
  paidAt: ISODateTime | null;
  notes?: string;
}

export type NotificationKind = "booking" | "payment" | "reminder" | "system";

export interface AppNotification {
  id: ID;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: ISODateTime;
  read: boolean;
  href?: string;
}

/** Giorno della settimana ISO: 1 = lunedì … 7 = domenica. */
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface OpeningDay {
  day: IsoWeekday;
  open: boolean;
  from: TimeOfDay;
  to: TimeOfDay;
}

export interface BusinessSettings {
  name: string;
  legalName: string;
  vatNumber: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  ownerName: string;
  ownerRole: string;
  hours: OpeningDay[];
  /** Durata minima di uno slot in agenda (minuti). */
  slotMinutes: 15 | 30;
  /** Giorni concessi per il pagamento quando l'importo non viene saldato subito. */
  paymentTermsDays: number;
  reminders: {
    email: boolean;
    sms: boolean;
    hoursBefore: number;
  };
}

/** Intervallo temporale semiaperto [start, end). */
export interface DateRange {
  start: Date;
  end: Date;
}

/** Insieme dei dati dell'attività: è ciò che viene salvato e ripristinato. */
export interface DataSnapshot {
  clients: Client[];
  services: Service[];
  staff: StaffMember[];
  appointments: Appointment[];
  payments: Payment[];
  notifications: AppNotification[];
  settings: BusinessSettings;
}
