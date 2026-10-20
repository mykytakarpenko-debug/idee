import { addDays, addMinutes, startOfDay, subDays, subMinutes } from "date-fns";
import { isoWeekday, timeToMinutes } from "@/lib/domain/scheduling";
import type {
  AppNotification,
  Appointment,
  AppointmentStatus,
  BookingChannel,
  BusinessSettings,
  Client,
  ClientStatus,
  DataSnapshot,
  Payment,
  PaymentMethod,
  Service,
  StaffMember,
} from "@/lib/domain/types";
import { createRandom, type Random } from "./random";

/**
 * Dati demo realistici e completamente fittizi.
 *
 * - Generati in modo deterministico rispetto alla data passata, così la demo
 *   è sempre "attuale" (appuntamenti oggi, scadenze recenti).
 * - Nomi inventati, email su dominio riservato `example.com`, telefoni con "000".
 * - Un anno di storico con crescita graduale, picco a dicembre e chiusura estiva.
 *
 * Per adattare la demo a un altro settore modifica SERVICES, STAFF e i testi.
 */

const SEED = 20261020;

export const DEMO_SETTINGS: BusinessSettings = {
  name: "Studio Aurora",
  legalName: "Studio Aurora S.r.l. (dati di esempio)",
  vatNumber: "IT00000000000",
  email: "info@studioaurora.example",
  phone: "+39 051 000 0000",
  address: "Via dell'Esempio 12",
  city: "Bologna",
  ownerName: "Giulia Rinaldi",
  ownerRole: "Titolare",
  hours: [
    { day: 1, open: true, from: "14:00", to: "19:00" },
    { day: 2, open: true, from: "09:00", to: "19:00" },
    { day: 3, open: true, from: "09:00", to: "19:00" },
    { day: 4, open: true, from: "09:00", to: "19:00" },
    { day: 5, open: true, from: "09:00", to: "19:00" },
    { day: 6, open: true, from: "09:00", to: "17:00" },
    { day: 7, open: false, from: "09:00", to: "13:00" },
  ],
  slotMinutes: 15,
  paymentTermsDays: 15,
  reminders: { email: true, sms: false, hoursBefore: 24 },
};

const STAFF: (StaffMember & { categories: string[] })[] = [
  {
    id: "st_1",
    name: "Giulia Rinaldi",
    role: "Titolare · Hair stylist",
    email: "giulia@studioaurora.example",
    color: 1,
    active: true,
    categories: ["Capelli", "Consulenza"],
  },
  {
    id: "st_2",
    name: "Marco Fontana",
    role: "Hair stylist",
    email: "marco@studioaurora.example",
    color: 2,
    active: true,
    categories: ["Capelli"],
  },
  {
    id: "st_3",
    name: "Sara Colombo",
    role: "Estetista",
    email: "sara@studioaurora.example",
    color: 3,
    active: true,
    categories: ["Estetica"],
  },
  {
    id: "st_4",
    name: "Elena Greco",
    role: "Massoterapista",
    email: "elena@studioaurora.example",
    color: 4,
    active: true,
    categories: ["Benessere", "Estetica"],
  },
];

type ServiceSeed = [
  name: string,
  category: string,
  minutes: number,
  euros: number,
  weight: number,
  description: string,
];

const SERVICES: ServiceSeed[] = [
  ["Taglio e piega", "Capelli", 60, 45, 10, "Consulenza, shampoo, taglio e piega finale."],
  ["Taglio uomo", "Capelli", 30, 25, 8, "Taglio con rifinitura e styling."],
  ["Piega", "Capelli", 40, 25, 7, "Piega liscia o mossa con prodotti protettivi."],
  ["Colore", "Capelli", 90, 60, 5, "Colorazione completa con trattamento post-colore."],
  ["Balayage", "Capelli", 150, 120, 2, "Schiariture a mano libera dall'effetto naturale."],
  ["Trattamento ristrutturante", "Capelli", 30, 30, 3, "Maschera intensiva per capelli trattati."],
  ["Pulizia del viso", "Estetica", 60, 55, 6, "Detersione profonda, esfoliazione e maschera."],
  ["Manicure", "Estetica", 45, 28, 7, "Cura delle unghie e smalto classico."],
  ["Pedicure", "Estetica", 50, 35, 4, "Pedicure estetico con trattamento idratante."],
  [
    "Trattamento viso illuminante",
    "Estetica",
    75,
    70,
    2,
    "Trattamento antiossidante per pelli spente.",
  ],
  ["Massaggio rilassante", "Benessere", 50, 60, 6, "Massaggio total body con oli essenziali."],
  [
    "Massaggio decontratturante",
    "Benessere",
    50,
    65,
    5,
    "Lavoro mirato su collo, spalle e schiena.",
  ],
  ["Consulenza immagine", "Consulenza", 30, 35, 1, "Analisi di stile e scelta del look."],
];

const FIRST_NAMES = [
  "Alessia",
  "Andrea",
  "Anna",
  "Beatrice",
  "Camilla",
  "Carlo",
  "Chiara",
  "Claudia",
  "Davide",
  "Elisa",
  "Emma",
  "Federica",
  "Francesca",
  "Gabriele",
  "Giada",
  "Giorgia",
  "Ilaria",
  "Irene",
  "Laura",
  "Lorenzo",
  "Lucia",
  "Luca",
  "Marta",
  "Martina",
  "Matteo",
  "Michela",
  "Noemi",
  "Paola",
  "Riccardo",
  "Roberta",
  "Silvia",
  "Simone",
  "Sofia",
  "Stefano",
  "Valentina",
  "Veronica",
];

const LAST_NAMES = [
  "Amato",
  "Barbieri",
  "Bassi",
  "Bellini",
  "Benedetti",
  "Bernardi",
  "Caruso",
  "Cattaneo",
  "Conti",
  "Costa",
  "D'Angelo",
  "De Luca",
  "Fabbri",
  "Farina",
  "Ferri",
  "Galli",
  "Gentile",
  "Giordano",
  "Lombardi",
  "Mancini",
  "Marchetti",
  "Mariani",
  "Martini",
  "Messina",
  "Monti",
  "Morelli",
  "Neri",
  "Orlando",
  "Palumbo",
  "Pellegrini",
  "Ricci",
  "Rizzo",
  "Sala",
  "Santoro",
  "Serra",
  "Testa",
  "Valentini",
  "Villa",
  "Vitale",
];

const CITIES = [
  "Bologna",
  "Bologna",
  "Bologna",
  "Casalecchio di Reno",
  "San Lazzaro di Savena",
  "Imola",
  "Modena",
];
const TAGS = ["VIP", "Abbonamento", "Passaparola", "Aziendale", "Fedeltà"];
const COMPANIES = ["Officina Creativa", "Nordline Consulting", "Studio Tecnico Delta", "Verde Lab"];
const NOTES = [
  "Preferisce prodotti senza profumo.",
  "Arriva sempre qualche minuto prima.",
  "Chiede di essere contattata via WhatsApp.",
  "Gradisce un caffè all'arrivo.",
  "Preferisce appuntamenti in tarda mattinata.",
];
const APPOINTMENT_NOTES = [
  "Portare la scheda colore aggiornata.",
  "Prima volta: dedicare 5 minuti alla consulenza.",
  "Richiesta pressione leggera.",
  "Possibile ritardo di 10 minuti.",
];

const CLIENT_COUNT = 72;

function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

function makeClients(random: Random, now: Date): (Client & { weight: number })[] {
  const used = new Set<string>();
  const clients: (Client & { weight: number })[] = [];
  for (let i = 0; clients.length < CLIENT_COUNT; i += 1) {
    const firstName = random.pick(FIRST_NAMES);
    const lastName = random.pick(LAST_NAMES);
    const key = `${firstName} ${lastName}`;
    if (used.has(key)) continue;
    used.add(key);

    const status: ClientStatus = random.weighted([
      ["active", 78],
      ["lead", 11],
      ["inactive", 11],
    ]);
    // I clienti più recenti sono pochi: 8 nell'ultimo mese, il resto nei 20 mesi precedenti.
    const createdDaysAgo = clients.length < 8 ? random.int(1, 29) : random.int(40, 600);
    const createdAt = subDays(now, createdDaysAgo);
    createdAt.setHours(random.int(9, 18), random.int(0, 59), 0, 0);

    const tags = TAGS.filter(() => random.chance(0.14));
    clients.push({
      id: `cl_${(i + 1).toString(36)}`,
      firstName,
      lastName,
      email: random.chance(0.88) ? `${slug(firstName)}.${slug(lastName)}@example.com` : "",
      phone: `+39 3${random.int(20, 49)} 000 ${String(random.int(0, 9999)).padStart(4, "0")}`,
      company: tags.includes("Aziendale") ? random.pick(COMPANIES) : undefined,
      city: random.pick(CITIES),
      tags,
      status,
      notes: random.chance(0.2) ? random.pick(NOTES) : undefined,
      marketingConsent: random.chance(0.62),
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
      // Peso di frequenza: alcuni clienti tornano molto più spesso di altri.
      weight: tags.includes("VIP") || tags.includes("Abbonamento") ? 6 : random.int(1, 4),
    });
  }
  return clients;
}

/** Stagionalità: chiusura estiva, picco a dicembre e crescita nell'ultimo anno. */
function dayLoad(day: Date, daysFromToday: number): number {
  const month = day.getMonth();
  const date = day.getDate();
  if (month === 7 && date >= 8 && date <= 23) return 0; // ferie di agosto
  if (month === 11 && date >= 24 && date <= 26) return 0; // Natale
  if (month === 0 && date === 1) return 0;

  let load: number;
  if (daysFromToday <= 0) {
    // Crescita lineare: dal 48% di un anno fa al 70% di oggi.
    load = 0.7 - (Math.min(365, -daysFromToday) / 365) * 0.22;
  } else {
    // Le prenotazioni future si diradano man mano che ci si allontana da oggi.
    load = Math.max(0, 0.74 * (1 - daysFromToday / 30));
  }
  if (month === 11) load *= 1.18;
  if (month === 6) load *= 0.9;
  return Math.min(load, 0.85);
}

function pastStatus(random: Random): AppointmentStatus {
  return random.weighted([
    ["completed", 88],
    ["no_show", 4],
    ["cancelled", 8],
  ]);
}

function futureStatus(random: Random, daysFromToday: number): AppointmentStatus {
  return random.weighted([
    ["confirmed", daysFromToday <= 1 ? 72 : 80],
    ["pending", daysFromToday <= 1 ? 24 : 15],
    ["cancelled", 4],
  ]);
}

const CHANNELS: (readonly [BookingChannel, number])[] = [
  ["online", 40],
  ["phone", 34],
  ["walk_in", 14],
  ["staff", 12],
];

const METHODS: (readonly [PaymentMethod, number])[] = [
  ["card", 56],
  ["cash", 30],
  ["transfer", 5],
  ["voucher", 9],
];

export function createDemoData(now: Date): DataSnapshot {
  const random = createRandom(SEED);
  const today = startOfDay(now);
  const settings = structuredClone(DEMO_SETTINGS);

  const services: Service[] = SERVICES.map(
    ([name, category, minutes, euros, , description], i) => ({
      id: `sv_${i + 1}`,
      name,
      category,
      description,
      durationMin: minutes,
      price: euros * 100,
      active: true,
      createdAt: subDays(today, 640).toISOString(),
    }),
  );
  services.push({
    id: `sv_${services.length + 1}`,
    name: "Percorso detox estivo",
    category: "Benessere",
    description: "Pacchetto stagionale non più disponibile.",
    durationMin: 90,
    price: 9500,
    active: false,
    createdAt: subDays(today, 480).toISOString(),
  });
  const serviceWeights = new Map(SERVICES.map((entry, i) => [`sv_${i + 1}`, entry[4]]));

  const clients = makeClients(random, now);
  const activePool = clients.filter((c) => c.status === "active");
  const inactivePool = clients.filter((c) => c.status === "inactive");
  const leadPool = clients.filter((c) => c.status === "lead");

  const appointments: Appointment[] = [];
  let appointmentSeq = 0;

  for (let offset = -365; offset <= 28; offset += 1) {
    const day = addDays(today, offset);
    const opening = settings.hours.find((h) => h.day === isoWeekday(day));
    if (!opening?.open) continue;
    const load = dayLoad(day, offset);
    if (load === 0) continue;

    const openMin = timeToMinutes(opening.from);
    const closeMin = timeToMinutes(opening.to);

    for (const member of STAFF) {
      const memberServices = services.filter(
        (s) => s.active && member.categories.includes(s.category),
      );
      let cursor = openMin + random.pick([0, 0, 15, 30]);
      while (cursor < closeMin) {
        if (!random.chance(load)) {
          cursor += 30;
          continue;
        }
        const service = random.weighted(
          memberServices.map((s) => [s, serviceWeights.get(s.id) ?? 1] as const),
        );
        if (cursor + service.durationMin > closeMin) break;

        const start = addMinutes(day, cursor);
        const end = addMinutes(start, service.durationMin);
        const isPast = end.getTime() <= now.getTime();

        // Clienti: inattivi solo nello storico lontano, potenziali solo in futuro.
        let pool = activePool;
        if (offset < -150 && random.chance(0.18)) pool = inactivePool;
        if (!isPast && random.chance(0.06)) pool = leadPool;
        const client = random.weighted(pool.map((c) => [c, c.weight] as const));
        if (new Date(client.createdAt).getTime() > start.getTime() && isPast) {
          cursor += 30;
          continue;
        }

        const status = isPast ? pastStatus(random) : futureStatus(random, offset);
        const discount = client.tags.includes("VIP") && random.chance(0.4) ? 0.9 : 1;
        appointmentSeq += 1;
        appointments.push({
          id: `ap_${appointmentSeq.toString(36)}`,
          clientId: client.id,
          serviceId: service.id,
          staffId: member.id,
          start: start.toISOString(),
          end: end.toISOString(),
          status,
          price: Math.round((service.price * discount) / 100) * 100,
          channel: random.weighted(CHANNELS),
          notes: random.chance(0.05) ? random.pick(APPOINTMENT_NOTES) : undefined,
        });
        cursor += service.durationMin + random.pick([0, 0, 0, 15]);
      }
    }
  }

  // --- Pagamenti ------------------------------------------------------------
  const payments: Payment[] = [];
  const termsDays = settings.paymentTermsDays;
  const draft: Omit<Payment, "number">[] = [];

  for (const appointment of appointments) {
    if (appointment.status !== "completed") continue;
    const issued = new Date(appointment.end);
    const daysAgo = (now.getTime() - issued.getTime()) / 86_400_000;
    // Gli insoluti si concentrano nelle ultime settimane.
    const unpaid =
      daysAgo < 15
        ? random.chance(0.03)
        : daysAgo < 60
          ? random.chance(0.003)
          : random.chance(0.0003);
    const method = unpaid
      ? random.pick<PaymentMethod>(["transfer", "transfer", "card"])
      : random.weighted(METHODS);
    const refunded = !unpaid && random.chance(0.003);
    const service = services.find((s) => s.id === appointment.serviceId);
    draft.push({
      id: `pa_${appointment.id.slice(3)}`,
      clientId: appointment.clientId,
      appointmentId: appointment.id,
      description: service?.name ?? "Servizio",
      amount: appointment.price,
      method,
      status: unpaid ? "pending" : refunded ? "refunded" : "paid",
      issuedAt: issued.toISOString(),
      dueAt: addDays(issued, unpaid ? termsDays : 0).toISOString(),
      paidAt: unpaid || refunded ? null : issued.toISOString(),
    });
  }

  // Vendite di prodotti e buoni regalo non legate ad appuntamenti.
  for (let offset = -365; offset <= 0; offset += 1) {
    const day = addDays(today, offset);
    const opening = settings.hours.find((h) => h.day === isoWeekday(day));
    if (!opening?.open || dayLoad(day, offset) === 0) continue;
    const isDecember = day.getMonth() === 11;
    if (!random.chance(isDecember ? 0.55 : 0.22)) continue;
    const at = addMinutes(day, timeToMinutes(opening.from) + random.int(30, 240));
    if (at.getTime() > now.getTime()) continue;
    const isVoucher = isDecember ? random.chance(0.6) : random.chance(0.15);
    const client = random.weighted(activePool.map((c) => [c, c.weight] as const));
    draft.push({
      id: `pa_x${(offset + 400).toString(36)}`,
      clientId: client.id,
      appointmentId: null,
      description: isVoucher
        ? "Buono regalo"
        : random.pick(["Vendita prodotti", "Kit cura capelli", "Crema viso"]),
      amount: (isVoucher ? random.pick([50, 80, 100]) : random.pick([18, 24, 32, 39])) * 100,
      method: random.weighted(METHODS.filter(([m]) => m !== "voucher")),
      status: "paid",
      issuedAt: at.toISOString(),
      dueAt: at.toISOString(),
      paidAt: at.toISOString(),
    });
  }

  draft.sort((a, b) => a.issuedAt.localeCompare(b.issuedAt));
  const counters = new Map<number, number>();
  for (const entry of draft) {
    const year = new Date(entry.issuedAt).getFullYear();
    const n = (counters.get(year) ?? 0) + 1;
    counters.set(year, n);
    payments.push({ ...entry, number: `${year}/${String(n).padStart(4, "0")}` });
  }

  // --- Notifiche --------------------------------------------------------------
  const clientName = (id: string) => {
    const c = clients.find((x) => x.id === id);
    return c ? `${c.firstName} ${c.lastName}` : "Un cliente";
  };
  const notifications: AppNotification[] = [];
  const upcomingOnline = appointments.find(
    (a) =>
      a.channel === "online" && new Date(a.start) > addDays(today, 1) && a.status !== "cancelled",
  );
  if (upcomingOnline) {
    const service = services.find((s) => s.id === upcomingOnline.serviceId);
    notifications.push({
      id: "nt_1",
      kind: "booking",
      title: "Nuova prenotazione online",
      body: `${clientName(upcomingOnline.clientId)} ha prenotato “${service?.name ?? "un servizio"}”.`,
      createdAt: subMinutes(now, 14).toISOString(),
      read: false,
      href: "/appuntamenti",
    });
  }
  const overdue = payments.find(
    (p) => p.status === "pending" && new Date(p.dueAt).getTime() < today.getTime(),
  );
  if (overdue) {
    notifications.push({
      id: "nt_2",
      kind: "payment",
      title: "Pagamento scaduto",
      body: `La ricevuta ${overdue.number} di ${clientName(overdue.clientId)} risulta non pagata.`,
      createdAt: subMinutes(now, 130).toISOString(),
      read: false,
      href: "/pagamenti",
    });
  }
  const tomorrowPending = appointments.filter((a) => {
    const start = new Date(a.start);
    return a.status === "pending" && start >= addDays(today, 1) && start < addDays(today, 2);
  }).length;
  if (tomorrowPending > 0) {
    notifications.push({
      id: "nt_3",
      kind: "reminder",
      title: "Appuntamenti da confermare",
      body: `${tomorrowPending} ${tomorrowPending === 1 ? "appuntamento di domani è" : "appuntamenti di domani sono"} ancora da confermare.`,
      createdAt: subMinutes(now, 320).toISOString(),
      read: false,
      href: "/calendario",
    });
  }
  notifications.push(
    {
      id: "nt_4",
      kind: "system",
      title: "Promemoria inviati",
      body: "I promemoria per gli appuntamenti di oggi sono stati inviati ai clienti.",
      createdAt: subMinutes(now, 60 * 20).toISOString(),
      read: true,
      href: "/impostazioni",
    },
    {
      id: "nt_5",
      kind: "booking",
      title: "Nuovo cliente",
      body: `${clientName(clients[0]!.id)} si è registrato tramite il modulo di prenotazione.`,
      createdAt: subMinutes(now, 60 * 46).toISOString(),
      read: true,
      href: `/clienti/${clients[0]!.id}`,
    },
  );

  return {
    clients: clients.map(({ weight: _weight, ...client }) => client),
    services,
    staff: STAFF.map(({ categories: _categories, ...member }) => member),
    appointments,
    payments,
    notifications,
    settings,
  };
}
