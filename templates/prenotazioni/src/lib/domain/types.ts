/**
 * Modello dati di Agenda.
 *
 * Convenzioni: importi in centesimi (interi), istanti ISO 8601 in UTC,
 * date di calendario "YYYY-MM-DD" e orari locali "HH:mm". ID stringhe opache.
 */

export type ID = string;
export type ISODateTime = string;
export type ISODate = string;
export type Cents = number;
export type TimeOfDay = string;
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Mode = "in_person" | "online";

export interface ServiceCategory {
  id: ID;
  name: string;
}

export interface Service {
  id: ID;
  categoryId: ID;
  name: string;
  description: string;
  durationMin: number;
  /** Minuti liberi dopo l'appuntamento (preparazione, appunti). */
  bufferMin: number;
  /** Prezzo indicativo; null = gratuito. */
  price: Cents | null;
  modes: Mode[];
  staffIds: ID[];
  /** Le richieste online restano "da confermare" finché lo studio non le approva. */
  requiresApproval: boolean;
  active: boolean;
}

export interface StaffMember {
  id: ID;
  name: string;
  role: string;
  bio: string;
}

export interface TimeRange {
  from: TimeOfDay;
  to: TimeOfDay;
}

/** Orario settimanale di un professionista: più fasce = pause tra una e l'altra. */
export interface WeeklyHours {
  staffId: ID;
  day: IsoWeekday;
  ranges: TimeRange[];
}

/** Assenza (ferie, formazione) di un professionista o, con staffId null, dello studio. */
export interface TimeOff {
  id: ID;
  staffId: ID | null;
  from: ISODate;
  to: ISODate;
  reason: string;
}

export type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
export type AppointmentSource = "online" | "widget" | "phone";

export interface Customer {
  name: string;
  email: string;
  phone: string;
}

export interface AppointmentEvent {
  at: ISODateTime;
  action: "created" | "confirmed" | "rescheduled" | "cancelled";
  by: "customer" | "business";
}

export interface Appointment {
  id: ID;
  /** Codice per gestire la prenotazione (non indovinabile in produzione: vedi docs). */
  code: string;
  serviceId: ID;
  staffId: ID;
  mode: Mode;
  start: ISODateTime;
  end: ISODateTime;
  status: AppointmentStatus;
  customer: Customer;
  notes?: string;
  marketingConsent: boolean;
  source: AppointmentSource;
  createdAt: ISODateTime;
  history: AppointmentEvent[];
}

export interface BusinessSettings {
  name: string;
  tagline: string;
  description: string;
  address: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
  vatNumber: string;
  booking: {
    /** Passo degli orari proposti (minuti). */
    slotStepMin: 15 | 30 | 60;
    /** Anticipo minimo per prenotare online (ore). */
    leadTimeHours: number;
    /** Giorni in avanti prenotabili. */
    horizonDays: number;
    /** Ore prima dell'appuntamento entro cui il cliente può spostarlo o cancellarlo online. */
    cancelHours: number;
    /** Permette la scelta "primo professionista disponibile". */
    allowAnyStaff: boolean;
  };
}

export interface DataSnapshot {
  categories: ServiceCategory[];
  services: Service[];
  staff: StaffMember[];
  hours: WeeklyHours[];
  timeOff: TimeOff[];
  appointments: Appointment[];
  settings: BusinessSettings;
}
