import { addDays, addMinutes, startOfDay, subMinutes } from "date-fns";
import { assignTable } from "@/lib/domain/booking";
import { servicesOn, timeToMinutes } from "@/lib/domain/hours";
import type {
  Allergen,
  DataSnapshot,
  DiningTable,
  Dish,
  MenuCategory,
  Order,
  OrderItem,
  Reservation,
  ReservationStatus,
  RestaurantSettings,
} from "@/lib/domain/types";
import { createRandom, type Random } from "./random";

/**
 * Dati demo di "Osteria Lume", locale inventato.
 * Generati in modo deterministico rispetto alla data: la demo mostra sempre
 * prenotazioni e ordini attuali. Contatti fittizi (example.com, numeri con "000").
 */

const SEED = 20261021;

export const DEMO_SETTINGS: RestaurantSettings = {
  name: "Osteria Lume",
  tagline: "Cucina emiliana di stagione, pasta tirata a mano e vini naturali.",
  description:
    "Un'osteria contemporanea nel centro di Bologna: ricette di famiglia, prodotti dell'Appennino e una cantina di vignaioli indipendenti.",
  address: "Via dell'Esempio 8",
  postalCode: "40125",
  city: "Bologna",
  phone: "+39 051 000 0101",
  email: "ciao@osterialume.example",
  vatNumber: "IT00000000000",
  hours: [
    {
      day: 1,
      lunch: { open: false, from: "12:30", to: "14:30" },
      dinner: { open: false, from: "19:00", to: "23:00" },
    },
    {
      day: 2,
      lunch: { open: false, from: "12:30", to: "14:30" },
      dinner: { open: true, from: "19:00", to: "23:00" },
    },
    {
      day: 3,
      lunch: { open: true, from: "12:30", to: "14:30" },
      dinner: { open: true, from: "19:00", to: "23:00" },
    },
    {
      day: 4,
      lunch: { open: true, from: "12:30", to: "14:30" },
      dinner: { open: true, from: "19:00", to: "23:00" },
    },
    {
      day: 5,
      lunch: { open: true, from: "12:30", to: "14:30" },
      dinner: { open: true, from: "19:00", to: "23:30" },
    },
    {
      day: 6,
      lunch: { open: true, from: "12:30", to: "15:00" },
      dinner: { open: true, from: "19:00", to: "23:30" },
    },
    {
      day: 7,
      lunch: { open: true, from: "12:30", to: "15:00" },
      dinner: { open: false, from: "19:00", to: "23:00" },
    },
  ],
  booking: {
    enabled: true,
    slotMinutes: 30,
    durationMin: 105,
    maxPartySize: 8,
    leadTimeMin: 60,
    lastSeatingBeforeCloseMin: 60,
  },
  delivery: {
    enabled: true,
    takeawayEnabled: true,
    minOrder: 2000,
    fee: 300,
    freeAbove: 4000,
    prepMinutes: 25,
    deliveryMinutes: 20,
    postalCodes: ["40121", "40122", "40123", "40124", "40125", "40126", "40127"],
  },
};

const CATEGORIES: MenuCategory[] = [
  { id: "antipasti", name: "Antipasti", position: 1 },
  { id: "primi", name: "Primi", position: 2 },
  { id: "secondi", name: "Secondi", position: 3 },
  { id: "contorni", name: "Contorni", position: 4 },
  { id: "dolci", name: "Dolci", position: 5 },
  { id: "bevande", name: "Vini e bevande", position: 6 },
];

type DishSeed = [
  category: string,
  name: string,
  description: string,
  euros: number,
  allergens: Allergen[],
  flags?: {
    vegetarian?: boolean;
    vegan?: boolean;
    spicy?: boolean;
    orderable?: boolean;
    featured?: boolean;
  },
];

const DISHES: DishSeed[] = [
  [
    "antipasti",
    "Tagliere di salumi e crescentine",
    "Mortadella, prosciutto di Parma 24 mesi, salame rosa e crescentine calde.",
    16,
    ["glutine", "latte"],
  ],
  [
    "antipasti",
    "Burrata, pomodori confit e basilico",
    "Burrata pugliese, pomodorini canditi al forno, olio extravergine.",
    12,
    ["latte"],
    { vegetarian: true },
  ],
  [
    "antipasti",
    "Flan di parmigiano e crema di zucca",
    "Parmigiano Reggiano 30 mesi, zucca mantovana e semi tostati.",
    11,
    ["latte", "uova"],
    { vegetarian: true, featured: true },
  ],
  [
    "antipasti",
    "Carpaccio di manzo, rucola e scaglie",
    "Manzo marinato, rucola selvatica, scaglie di parmigiano e senape dolce.",
    14,
    ["latte", "senape"],
  ],
  [
    "antipasti",
    "Hummus di ceci e verdure croccanti",
    "Ceci, tahina, verdure di stagione e pane carasau.",
    10,
    ["glutine", "sesamo"],
    { vegan: true },
  ],
  [
    "primi",
    "Tortellini in brodo di cappone",
    "Tortellini chiusi a mano, ripieno tradizionale, brodo di cappone e manzo.",
    16,
    ["glutine", "uova", "latte", "sedano"],
    { featured: true },
  ],
  [
    "primi",
    "Tagliatelle al ragù",
    "Tagliatelle tirate al mattarello e ragù bolognese cotto sei ore.",
    14,
    ["glutine", "uova", "sedano", "solfiti"],
    { featured: true },
  ],
  [
    "primi",
    "Passatelli asciutti, funghi e timo",
    "Passatelli al parmigiano, funghi porcini dell'Appennino.",
    15,
    ["glutine", "uova", "latte"],
    { vegetarian: true },
  ],
  [
    "primi",
    "Tortelloni di ricotta, burro e salvia",
    "Ricotta vaccina, prezzemolo, burro di malga e salvia.",
    14,
    ["glutine", "uova", "latte"],
    { vegetarian: true },
  ],
  [
    "primi",
    "Risotto alla zucca e amaretti",
    "Carnaroli mantecato, zucca, amaretti sbriciolati.",
    15,
    ["latte", "frutta_a_guscio", "sedano", "solfiti"],
    { vegetarian: true },
  ],
  [
    "primi",
    "Spaghetti alle vongole",
    "Vongole veraci, aglio, prezzemolo e peperoncino.",
    17,
    ["glutine", "molluschi"],
    { spicy: true },
  ],
  [
    "primi",
    "Gnocchi al pomodoro e basilico",
    "Gnocchi di patate senza uova, pomodoro San Marzano.",
    12,
    ["glutine"],
    { vegan: true },
  ],
  [
    "secondi",
    "Cotoletta alla bolognese",
    "Vitello impanato, prosciutto crudo, parmigiano fuso e brodo.",
    20,
    ["glutine", "uova", "latte"],
  ],
  [
    "secondi",
    "Guancia di manzo al Sangiovese",
    "Cotta a bassa temperatura, purè di patate al burro.",
    22,
    ["latte", "solfiti", "sedano"],
    { featured: true },
  ],
  [
    "secondi",
    "Filetto di branzino e verdure",
    "Branzino scottato, verdure di stagione, emulsione al limone.",
    21,
    ["pesce"],
  ],
  [
    "secondi",
    "Polpette al sugo della nonna",
    "Manzo e maiale, pane raffermo, sugo di pomodoro.",
    15,
    ["glutine", "uova", "latte", "sedano"],
  ],
  [
    "secondi",
    "Parmigiana di melanzane",
    "Melanzane fritte, pomodoro, fiordilatte e basilico.",
    14,
    ["glutine", "uova", "latte"],
    { vegetarian: true },
  ],
  [
    "secondi",
    "Tofu marinato, verdure e sesamo",
    "Tofu alla soia, verdure saltate, peperoncino fresco.",
    15,
    ["soia", "sesamo"],
    { vegan: true, spicy: true },
  ],
  [
    "contorni",
    "Patate al forno e rosmarino",
    "Patate di Montese, rosmarino e sale grosso.",
    5,
    [],
    { vegan: true },
  ],
  [
    "contorni",
    "Verdure grigliate",
    "Zucchine, melanzane e peperoni alla piastra.",
    6,
    [],
    { vegan: true },
  ],
  [
    "contorni",
    "Insalata dell'orto",
    "Insalate miste, finocchio, ravanelli.",
    5,
    [],
    { vegan: true },
  ],
  [
    "dolci",
    "Zuppa inglese",
    "Crema pasticcera, cioccolato e savoiardi all'alchermes.",
    7,
    ["glutine", "uova", "latte", "solfiti"],
    { vegetarian: true },
  ],
  [
    "dolci",
    "Torta di riso bolognese",
    "Riso, latte, mandorle e liquore all'amaretto.",
    6,
    ["uova", "latte", "frutta_a_guscio"],
    { vegetarian: true },
  ],
  [
    "dolci",
    "Tiramisù della casa",
    "Mascarpone, caffè espresso, savoiardi.",
    7,
    ["glutine", "uova", "latte"],
    { vegetarian: true, featured: true },
  ],
  [
    "dolci",
    "Sorbetto al limone",
    "Limoni di Sicilia, senza latte né uova.",
    5,
    [],
    { vegan: true },
  ],
  ["bevande", "Acqua minerale 75 cl", "Naturale o frizzante.", 3, [], { vegan: true }],
  [
    "bevande",
    "Lambrusco di Sorbara (calice)",
    "Rifermentato in bottiglia, fresco e sapido.",
    6,
    ["solfiti"],
    { vegetarian: true, orderable: false },
  ],
  [
    "bevande",
    "Sangiovese di Romagna (calice)",
    "Rosso di collina, affinato in botte grande.",
    6,
    ["solfiti"],
    { vegetarian: true, orderable: false },
  ],
  [
    "bevande",
    "Birra artigianale 33 cl",
    "Bionda non filtrata di un birrificio della provincia.",
    6,
    ["glutine"],
    // Alcolici non ordinabili online: la consegna richiede la verifica dell'età.
    { vegetarian: true, orderable: false },
  ],
  [
    "bevande",
    "Caffè espresso",
    "Miscela di arabica tostata a Bologna.",
    2,
    [],
    { vegan: true, orderable: false },
  ],
];

const TABLES: DiningTable[] = [
  { id: "t1", name: "1", seats: 2, zone: "sala", shape: "round", x: 1, y: 1 },
  { id: "t2", name: "2", seats: 2, zone: "sala", shape: "round", x: 2, y: 1 },
  { id: "t3", name: "3", seats: 4, zone: "sala", shape: "square", x: 3, y: 1 },
  { id: "t4", name: "4", seats: 4, zone: "sala", shape: "square", x: 4, y: 1 },
  { id: "t5", name: "5", seats: 6, zone: "sala", shape: "rect", x: 1, y: 2 },
  { id: "t6", name: "6", seats: 4, zone: "sala", shape: "square", x: 3, y: 2 },
  { id: "t7", name: "7", seats: 2, zone: "sala", shape: "round", x: 4, y: 2 },
  { id: "t8", name: "8", seats: 4, zone: "sala", shape: "square", x: 1, y: 3 },
  { id: "t9", name: "9", seats: 4, zone: "sala", shape: "square", x: 2, y: 3 },
  { id: "t10", name: "10", seats: 6, zone: "sala", shape: "rect", x: 3, y: 3 },
  { id: "d1", name: "D1", seats: 2, zone: "dehors", shape: "round", x: 1, y: 1 },
  { id: "d2", name: "D2", seats: 2, zone: "dehors", shape: "round", x: 2, y: 1 },
  { id: "d3", name: "D3", seats: 4, zone: "dehors", shape: "square", x: 3, y: 1 },
  { id: "d4", name: "D4", seats: 4, zone: "dehors", shape: "square", x: 4, y: 1 },
  { id: "p1", name: "P1", seats: 10, zone: "prive", shape: "rect", x: 1, y: 1 },
];

const FIRST_NAMES = [
  "Alessandro",
  "Beatrice",
  "Carlo",
  "Chiara",
  "Davide",
  "Elena",
  "Federico",
  "Francesca",
  "Giorgio",
  "Giulia",
  "Ilaria",
  "Leonardo",
  "Lucia",
  "Marco",
  "Martina",
  "Matteo",
  "Nicola",
  "Paola",
  "Pietro",
  "Roberta",
  "Sara",
  "Simone",
  "Sofia",
  "Tommaso",
  "Valentina",
  "Veronica",
];
const LAST_NAMES = [
  "Amadori",
  "Bertoni",
  "Bianchi",
  "Cavazza",
  "Fabbri",
  "Ferrari",
  "Gallerani",
  "Guidi",
  "Lambertini",
  "Malaguti",
  "Manfredi",
  "Montanari",
  "Neri",
  "Pancaldi",
  "Pasquali",
  "Righi",
  "Rossi",
  "Sarti",
  "Tagliavini",
  "Venturi",
  "Zanotti",
];
const NOTES = [
  "Anniversario",
  "Allergia alle noci",
  "Seggiolone per bambino",
  "Tavolo tranquillo, se possibile",
  "Celiaca",
];

function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

function person(random: Random) {
  const first = random.pick(FIRST_NAMES);
  const last = random.pick(LAST_NAMES);
  return {
    name: `${first} ${last}`,
    phone: `+39 3${random.int(20, 49)} 000 ${String(random.int(0, 9999)).padStart(4, "0")}`,
    email: `${slug(first)}.${slug(last)}@example.com`,
  };
}

function code(random: Random): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let value = "";
  for (let i = 0; i < 4; i += 1) value += alphabet[Math.floor(random.next() * alphabet.length)];
  return `LU-${value}`;
}

function partySize(random: Random): number {
  return random.weighted([
    [2, 46],
    [3, 10],
    [4, 26],
    [5, 6],
    [6, 7],
    [8, 3],
    [10, 2],
  ]);
}

/** Menu statico (indipendente dalla data): usato anche per il rendering lato server. */
export function createMenu(): { categories: MenuCategory[]; dishes: Dish[] } {
  const dishes: Dish[] = DISHES.map(
    ([categoryId, name, description, euros, allergens, flags = {}], i) => ({
      id: `ds_${i + 1}`,
      categoryId,
      name,
      description,
      price: euros * 100,
      allergens,
      vegetarian: Boolean(flags.vegetarian || flags.vegan),
      vegan: Boolean(flags.vegan),
      spicy: Boolean(flags.spicy),
      available: true,
      orderable: flags.orderable ?? true,
      featured: Boolean(flags.featured),
    }),
  );
  return { categories: CATEGORIES, dishes };
}

export const STATIC_MENU = createMenu();
export const DEMO_TABLES = TABLES;

export function createDemoData(now: Date): DataSnapshot {
  const random = createRandom(SEED);
  const settings = structuredClone(DEMO_SETTINGS);
  const today = startOfDay(now);
  const nowMs = now.getTime();

  const { dishes } = createMenu();
  // Un piatto esaurito oggi, per mostrare lo stato nel menu.
  const soldOut = dishes.find((d) => d.name.startsWith("Passatelli"));
  if (soldOut) soldOut.available = false;

  // --- Prenotazioni ---------------------------------------------------------
  const reservations: Reservation[] = [];
  let reservationSeq = 0;
  const { durationMin, slotMinutes } = settings.booking;

  for (let offset = -21; offset <= 14; offset += 1) {
    const day = addDays(today, offset);
    const weekend = day.getDay() === 5 || day.getDay() === 6;
    for (const { kind, window } of servicesOn(settings.hours, day)) {
      const from = timeToMinutes(window.from);
      const last = timeToMinutes(window.to) - settings.booking.lastSeatingBeforeCloseMin;
      // Riempimento: più pieno a cena e nel weekend, più vuoto nei giorni lontani.
      let load = kind === "dinner" ? 0.8 : 0.55;
      if (weekend) load += 0.18;
      if (offset > 2) load *= Math.max(0.25, 1 - offset / 16);
      for (let minutes = from; minutes <= last; minutes += slotMinutes) {
        const attempts = minutes - from < 90 ? 4 : 2;
        for (let a = 0; a < attempts; a += 1) {
          if (!random.chance(load * 0.5)) continue;
          const start = addMinutes(day, minutes);
          const size = partySize(random);
          const table = assignTable(TABLES, reservations, start, durationMin, size);
          if (!table) continue;
          const startMs = start.getTime();
          const endMs = startMs + durationMin * 60_000;
          let status: ReservationStatus;
          if (endMs <= nowMs) {
            status = random.weighted([
              ["completed", 90],
              ["no_show", 4],
              ["cancelled", 6],
            ]);
          } else if (startMs <= nowMs) {
            status = "seated";
          } else {
            status = random.weighted([
              ["confirmed", 78],
              ["requested", 17],
              ["cancelled", 5],
            ]);
          }
          const who = person(random);
          reservationSeq += 1;
          const source = random.weighted([
            ["online", 56],
            ["phone", 40],
            ["walk_in", startMs <= nowMs ? 8 : 0],
          ] as const);
          reservations.push({
            id: `rs_${reservationSeq.toString(36)}`,
            code: code(random),
            ...who,
            partySize: size,
            start: start.toISOString(),
            durationMin,
            status,
            tableId: status === "requested" && random.chance(0.5) ? null : table.id,
            source,
            notes: random.chance(0.12) ? random.pick(NOTES) : undefined,
            marketingConsent: random.chance(0.4),
            createdAt: subMinutes(start, random.int(60 * 3, 60 * 24 * 9)).toISOString(),
          });
        }
      }
    }
  }

  // --- Ordini -----------------------------------------------------------------
  const orderable = dishes.filter((d) => d.orderable && d.categoryId !== "bevande");
  const drinks = dishes.filter((d) => d.orderable && d.categoryId === "bevande");
  const draft: Omit<Order, "number">[] = [];

  const makeItems = (): OrderItem[] => {
    const lines = new Map<string, OrderItem>();
    const count = random.int(1, 4);
    for (let i = 0; i < count; i += 1) {
      const dish = random.pick(orderable);
      const existing = lines.get(dish.id);
      if (existing) existing.quantity += 1;
      else
        lines.set(dish.id, {
          dishId: dish.id,
          name: dish.name,
          price: dish.price,
          quantity: random.int(1, 2),
        });
    }
    if (random.chance(0.4)) {
      const drink = random.pick(drinks);
      lines.set(drink.id, {
        dishId: drink.id,
        name: drink.name,
        price: drink.price,
        quantity: random.int(1, 3),
      });
    }
    return [...lines.values()];
  };

  const makeOrder = (
    scheduled: Date,
    status: Order["status"],
    createdAt: Date,
  ): Omit<Order, "number"> => {
    const type = random.chance(0.6) ? "delivery" : "takeaway";
    const items = makeItems();
    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const deliveryFee =
      type === "delivery" && subtotal < settings.delivery.freeAbove ? settings.delivery.fee : 0;
    const who = person(random);
    return {
      id: `or_${(draft.length + 1).toString(36)}`,
      type,
      status,
      items,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      customer: who,
      address:
        type === "delivery"
          ? {
              street: `Via ${random.pick(["Saragozza", "Mazzini", "Castiglione", "San Vitale", "Andrea Costa", "Murri"])} ${random.int(1, 140)}`,
              postalCode: random.pick(settings.delivery.postalCodes),
              city: "Bologna",
              notes: random.chance(0.3) ? `Citofono ${who.name.split(" ")[1]}` : undefined,
            }
          : null,
      scheduledFor: scheduled.toISOString(),
      payment: random.weighted([
        ["card_on_delivery", 45],
        ["online", 35],
        ["cash", 20],
      ] as const),
      createdAt: createdAt.toISOString(),
    };
  };

  for (let offset = -21; offset <= 0; offset += 1) {
    const day = addDays(today, offset);
    for (const { window } of servicesOn(settings.hours, day)) {
      const from = timeToMinutes(window.from) + 30;
      const to = timeToMinutes(window.to);
      const count = random.int(3, 9);
      for (let i = 0; i < count; i += 1) {
        const scheduled = addMinutes(day, Math.floor(random.int(from, to) / 15) * 15);
        if (scheduled.getTime() > nowMs - 60 * 60_000) continue;
        const status = random.chance(0.95) ? "completed" : "cancelled";
        draft.push(makeOrder(scheduled, status, subMinutes(scheduled, random.int(35, 90))));
      }
    }
  }

  // Ordini "dal vivo": servizio in corso o prossimo servizio di oggi.
  const services = servicesOn(settings.hours, today);
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const current = services.find(
    ({ window }) =>
      minutesNow >= timeToMinutes(window.from) && minutesNow < timeToMinutes(window.to),
  );
  const upcoming = services.find(({ window }) => timeToMinutes(window.from) > minutesNow);
  if (current) {
    const statuses: Order["status"][] = [
      "new",
      "new",
      "preparing",
      "preparing",
      "ready",
      "out_for_delivery",
    ];
    statuses.forEach((status, i) => {
      const scheduled = addMinutes(now, 20 + i * 10 - (status === "out_for_delivery" ? 25 : 0));
      scheduled.setMinutes(Math.ceil(scheduled.getMinutes() / 5) * 5, 0, 0);
      const order = makeOrder(scheduled, status, subMinutes(now, 4 + i * 6));
      if (status === "out_for_delivery") order.type = "delivery";
      draft.push(order);
    });
  } else if (upcoming) {
    const start = timeToMinutes(upcoming.window.from);
    [45, 60, 75].forEach((delta, i) => {
      const scheduled = addMinutes(today, start + delta);
      draft.push(makeOrder(scheduled, "new", subMinutes(now, 15 + i * 40)));
    });
  }

  draft.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const orders: Order[] = draft.map((order, i) => ({ ...order, number: String(1001 + i) }));

  return {
    categories: CATEGORIES,
    dishes,
    tables: TABLES,
    reservations,
    orders,
    settings,
  };
}
