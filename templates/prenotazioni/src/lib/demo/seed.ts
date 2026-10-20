import { addDays, startOfDay } from "date-fns";
import { availableSlots, bookingCode } from "@/lib/domain/availability";
import { toISODate } from "@/lib/domain/dates";
import type {
  Appointment,
  AppointmentStatus,
  BusinessSettings,
  DataSnapshot,
  Service,
  ServiceCategory,
  StaffMember,
  TimeOff,
  WeeklyHours,
} from "@/lib/domain/types";
import { createRandom, type Random } from "./random";

/**
 * Dati demo di "Studio Delta", studio di consulenza inventato (Torino).
 * Generati in modo deterministico rispetto alla data di oggi.
 * Contatti fittizi (example.com, numeri con "000").
 */

const SEED = 20261023;

export const DEMO_SETTINGS: BusinessSettings = {
  name: "Studio Delta",
  tagline: "Consulenza fiscale, del lavoro e legale per privati e partite IVA.",
  description:
    "Tre professionisti, un unico studio: dichiarazioni, apertura e gestione della partita IVA, contratti di lavoro, successioni. In studio a Torino o in videochiamata.",
  address: "Via dell'Esempio 4",
  postalCode: "10121",
  city: "Torino",
  phone: "+39 011 000 0404",
  email: "appuntamenti@studiodelta.example",
  vatNumber: "IT00000000000",
  booking: {
    slotStepMin: 30,
    leadTimeHours: 12,
    horizonDays: 45,
    cancelHours: 24,
    allowAnyStaff: true,
  },
};

export const CATEGORIES: ServiceCategory[] = [
  { id: "fiscale", name: "Fisco e partita IVA" },
  { id: "lavoro", name: "Lavoro e famiglia" },
  { id: "legale", name: "Contratti e successioni" },
];

export const STAFF: StaffMember[] = [
  {
    id: "s_laura",
    name: "Laura Ferraris",
    role: "Commercialista",
    bio: "Segue privati, professionisti e piccole imprese su dichiarazioni, regimi fiscali e adempimenti.",
  },
  {
    id: "s_paolo",
    name: "Paolo Rinaldi",
    role: "Consulente del lavoro",
    bio: "Contratti, buste paga, assunzioni di collaboratori domestici e rapporti con gli enti.",
  },
  {
    id: "s_giada",
    name: "Giada Moretti",
    role: "Avvocata civilista",
    bio: "Contratti, locazioni, successioni e donazioni, con un linguaggio chiaro e senza sorprese.",
  },
];

export const SERVICES: Service[] = [
  {
    id: "prima-consulenza",
    categoryId: "fiscale",
    name: "Prima consulenza conoscitiva",
    description:
      "Venti minuti per capire la tua situazione e indicarti il percorso e il preventivo.",
    durationMin: 20,
    bufferMin: 10,
    price: null,
    modes: ["online"],
    staffIds: ["s_laura", "s_paolo", "s_giada"],
    requiresApproval: true,
    active: true,
  },
  {
    id: "730",
    categoryId: "fiscale",
    name: "Dichiarazione dei redditi (730)",
    description: "Raccolta dei documenti, controllo delle detrazioni e invio della dichiarazione.",
    durationMin: 45,
    bufferMin: 15,
    price: 8000,
    modes: ["in_person", "online"],
    staffIds: ["s_laura"],
    requiresApproval: false,
    active: true,
  },
  {
    id: "partita-iva",
    categoryId: "fiscale",
    name: "Apertura partita IVA",
    description: "Scelta del regime, codice ATECO, iscrizioni e primo calendario delle scadenze.",
    durationMin: 60,
    bufferMin: 15,
    price: 12000,
    modes: ["in_person", "online"],
    staffIds: ["s_laura"],
    requiresApproval: false,
    active: true,
  },
  {
    id: "check-up",
    categoryId: "fiscale",
    name: "Check-up fiscale annuale",
    description: "Verifica di imposte, contributi e scadenze dell'anno, con un piano di azioni.",
    durationMin: 60,
    bufferMin: 15,
    price: 15000,
    modes: ["in_person", "online"],
    staffIds: ["s_laura"],
    requiresApproval: false,
    active: true,
  },
  {
    id: "contratto-lavoro",
    categoryId: "lavoro",
    name: "Contratto di lavoro e busta paga",
    description: "Lettura del contratto, verifica della busta paga e dei diritti maturati.",
    durationMin: 45,
    bufferMin: 10,
    price: 7000,
    modes: ["in_person", "online"],
    staffIds: ["s_paolo"],
    requiresApproval: false,
    active: true,
  },
  {
    id: "colf-badanti",
    categoryId: "lavoro",
    name: "Assunzione di colf e badanti",
    description: "Contratto, comunicazione all'INPS, contributi e calendario dei pagamenti.",
    durationMin: 45,
    bufferMin: 10,
    price: 6000,
    modes: ["in_person", "online"],
    staffIds: ["s_paolo"],
    requiresApproval: false,
    active: true,
  },
  {
    id: "revisione-contratto",
    categoryId: "legale",
    name: "Revisione di un contratto",
    description:
      "Analisi di locazioni, contratti di fornitura o di collaborazione prima della firma.",
    durationMin: 60,
    bufferMin: 15,
    price: 14000,
    modes: ["in_person", "online"],
    staffIds: ["s_giada"],
    requiresApproval: false,
    active: true,
  },
  {
    id: "successioni",
    categoryId: "legale",
    name: "Successioni e donazioni",
    description: "Documenti necessari, quote, imposte e tempi della successione o della donazione.",
    durationMin: 60,
    bufferMin: 15,
    price: 16000,
    modes: ["in_person"],
    staffIds: ["s_giada"],
    requiresApproval: false,
    active: true,
  },
];

const weekdays = (days: number[], ranges: [string, string][], staffId: string): WeeklyHours[] =>
  days.map((day) => ({
    staffId,
    day: day as WeeklyHours["day"],
    ranges: ranges.map(([from, to]) => ({ from, to })),
  }));

export const HOURS: WeeklyHours[] = [
  ...weekdays(
    [1, 2, 3, 4, 5],
    [
      ["09:00", "13:00"],
      ["14:30", "18:00"],
    ],
    "s_laura",
  ),
  ...weekdays(
    [1, 2, 3, 4],
    [
      ["09:30", "13:00"],
      ["14:00", "17:30"],
    ],
    "s_paolo",
  ),
  ...weekdays([5], [["09:00", "13:00"]], "s_paolo"),
  ...weekdays(
    [2, 3, 4, 5],
    [
      ["10:00", "13:00"],
      ["15:00", "19:00"],
    ],
    "s_giada",
  ),
  ...weekdays([6], [["09:30", "12:30"]], "s_giada"),
];

const FIRST_NAMES = [
  "Alberto",
  "Alice",
  "Andrea",
  "Arianna",
  "Bruno",
  "Caterina",
  "Claudio",
  "Cristina",
  "Davide",
  "Elena",
  "Fabrizio",
  "Federica",
  "Gabriele",
  "Giorgia",
  "Ivan",
  "Laura",
  "Lorenzo",
  "Marco",
  "Monica",
  "Nadia",
  "Pietro",
  "Rebecca",
  "Riccardo",
  "Silvia",
  "Simone",
  "Teresa",
  "Tommaso",
  "Valeria",
];
const LAST_NAMES = [
  "Actis",
  "Barbero",
  "Bertolino",
  "Bianco",
  "Bosio",
  "Cavallo",
  "Chiesa",
  "Fassino",
  "Ferrero",
  "Gallo",
  "Gianotti",
  "Giordano",
  "Martini",
  "Merlo",
  "Operti",
  "Peano",
  "Revelli",
  "Rosso",
  "Sacco",
  "Viotti",
];
const NOTES = [
  "Porto il modello dell'anno scorso.",
  "Preferisco essere contattato via email.",
  "Ho già un preventivo di un altro studio.",
  "Prima volta in partita IVA.",
];

function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]+/g, "");
}

function customer(random: Random) {
  const first = random.pick(FIRST_NAMES);
  const last = random.pick(LAST_NAMES);
  return {
    name: `${first} ${last}`,
    email: `${slug(first)}.${slug(last)}${random.int(1, 99)}@example.com`,
    phone: `+39 3${random.int(20, 49)} 000 ${random.int(1000, 9999)}`,
  };
}

export function createDemoData(now: Date): DataSnapshot {
  const random = createRandom(SEED);
  const settings = structuredClone(DEMO_SETTINGS);
  const today = startOfDay(now);
  const nowMs = now.getTime();

  // Paolo è in formazione tre giorni la prossima settimana.
  const timeOff: TimeOff[] = [
    {
      id: "off_1",
      staffId: "s_paolo",
      from: toISODate(addDays(today, 8)),
      to: toISODate(addDays(today, 10)),
      reason: "Formazione",
    },
  ];

  const data: DataSnapshot = {
    categories: structuredClone(CATEGORIES),
    services: structuredClone(SERVICES),
    staff: structuredClone(STAFF),
    hours: structuredClone(HOURS),
    timeOff,
    appointments: [],
    settings,
  };

  // Riempie l'agenda giorno per giorno usando la stessa logica della prenotazione online,
  // così gli appuntamenti demo non si sovrappongono mai.
  const finalStatus = new Map<string, AppointmentStatus>();
  const relaxed = { ...settings.booking, leadTimeHours: -24 * 40, horizonDays: 400 };
  for (let offset = -30; offset <= 30; offset += 1) {
    const date = toISODate(addDays(today, offset));
    const future = offset >= 0;
    // Più pieno nei prossimi giorni, più leggero in là nel tempo.
    const fill = future ? Math.max(0.1, 0.32 - offset * 0.007) : 0.45;
    for (const staff of STAFF) {
      const services = SERVICES.filter((s) => s.staffIds.includes(staff.id));
      for (let attempt = 0; attempt < 9; attempt += 1) {
        if (!random.chance(fill)) continue;
        // Le prime consulenze gratuite sono meno frequenti dei servizi a pagamento.
        const service = random.weighted(
          services.map((sv) => [sv, sv.price === null ? 1 : 3] as const),
        );
        const slots = availableSlots({
          service,
          staffId: staff.id,
          date,
          data,
          booking: relaxed,
          now,
        });
        if (slots.length === 0) continue;
        const slot = random.pick(slots);
        const startMs = slot.start.getTime();
        let status: AppointmentStatus;
        if (slot.end.getTime() <= nowMs) {
          status = random.weighted([
            ["completed", 88],
            ["no_show", 4],
            ["cancelled", 8],
          ] as const);
        } else if (service.requiresApproval && offset <= 5 && random.chance(0.6)) {
          status = "pending";
        } else {
          status = random.weighted([
            ["confirmed", 92],
            ["cancelled", 8],
          ] as const);
        }
        const created = new Date(
          Math.min(startMs - random.int(1, 20) * 86_400_000, nowMs - random.int(1, 48) * 3_600_000),
        );
        const appointment: Appointment = {
          id: `ap_${data.appointments.length + 1}`,
          code: bookingCode(random.next),
          serviceId: service.id,
          staffId: staff.id,
          mode: random.pick(service.modes),
          start: slot.start.toISOString(),
          end: slot.end.toISOString(),
          status,
          customer: customer(random),
          notes: random.chance(0.15) ? random.pick(NOTES) : undefined,
          marketingConsent: random.chance(0.3),
          source: random.weighted([
            ["online", 55],
            ["widget", 20],
            ["phone", 25],
          ] as const),
          createdAt: created.toISOString(),
          history: [{ at: created.toISOString(), action: "created", by: "customer" }],
        };
        if (status === "cancelled") {
          appointment.history.push({
            at: new Date(Math.min(startMs - 86_400_000, nowMs)).toISOString(),
            action: "cancelled",
            by: random.chance(0.8) ? "customer" : "business",
          });
        }
        // Durante la generazione i conclusi occupano ancora l'agenda, come quando sono stati
        // prenotati: così nemmeno gli appuntamenti passati si sovrappongono.
        finalStatus.set(appointment.id, status);
        data.appointments.push(
          status === "completed" || status === "no_show"
            ? { ...appointment, status: "confirmed" }
            : appointment,
        );
      }
    }
  }
  data.appointments = data.appointments
    .map((a) => ({ ...a, status: finalStatus.get(a.id) ?? a.status }))
    .sort((a, b) => a.start.localeCompare(b.start));
  return data;
}

/** Dati statici per il rendering sul server della pagina pubblica (SEO). */
export const STATIC_SITE = {
  categories: CATEGORIES,
  services: SERVICES,
  staff: STAFF,
  hours: HOURS,
  settings: DEMO_SETTINGS,
};
