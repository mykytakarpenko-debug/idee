import { addDays, addMinutes, startOfDay, subDays, subMonths } from "date-fns";
import { sessionStats } from "@/lib/domain/booking";
import { openingFor, parseISODate, timeToMinutes, toISODate } from "@/lib/domain/dates";
import { cyclePrice } from "@/lib/domain/membership";
import { generateSessions } from "@/lib/domain/schedule";
import type {
  BillingCycle,
  Booking,
  CheckIn,
  ClubSettings,
  Course,
  DataSnapshot,
  Instructor,
  IsoWeekday,
  Member,
  Payment,
  Plan,
  Room,
  TrialRequest,
  WeeklySlot,
} from "@/lib/domain/types";
import { createRandom, type Random } from "./random";

/**
 * Dati demo di "Ritmo Club", palestra inventata di Milano.
 * Generati in modo deterministico rispetto alla data di oggi.
 * Contatti fittizi (example.com, numeri con "000").
 */

const SEED = 20261022;
/** Il socio con cui si entra nell'area socio demo. */
export const DEMO_MEMBER_ID = "m_1";

export const DEMO_SETTINGS: ClubSettings = {
  name: "Ritmo Club",
  tagline: "Allenati con metodo, ogni giorno.",
  description:
    "Palestra e studio corsi a Milano: sala attrezzi, functional, cycle, yoga e pilates con istruttori qualificati e gruppi a numero chiuso.",
  address: "Via dell'Esempio 21",
  postalCode: "20121",
  city: "Milano",
  phone: "+39 02 000 0202",
  email: "ciao@ritmoclub.example",
  vatNumber: "IT00000000000",
  hours: [
    { day: 1, open: true, from: "07:00", to: "22:30" },
    { day: 2, open: true, from: "07:00", to: "22:30" },
    { day: 3, open: true, from: "07:00", to: "22:30" },
    { day: 4, open: true, from: "07:00", to: "22:30" },
    { day: 5, open: true, from: "07:00", to: "22:00" },
    { day: 6, open: true, from: "09:00", to: "19:00" },
    { day: 7, open: true, from: "09:00", to: "13:00" },
  ],
  booking: { windowDays: 7, cancelHours: 6, waitlistEnabled: true, maxDailyBookings: 2 },
  reminderDays: 14,
  requireMedicalCert: true,
  trialEnabled: true,
};

export const COURSES: Course[] = [
  {
    id: "functional",
    name: "Functional Training",
    category: "forza",
    intensity: 2,
    durationMin: 50,
    description:
      "Movimenti naturali a corpo libero e con piccoli attrezzi per forza, coordinazione e postura.",
    beginnerFriendly: true,
  },
  {
    id: "total-body",
    name: "Total Body",
    category: "forza",
    intensity: 2,
    durationMin: 45,
    description:
      "Circuito completo per tutti i distretti muscolari, con progressioni per ogni livello.",
    beginnerFriendly: true,
  },
  {
    id: "kettlebell",
    name: "Kettlebell",
    category: "forza",
    intensity: 3,
    durationMin: 45,
    description: "Swing, clean e press: tecnica prima di tutto, poi intensità.",
    beginnerFriendly: false,
  },
  {
    id: "cycle",
    name: "Cycle",
    category: "cardio",
    intensity: 3,
    durationMin: 45,
    description: "Allenamento su bike al ritmo della musica, con zone di intensità guidate.",
    beginnerFriendly: true,
  },
  {
    id: "hiit",
    name: "HIIT 30",
    category: "cardio",
    intensity: 3,
    durationMin: 30,
    description: "Intervalli brevi ad alta intensità: mezz'ora, risultato pieno.",
    beginnerFriendly: false,
  },
  {
    id: "cardio-boxe",
    name: "Cardio Boxe",
    category: "cardio",
    intensity: 2,
    durationMin: 50,
    description:
      "Combinazioni di boxe al sacco senza contatto per resistenza e scarico dello stress.",
    beginnerFriendly: true,
  },
  {
    id: "yoga",
    name: "Yoga Flow",
    category: "mente_corpo",
    intensity: 1,
    durationMin: 60,
    description: "Sequenze fluide di posture e respiro per mobilità, equilibrio e concentrazione.",
    beginnerFriendly: true,
  },
  {
    id: "pilates",
    name: "Pilates Matwork",
    category: "mente_corpo",
    intensity: 1,
    durationMin: 50,
    description: "Lavoro sul centro del corpo, controllo e allungamento sul tappetino.",
    beginnerFriendly: true,
  },
  {
    id: "mobility",
    name: "Stretching e mobilità",
    category: "mente_corpo",
    intensity: 1,
    durationMin: 45,
    description: "Una lezione dolce per articolazioni libere e schiena più sciolta.",
    beginnerFriendly: true,
  },
  {
    id: "zumba",
    name: "Zumba",
    category: "ritmo",
    intensity: 2,
    durationMin: 50,
    description: "Coreografie semplici su ritmi latini: ci si allena divertendosi.",
    beginnerFriendly: true,
  },
  {
    id: "dance-fit",
    name: "Dance Fit",
    category: "ritmo",
    intensity: 2,
    durationMin: 50,
    description: "Allenamento cardio con passi di danza moderna e musica pop.",
    beginnerFriendly: true,
  },
];

export const INSTRUCTORS: Instructor[] = [
  {
    id: "i_giulia",
    name: "Giulia Ferri",
    role: "Functional e kettlebell",
    bio: "Laureata in scienze motorie, segue il programma forza del club.",
  },
  {
    id: "i_marco",
    name: "Marco Bassi",
    role: "Cycle e HIIT",
    bio: "Ex ciclista, trasforma ogni lezione in una salita da conquistare.",
  },
  {
    id: "i_elena",
    name: "Elena Conti",
    role: "Yoga e pilates",
    bio: "Insegnante di yoga da dieci anni, attenta a respiro e postura.",
  },
  {
    id: "i_davide",
    name: "Davide Riva",
    role: "Cardio boxe e total body",
    bio: "Istruttore di pugilato amatoriale, ritmo alto e tanta tecnica.",
  },
  {
    id: "i_sara",
    name: "Sara Gallo",
    role: "Zumba e dance",
    bio: "Ballerina e istruttrice, porta energia anche il lunedì mattina.",
  },
  {
    id: "i_luca",
    name: "Luca Moretti",
    role: "Mobilità e functional",
    bio: "Chinesiologo, si occupa di prevenzione e rientro dall'infortunio.",
  },
];

const CAPACITY: Record<Room, number> = { funzionale: 16, cycle: 20, studio: 14 };

/** Palinsesto: [giorno, ora, corso, istruttore, sala]. */
const SCHEDULE: [IsoWeekday, string, string, string, Room][] = [
  [1, "07:30", "functional", "i_luca", "funzionale"],
  [1, "09:30", "pilates", "i_elena", "studio"],
  [1, "12:45", "hiit", "i_marco", "funzionale"],
  [1, "18:00", "cycle", "i_marco", "cycle"],
  [1, "19:00", "total-body", "i_davide", "funzionale"],
  [1, "19:15", "yoga", "i_elena", "studio"],
  [1, "20:15", "zumba", "i_sara", "funzionale"],
  [2, "07:30", "cycle", "i_marco", "cycle"],
  [2, "09:30", "mobility", "i_luca", "studio"],
  [2, "12:45", "functional", "i_giulia", "funzionale"],
  [2, "18:00", "kettlebell", "i_giulia", "funzionale"],
  [2, "19:00", "cardio-boxe", "i_davide", "funzionale"],
  [2, "19:15", "pilates", "i_elena", "studio"],
  [2, "20:00", "cycle", "i_marco", "cycle"],
  [3, "07:30", "functional", "i_luca", "funzionale"],
  [3, "09:30", "yoga", "i_elena", "studio"],
  [3, "12:45", "hiit", "i_marco", "funzionale"],
  [3, "18:00", "cycle", "i_marco", "cycle"],
  [3, "19:00", "dance-fit", "i_sara", "funzionale"],
  [3, "19:15", "mobility", "i_luca", "studio"],
  [3, "20:15", "total-body", "i_davide", "funzionale"],
  [4, "07:30", "cycle", "i_marco", "cycle"],
  [4, "09:30", "pilates", "i_elena", "studio"],
  [4, "12:45", "functional", "i_giulia", "funzionale"],
  [4, "18:00", "kettlebell", "i_giulia", "funzionale"],
  [4, "19:00", "cardio-boxe", "i_davide", "funzionale"],
  [4, "19:15", "yoga", "i_elena", "studio"],
  [4, "20:00", "cycle", "i_marco", "cycle"],
  [5, "07:30", "functional", "i_luca", "funzionale"],
  [5, "12:45", "hiit", "i_marco", "funzionale"],
  [5, "18:00", "zumba", "i_sara", "funzionale"],
  [5, "18:30", "yoga", "i_elena", "studio"],
  [5, "19:00", "cycle", "i_marco", "cycle"],
  [6, "10:00", "cycle", "i_marco", "cycle"],
  [6, "10:00", "pilates", "i_elena", "studio"],
  [6, "11:00", "total-body", "i_davide", "funzionale"],
  [6, "12:00", "dance-fit", "i_sara", "funzionale"],
  [7, "10:00", "yoga", "i_elena", "studio"],
  [7, "10:30", "functional", "i_giulia", "funzionale"],
];

export const WEEKLY_SLOTS: WeeklySlot[] = SCHEDULE.map(
  ([weekday, time, courseId, instructorId, room], i) => ({
    id: `w${i + 1}`,
    weekday,
    time,
    courseId,
    instructorId,
    room,
    capacity: CAPACITY[room],
  }),
);

export const PLANS: Plan[] = [
  {
    id: "open",
    name: "Open",
    description: "Sala attrezzi e cardio in libertà, negli orari di apertura.",
    billing: "monthly",
    price: 3900,
    entries: null,
    validityDays: null,
    includesGym: true,
    includesClasses: false,
    perks: ["Sala attrezzi e area cardio", "Scheda di allenamento iniziale", "Spogliatoi e docce"],
    featured: false,
    active: true,
  },
  {
    id: "corsi",
    name: "Corsi",
    description: "Tutte le lezioni di gruppo del palinsesto, prenotabili dall'app.",
    billing: "monthly",
    price: 4900,
    entries: null,
    validityDays: null,
    includesGym: false,
    includesClasses: true,
    perks: [
      "Lezioni di gruppo illimitate",
      "Prenotazione fino a 7 giorni prima",
      "Lista d'attesa automatica",
    ],
    featured: false,
    active: true,
  },
  {
    id: "completo",
    name: "Completo",
    description: "Sala attrezzi e tutte le lezioni: il piano più scelto.",
    billing: "monthly",
    price: 6500,
    entries: null,
    validityDays: null,
    includesGym: true,
    includesClasses: true,
    perks: [
      "Sala attrezzi e area cardio",
      "Lezioni di gruppo illimitate",
      "Check-up con un istruttore ogni 3 mesi",
      "Un ingresso ospite al mese",
    ],
    featured: true,
    active: true,
  },
  {
    id: "carnet",
    name: "Carnet 10 ingressi",
    description: "Per chi si allena quando può: sala o lezioni, valido 90 giorni.",
    billing: "pack",
    price: 12000,
    entries: 10,
    validityDays: 90,
    includesGym: true,
    includesClasses: true,
    perks: ["10 ingressi in sala o a lezione", "Validità 90 giorni", "Nessun rinnovo automatico"],
    featured: false,
    active: true,
  },
];

const FIRST_NAMES = [
  "Alessia",
  "Andrea",
  "Anna",
  "Camilla",
  "Chiara",
  "Cristina",
  "Daniele",
  "Elisa",
  "Emma",
  "Fabio",
  "Federica",
  "Filippo",
  "Gabriele",
  "Giacomo",
  "Giorgia",
  "Irene",
  "Laura",
  "Lorenzo",
  "Luca",
  "Marta",
  "Matteo",
  "Michela",
  "Nicolò",
  "Noemi",
  "Paolo",
  "Riccardo",
  "Roberto",
  "Serena",
  "Stefano",
  "Valeria",
];
const LAST_NAMES = [
  "Barbieri",
  "Bellini",
  "Bernardi",
  "Brambilla",
  "Caputo",
  "Cattaneo",
  "Colombo",
  "Conte",
  "Costa",
  "D'Angelo",
  "De Luca",
  "Ferraro",
  "Fontana",
  "Galli",
  "Gentile",
  "Giordano",
  "Greco",
  "Leone",
  "Lombardi",
  "Longo",
  "Mancini",
  "Mariani",
  "Marino",
  "Martini",
  "Messina",
  "Moretti",
  "Negri",
  "Orlando",
  "Pellegrini",
  "Ricci",
  "Rinaldi",
  "Rizzi",
  "Rossetti",
  "Ruggiero",
  "Sala",
  "Santoro",
  "Testa",
  "Valentini",
  "Villa",
  "Vitale",
];

function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]+/g, "");
}

function makeMember(random: Random, index: number, today: Date): Member {
  const firstName = random.pick(FIRST_NAMES);
  const lastName = random.pick(LAST_NAMES);
  const kind = random.weighted([
    ["active", 66],
    ["expiring", 9],
    ["expired", 9],
    ["suspended", 4],
    ["pack", 12],
  ] as const);
  const planId =
    kind === "pack"
      ? "carnet"
      : random.weighted([
          ["completo", 50],
          ["corsi", 25],
          ["open", 25],
        ] as const);
  const cycle: BillingCycle = kind === "pack" ? "pack" : random.chance(0.22) ? "annual" : "monthly";
  // Una parte dei soci si è iscritta questo mese.
  const recent = random.chance(0.08);
  const joined = recent
    ? subDays(today, random.int(0, Math.max(0, today.getDate() - 1)))
    : subDays(today, random.int(35, 1100));

  let end: Date;
  if (kind === "expired") end = subDays(today, random.int(2, 60));
  else if (kind === "expiring") end = addDays(today, random.int(0, 12));
  else if (kind === "pack") end = addDays(today, random.int(5, 85));
  else end = addDays(today, cycle === "annual" ? random.int(15, 330) : random.int(1, 29));
  const start =
    cycle === "annual"
      ? subMonths(addDays(end, 1), 12)
      : cycle === "pack"
        ? subDays(end, 89)
        : subMonths(addDays(end, 1), 1);

  const cert = random.weighted([
    ["valid", 74],
    ["expiring", 10],
    ["expired", 8],
    ["missing", 8],
  ] as const);
  const certExpiry =
    cert === "missing"
      ? null
      : toISODate(
          cert === "valid"
            ? addDays(today, random.int(35, 340))
            : cert === "expiring"
              ? addDays(today, random.int(1, 28))
              : subDays(today, random.int(1, 90)),
        );

  return {
    id: `m_${index}`,
    code: `RC-${String(1000 + index * 7).padStart(4, "0")}`,
    firstName,
    lastName,
    email: `${slug(firstName)}.${slug(lastName)}${index}@example.com`,
    phone: `+39 3${random.int(20, 49)} 000 ${String(random.int(1000, 9999))}`,
    joinedAt: toISODate(recent || joined.getTime() < start.getTime() ? joined : start),
    planId,
    cycle,
    membershipStart: toISODate(recent && joined.getTime() > start.getTime() ? joined : start),
    membershipEnd: toISODate(end),
    autoRenew: kind === "active" && cycle !== "pack",
    entriesLeft: kind === "pack" ? random.int(1, 9) : null,
    suspended: kind === "suspended",
    medicalCertExpiry: certExpiry,
    marketingConsent: random.chance(0.45),
    imageConsent: random.chance(0.3),
  };
}

/** Socio dell'area demo: abbonamento completo attivo e certificato in scadenza. */
function demoMember(today: Date): Member {
  return {
    id: DEMO_MEMBER_ID,
    code: "RC-1007",
    firstName: "Chiara",
    lastName: "Colombo",
    email: "chiara.colombo@example.com",
    phone: "+39 333 000 1234",
    joinedAt: toISODate(subMonths(today, 14)),
    planId: "completo",
    cycle: "monthly",
    membershipStart: toISODate(subDays(today, 9)),
    membershipEnd: toISODate(addDays(today, 21)),
    autoRenew: true,
    entriesLeft: null,
    suspended: false,
    medicalCertExpiry: toISODate(addDays(today, 18)),
    marketingConsent: false,
    imageConsent: false,
  };
}

export function createDemoData(now: Date): DataSnapshot {
  const random = createRandom(SEED);
  const settings = structuredClone(DEMO_SETTINGS);
  const today = startOfDay(now);
  const nowMs = now.getTime();

  // --- Soci ---------------------------------------------------------------------
  const members: Member[] = [demoMember(today)];
  for (let i = 2; i <= 96; i += 1) members.push(makeMember(random, i, today));
  const planById = new Map(PLANS.map((p) => [p.id, p]));
  const classMembers = members.filter(
    (m) => planById.get(m.planId)?.includesClasses && !m.suspended,
  );

  // --- Lezioni e prenotazioni ------------------------------------------------------
  const sessions = generateSessions(WEEKLY_SLOTS, COURSES, subDays(today, 21), 35);
  const bookings: Booking[] = [];
  const trials: TrialRequest[] = [];
  let seq = 0;

  // Prenotazioni del socio demo: al massimo una lezione al giorno, due o tre a
  // settimana nello storico e qualcuna nei prossimi giorni.
  const demoPicks = new Set<string>();
  const demoDays = new Set<string>();
  for (const session of sessions) {
    const start = new Date(session.start).getTime();
    const daysAhead = Math.floor((start - today.getTime()) / 86_400_000);
    const day = session.id.slice(-8);
    if (demoDays.has(day) || !["yoga", "functional", "cycle"].includes(session.courseId)) continue;
    const pastPick = daysAhead < 0 && random.chance(0.4);
    const futurePick =
      daysAhead >= 1 && daysAhead <= 4 && start > nowMs && session.courseId !== "cycle";
    if (pastPick || futurePick) {
      demoPicks.add(session.id);
      demoDays.add(day);
    }
  }

  for (const session of sessions) {
    const start = new Date(session.start).getTime();
    const past = start + session.durationMin * 60_000 <= nowMs;
    const daysAhead = (start - nowMs) / 86_400_000;
    const popular = ["cycle", "hiit", "functional", "yoga"].includes(session.courseId);
    const evening = new Date(session.start).getHours() >= 18;
    let fill = past
      ? random.int(45, 95) / 100
      : Math.max(0.15, (random.int(55, 105) - daysAhead * 9) / 100);
    if (popular && evening) fill += 0.25;
    const taken = Math.min(session.capacity, Math.round(session.capacity * fill));

    const pool = classMembers.filter((m) => m.id !== DEMO_MEMBER_ID);
    const chosen = new Set<string>();
    if (demoPicks.has(session.id)) chosen.add(DEMO_MEMBER_ID);
    while (chosen.size < taken && chosen.size < pool.length) chosen.add(random.pick(pool).id);

    for (const memberId of chosen) {
      seq += 1;
      bookings.push({
        id: `b_${seq.toString(36)}`,
        sessionId: session.id,
        memberId,
        status: past ? (random.chance(0.88) ? "attended" : "no_show") : "booked",
        // Mai nel futuro: le prenotazioni sono già state fatte.
        createdAt: new Date(
          Math.min(start - random.int(2, 6 * 24) * 3_600_000, nowMs - random.int(5, 600) * 60_000),
        ).toISOString(),
      });
    }
    // Lezioni piene in arrivo: qualche socio in lista d'attesa.
    if (!past && taken >= session.capacity && random.chance(0.8)) {
      const queue = random.int(1, 3);
      for (let q = 0; q < queue; q += 1) {
        const candidate = random.pick(pool);
        if (chosen.has(candidate.id)) continue;
        chosen.add(candidate.id);
        seq += 1;
        bookings.push({
          id: `b_${seq.toString(36)}`,
          sessionId: session.id,
          memberId: candidate.id,
          status: "waitlist",
          createdAt: new Date(
            Math.min(start - (20 - q) * 3_600_000, nowMs - (8 - q) * 3_600_000),
          ).toISOString(),
        });
      }
    }
  }

  // Il socio demo è in lista d'attesa per la lezione più richiesta dei prossimi giorni
  // (riempita fino all'ultimo posto se necessario).
  const candidates = sessions
    .filter((s) => {
      const start = new Date(s.start).getTime();
      return (
        start > nowMs + 86_400_000 &&
        start < nowMs + 4 * 86_400_000 &&
        !bookings.some((b) => b.sessionId === s.id && b.memberId === DEMO_MEMBER_ID)
      );
    })
    .sort((a, b) => sessionStats(b, bookings).taken - sessionStats(a, bookings).taken);
  const target = candidates[0];
  if (target) {
    const inside = new Set(
      bookings.filter((b) => b.sessionId === target.id).map((b) => b.memberId),
    );
    const pool = classMembers.filter((m) => m.id !== DEMO_MEMBER_ID && !inside.has(m.id));
    let free = sessionStats(target, bookings).free;
    for (let i = 0; free > 0 && i < pool.length; i += 1) {
      seq += 1;
      free -= 1;
      bookings.push({
        id: `b_${seq.toString(36)}`,
        sessionId: target.id,
        memberId: pool[i]!.id,
        status: "booked",
        createdAt: new Date(nowMs - (30 + i) * 3_600_000).toISOString(),
      });
    }
    seq += 1;
    bookings.push({
      id: `b_${seq.toString(36)}`,
      sessionId: target.id,
      memberId: DEMO_MEMBER_ID,
      status: "waitlist",
      createdAt: new Date(nowMs - 3 * 3_600_000).toISOString(),
    });
  }

  // --- Ingressi -----------------------------------------------------------------------
  const checkIns: CheckIn[] = [];
  const entryMembers = members.filter((m) => !m.suspended && m.id !== DEMO_MEMBER_ID);
  for (let offset = 21; offset >= 0; offset -= 1) {
    const day = subDays(today, offset);
    const opening = openingFor(settings.hours, day);
    if (!opening?.open) continue;
    const from = timeToMinutes(opening.from);
    const to = timeToMinutes(opening.to) - 30;
    const weekend = day.getDay() === 0 || day.getDay() === 6;
    const total = weekend ? random.int(25, 45) : random.int(60, 95);
    const seen = new Set<string>();
    for (let i = 0; i < total; i += 1) {
      // Fasce più frequentate: mattina presto, pausa pranzo, sera.
      const band = random.weighted([
        [[from, from + 120], 3],
        [[12 * 60, 14 * 60], 2],
        [[17 * 60 + 30, to], 5],
        [[from, to], 2],
      ] as const);
      const minutes = random.int(Math.max(from, band[0]), Math.min(to, Math.max(band[0], band[1])));
      const at = addMinutes(day, minutes);
      if (at.getTime() > nowMs) continue;
      const member = random.pick(entryMembers);
      if (seen.has(member.id)) continue;
      seen.add(member.id);
      checkIns.push({ id: `c_${checkIns.length + 1}`, memberId: member.id, at: at.toISOString() });
    }
  }
  // Il socio demo entra in palestra 10 minuti prima di ogni lezione frequentata.
  for (const booking of bookings) {
    if (booking.memberId !== DEMO_MEMBER_ID || booking.status !== "attended") continue;
    const session = sessions.find((x) => x.id === booking.sessionId);
    if (!session) continue;
    const at = new Date(new Date(session.start).getTime() - 10 * 60_000);
    checkIns.push({
      id: `c_${checkIns.length + 1}`,
      memberId: DEMO_MEMBER_ID,
      at: at.toISOString(),
    });
  }
  checkIns.sort((a, b) => a.at.localeCompare(b.at));

  // --- Pagamenti ---------------------------------------------------------------------
  const payments: Payment[] = [];
  for (const member of members) {
    const plan = planById.get(member.planId);
    if (!plan) continue;
    const periods = member.cycle === "monthly" ? 3 : 1;
    for (let p = 0; p < periods; p += 1) {
      const date = subMonths(parseISODate(member.membershipStart), p);
      if (date.getTime() > nowMs) continue;
      const failed = p === 0 && member.cycle === "monthly" && random.chance(0.03);
      payments.push({
        id: `p_${payments.length + 1}`,
        memberId: member.id,
        planId: plan.id,
        amount: cyclePrice(plan, member.cycle),
        date: toISODate(date),
        description:
          member.cycle === "annual"
            ? `${plan.name} · annuale`
            : member.cycle === "pack"
              ? plan.name
              : `${plan.name} · mensile`,
        status: failed ? "failed" : "paid",
        method:
          member.cycle === "pack"
            ? random.pick(["card", "cash"] as const)
            : random.pick(["card", "sepa"] as const),
      });
    }
  }
  payments.sort((a, b) => b.date.localeCompare(a.date));

  // --- Prove gratuite ----------------------------------------------------------------
  const interests = ["forza", "cardio", "mente_corpo", "ritmo", "sala_pesi"] as const;
  for (let i = 0; i < 14; i += 1) {
    const created = new Date(nowMs - random.int(1, 14 * 24) * 3_600_000);
    const recent = nowMs - created.getTime() < 3 * 86_400_000;
    const firstName = random.pick(FIRST_NAMES);
    const lastName = random.pick(LAST_NAMES);
    const upcoming = sessions.filter((s) => {
      const ms = new Date(s.start).getTime();
      return ms > nowMs && ms < nowMs + 5 * 86_400_000 && !sessionStats(s, bookings, trials).full;
    });
    const session =
      recent && upcoming.length > 0 && random.chance(0.7) ? random.pick(upcoming) : null;
    trials.push({
      id: `t_${i + 1}`,
      name: `${firstName} ${lastName}`,
      email: `${slug(firstName)}.${slug(lastName)}.prova${i}@example.com`,
      phone: `+39 34${random.int(0, 9)} 000 ${String(random.int(1000, 9999))}`,
      interest: random.pick(interests),
      sessionId: session?.id ?? null,
      status: recent
        ? random.weighted([
            ["new", 3],
            ["contacted", 1],
          ] as const)
        : random.weighted([
            ["converted", 2],
            ["lost", 2],
            ["contacted", 1],
          ] as const),
      marketingConsent: random.chance(0.5),
      createdAt: created.toISOString(),
    });
  }
  trials.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    courses: structuredClone(COURSES),
    instructors: structuredClone(INSTRUCTORS),
    slots: structuredClone(WEEKLY_SLOTS),
    sessions,
    plans: structuredClone(PLANS),
    members,
    bookings,
    checkIns,
    payments,
    trials,
    settings,
  };
}

/** Dati statici per il rendering sul server del sito pubblico (SEO). */
export const STATIC_SITE = {
  courses: COURSES,
  instructors: INSTRUCTORS,
  slots: WEEKLY_SLOTS,
  plans: PLANS,
  settings: DEMO_SETTINGS,
};
