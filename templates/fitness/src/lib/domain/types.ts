/**
 * Modello dati di Forma.
 *
 * Convenzioni: importi in centesimi (interi), istanti ISO 8601 in UTC,
 * date di calendario "YYYY-MM-DD" e orari locali "HH:mm". ID stringhe opache.
 */

export type ID = string;
export type ISODateTime = string;
/** Data di calendario locale, "YYYY-MM-DD". */
export type ISODate = string;
export type Cents = number;
export type TimeOfDay = string;
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// --- Corsi e lezioni -----------------------------------------------------------

/** Categorie dei corsi, in ordine fisso (associate ai colori --series-1…4). */
export const COURSE_CATEGORIES = ["forza", "cardio", "mente_corpo", "ritmo"] as const;
export type CourseCategory = (typeof COURSE_CATEGORIES)[number];

export type Intensity = 1 | 2 | 3;

export interface Course {
  id: ID;
  name: string;
  category: CourseCategory;
  intensity: Intensity;
  durationMin: number;
  description: string;
  /** Adatto a chi inizia. */
  beginnerFriendly: boolean;
}

export interface Instructor {
  id: ID;
  name: string;
  role: string;
  bio: string;
}

export type Room = "funzionale" | "cycle" | "studio";

/** Lezione ricorrente del palinsesto settimanale. */
export interface WeeklySlot {
  id: ID;
  weekday: IsoWeekday;
  time: TimeOfDay;
  courseId: ID;
  instructorId: ID;
  room: Room;
  capacity: number;
}

/** Singola lezione in calendario, generata dal palinsesto. */
export interface ClassSession {
  id: ID;
  slotId: ID | null;
  courseId: ID;
  instructorId: ID;
  room: Room;
  start: ISODateTime;
  durationMin: number;
  capacity: number;
  cancelled: boolean;
}

export type BookingStatus = "booked" | "waitlist" | "cancelled" | "attended" | "no_show";

export interface Booking {
  id: ID;
  sessionId: ID;
  memberId: ID;
  status: BookingStatus;
  createdAt: ISODateTime;
  /** Cancellata oltre il termine: l'ingresso del carnet non viene restituito. */
  lateCancel?: boolean;
}

// --- Piani e iscritti -------------------------------------------------------------

export type PlanBilling = "monthly" | "pack";

export interface Plan {
  id: ID;
  name: string;
  description: string;
  billing: PlanBilling;
  /** Prezzo mensile (abbonamenti) o del carnet. */
  price: Cents;
  /** Ingressi del carnet (null per gli abbonamenti). */
  entries: number | null;
  /** Validità del carnet in giorni. */
  validityDays: number | null;
  includesGym: boolean;
  includesClasses: boolean;
  perks: string[];
  featured: boolean;
  active: boolean;
}

export type BillingCycle = "monthly" | "annual" | "pack";

export interface Member {
  id: ID;
  /** Codice personale da mostrare in reception. */
  code: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  joinedAt: ISODate;
  planId: ID;
  cycle: BillingCycle;
  membershipStart: ISODate;
  membershipEnd: ISODate;
  autoRenew: boolean;
  /** Ingressi rimasti (solo carnet). */
  entriesLeft: number | null;
  suspended: boolean;
  /**
   * Scadenza del certificato medico, se richiesto. Si conserva SOLO la data:
   * il documento è un dato sanitario (art. 9 GDPR) e resta in reception.
   */
  medicalCertExpiry: ISODate | null;
  marketingConsent: boolean;
  imageConsent: boolean;
  notes?: string;
}

export interface CheckIn {
  id: ID;
  memberId: ID;
  at: ISODateTime;
}

export type PaymentStatus = "paid" | "due" | "failed";
export type PaymentMethod = "card" | "sepa" | "cash";

export interface Payment {
  id: ID;
  memberId: ID;
  planId: ID;
  amount: Cents;
  date: ISODate;
  description: string;
  status: PaymentStatus;
  method: PaymentMethod;
}

export type TrialStatus = "new" | "contacted" | "converted" | "lost";
export type TrialInterest = CourseCategory | "sala_pesi";

export interface TrialRequest {
  id: ID;
  name: string;
  email: string;
  phone: string;
  interest: TrialInterest;
  sessionId: ID | null;
  status: TrialStatus;
  marketingConsent: boolean;
  createdAt: ISODateTime;
}

// --- Impostazioni ------------------------------------------------------------------

export interface OpeningDay {
  day: IsoWeekday;
  open: boolean;
  from: TimeOfDay;
  to: TimeOfDay;
}

export interface ClubSettings {
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
    /** Giorni in anticipo in cui si può prenotare. */
    windowDays: number;
    /** Ore prima dell'inizio entro cui cancellare senza penale. */
    cancelHours: number;
    waitlistEnabled: boolean;
    /** Lezioni prenotabili al giorno per socio. */
    maxDailyBookings: number;
  };
  /** Giorni di preavviso per le scadenze (abbonamento e certificato). */
  reminderDays: number;
  /** Il certificato medico è richiesto dal regolamento della struttura. */
  requireMedicalCert: boolean;
  trialEnabled: boolean;
}

export interface DataSnapshot {
  courses: Course[];
  instructors: Instructor[];
  slots: WeeklySlot[];
  sessions: ClassSession[];
  plans: Plan[];
  members: Member[];
  bookings: Booking[];
  checkIns: CheckIn[];
  payments: Payment[];
  trials: TrialRequest[];
  settings: ClubSettings;
}
