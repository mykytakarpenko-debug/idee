import { addDays, addHours, addMinutes, startOfDay } from "date-fns";
import { cartTotals } from "@/lib/domain/cart";
import { shiftISODate, toISODate } from "@/lib/domain/dates";
import { orderNumber, refundAmount } from "@/lib/domain/orders";
import { priceOn } from "@/lib/domain/pricing";
import type {
  ArtKind,
  Category,
  Coupon,
  Customer,
  DataSnapshot,
  ISODate,
  Order,
  OrderEvent,
  OrderLine,
  OrderStatus,
  PaymentMethod,
  Product,
  Review,
  Seller,
  ShippingMethod,
  ShopSettings,
} from "@/lib/domain/types";
import { createRandom, type Random } from "./random";

/**
 * Dati demo di "Materia", negozio inventato di oggetti artigianali.
 * Deterministici (stesso seme, stessa data → stessi dati): date relative a oggi,
 * così promozioni, ordini e resi restano attuali in ogni momento.
 * Persone, aziende, partite IVA e indirizzi sono inventati.
 */

const SEED = 20_260_521;

export const DEMO_SETTINGS: ShopSettings = {
  name: "Materia",
  tagline: "Oggetti fatti a mano per la casa, da piccoli laboratori italiani.",
  description:
    "Ceramiche, tessili, legno, carta e candele da cinque laboratori artigiani: un solo carrello, spedizione in tutta Italia e resi semplici.",
  legal: {
    company: "Materia S.r.l.",
    vatNumber: "IT00000000000",
    rea: "BO-000000",
    address: "Via dell'Esempio 12, 40121 Bologna (BO)",
    email: "ciao@materia.example",
    pec: "materia@pec.example",
    phone: "+39 051 000 0012",
  },
  shipping: {
    standard: 590,
    express: 990,
    freeThreshold: 6900,
    pickupEnabled: true,
    pickupAddress: "Via dell'Esempio 12, Bologna · dal martedì al sabato, 10–19",
  },
  vatRate: 0.22,
  returnDays: 14,
  lowStockThreshold: 3,
  coupons: [],
};

/** Codici sconto demo (le scadenze dipendono da oggi). */
function demoCoupons(today: ISODate): Coupon[] {
  return [
    {
      code: "BENVENUTO10",
      type: "percent",
      value: 10,
      minSubtotal: 3000,
      expiresAt: null,
      active: true,
    },
    {
      code: "SPEDIZIONEGRATIS",
      type: "free_shipping",
      value: 0,
      minSubtotal: 4000,
      expiresAt: shiftISODate(today, 40),
      active: true,
    },
    { code: "GRAZIE5", type: "fixed", value: 500, minSubtotal: 5000, expiresAt: null, active: true },
    {
      code: "ESTATE15",
      type: "percent",
      value: 15,
      minSubtotal: 0,
      expiresAt: shiftISODate(today, -50),
      active: true,
    },
  ];
}

export const CATEGORIES: Category[] = [
  {
    id: "ceramiche",
    slug: "ceramiche",
    name: "Ceramiche",
    description: "Tazze, piatti, ciotole e vasi modellati e smaltati a mano.",
  },
  {
    id: "tessili",
    slug: "tessili",
    name: "Tessili",
    description: "Lino e cotone tessuti a telaio per la tavola e la cucina.",
  },
  {
    id: "legno",
    slug: "legno",
    name: "Legno e cucina",
    description: "Taglieri, utensili e vassoi da legni di recupero e certificati.",
  },
  {
    id: "carta",
    slug: "carta",
    name: "Carta e scrittura",
    description: "Taccuini rilegati a mano, quaderni e biglietti.",
  },
  {
    id: "candele",
    slug: "candele",
    name: "Candele",
    description: "Candele in cera vegetale con profumi delicati.",
  },
];

const legal = (company: string, n: number, address: string, email: string) => ({
  company,
  vatNumber: `IT0000000000${n}`,
  address,
  email,
});

export const SELLERS: Seller[] = [
  {
    id: "s_argilla",
    slug: "argilla-lenta",
    name: "Argilla Lenta",
    craft: "Laboratorio di ceramica",
    city: "Faenza",
    since: 2011,
    bio: "Due tornianti e un forno a gas: ogni pezzo è modellato, smaltato e cotto due volte in laboratorio. Le piccole differenze di colore sono il segno del lavoro a mano.",
    legal: legal(
      "Argilla Lenta di M. Ferri",
      1,
      "Via dell'Esempio 3, 48018 Faenza (RA)",
      "ciao@argillalenta.example",
    ),
    commissionRate: 0.15,
    active: true,
  },
  {
    id: "s_trame",
    slug: "trame-di-lino",
    name: "Trame di Lino",
    craft: "Tessitura a telaio",
    city: "Biella",
    since: 2015,
    bio: "Tessiamo lino e cotone su telai degli anni Sessanta, con filati europei tinti senza metalli pesanti. Tagli e cuciture sono fatti uno a uno.",
    legal: legal(
      "Trame di Lino S.n.c.",
      2,
      "Via dell'Esempio 18, 13900 Biella (BI)",
      "telaio@tramedilino.example",
    ),
    commissionRate: 0.15,
    active: true,
  },
  {
    id: "s_legno",
    slug: "bosco-chiaro",
    name: "Bosco Chiaro",
    craft: "Falegnameria",
    city: "Cavalese",
    since: 2008,
    bio: "Lavoriamo noce, ciliegio, faggio e rovere da segherie di valle e da legno di recupero. Finitura con olio alimentare e cera d'api.",
    legal: legal(
      "Bosco Chiaro di L. Dallago",
      3,
      "Via dell'Esempio 7, 38033 Cavalese (TN)",
      "bottega@boscochiaro.example",
    ),
    commissionRate: 0.12,
    active: true,
  },
  {
    id: "s_carta",
    slug: "fogli-sparsi",
    name: "Fogli Sparsi",
    craft: "Legatoria",
    city: "Firenze",
    since: 2017,
    bio: "Cuciamo a mano taccuini e quaderni con carte italiane da 120 g, copertine in carta marmorizzata, tela e pelle conciata al vegetale.",
    legal: legal(
      "Fogli Sparsi S.r.l.s.",
      4,
      "Via dell'Esempio 25, 50122 Firenze (FI)",
      "legatoria@foglisparsi.example",
    ),
    commissionRate: 0.15,
    active: true,
  },
  {
    id: "s_lume",
    slug: "lume-lento",
    name: "Lume Lento",
    craft: "Candele in cera vegetale",
    city: "Bologna",
    since: 2019,
    bio: "Versiamo a mano cera di soia e di colza con stoppini in cotone e oli essenziali. Contenitori riutilizzabili e ricariche su richiesta.",
    legal: legal(
      "Lume Lento di S. Gamberini",
      5,
      "Via dell'Esempio 40, 40124 Bologna (BO)",
      "ciao@lumelento.example",
    ),
    commissionRate: 0.18,
    active: true,
  },
];

const COLOR = {
  salvia: "#8fa58a",
  sabbia: "#d9c4a0",
  notte: "#2f3b4c",
  avorio: "#efe6d6",
  ruggine: "#b5532e",
  latte: "#f1ece2",
  azzurro: "#7da3b8",
  terracotta: "#b8643f",
  rosso: "#b4433a",
  blu: "#3d5a80",
  oliva: "#7a7d3a",
  naturale: "#d8ccb6",
  grigio: "#8d8e8a",
  tabacco: "#8a5a36",
  noce: "#6b4a32",
  ciliegio: "#a0623f",
  olivo: "#b08a5a",
  faggio: "#c99a62",
  rovere: "#b8915f",
  ocra: "#c99a3a",
  bosco: "#3f5e4a",
  carminio: "#9c3b32",
  misto: "#d8b26e",
  fico: "#6e4a6b",
  bergamotto: "#d9b44a",
  cedro: "#7a5a3a",
} as const;

interface ProductDef {
  id: string;
  name: string;
  seller: string;
  category: string;
  art: ArtKind;
  short: string;
  description: string;
  details: string[];
  price: number;
  /** Variazioni di prezzo passate: [giorni da oggi, prezzo]. La prima è il lancio. */
  history: [number, number][];
  /** Promozione in corso: [prezzo, dal giorno, al giorno] relativi a oggi. */
  sale?: [number, number, number];
  variants: [name: string, color: string, stock: number][];
  weight: number;
  featured?: boolean;
}

const DEFS: ProductDef[] = [
  {
    id: "tazza-alba",
    name: "Tazza Alba",
    seller: "s_argilla",
    category: "ceramiche",
    art: "mug",
    short: "Tazza da colazione in gres, 350 ml, smalto opaco.",
    description:
      "La tazza della prima ora del giorno: corpo ampio, ansa comoda anche per due dita, bordo sottile. Gres cotto a 1250 °C, smalto opaco all'esterno e lucido all'interno.",
    details: [
      "Gres smaltato, 350 ml",
      "Altezza 9,5 cm, diametro 9 cm",
      "Lavabile in lavastoviglie e utilizzabile nel microonde",
      "Ogni pezzo è unico: colore e forma variano leggermente",
    ],
    price: 2400,
    history: [[-420, 2200], [-180, 2400]],
    variants: [
      ["Salvia", COLOR.salvia, 12],
      ["Sabbia", COLOR.sabbia, 8],
      ["Notte", COLOR.notte, 2],
    ],
    weight: 420,
    featured: true,
  },
  {
    id: "tazzine-sorso",
    name: "Tazzine Sorso, set da due",
    seller: "s_argilla",
    category: "ceramiche",
    art: "cups",
    short: "Due tazzine da caffè in gres, 80 ml.",
    description:
      "Piccole, spesse e calde in mano: tengono il caffè alla temperatura giusta. Vendute in coppia, con lo stesso smalto.",
    details: ["Gres smaltato, 80 ml ciascuna", "Altezza 6 cm", "Lavabili in lavastoviglie"],
    price: 3200,
    // Prezzo già applicato nei 30 giorni precedenti: la promozione non è annunciata come sconto.
    history: [[-260, 3200], [-20, 2800], [-11, 3200]],
    sale: [2800, -3, 18],
    variants: [
      ["Avorio", COLOR.avorio, 10],
      ["Ruggine", COLOR.ruggine, 6],
    ],
    weight: 380,
  },
  {
    id: "piatto-riva",
    name: "Piatto piano Riva",
    seller: "s_argilla",
    category: "ceramiche",
    art: "plate",
    short: "Piatto piano da 27 cm con bordo irregolare.",
    description:
      "Un piatto da tutti i giorni con il bordo lasciato irregolare dal tornio. Il centro ampio valorizza anche i piatti più semplici.",
    details: ["Gres smaltato", "Diametro 27 cm", "Lavabile in lavastoviglie"],
    price: 2600,
    history: [[-380, 2600]],
    variants: [
      ["Bianco latte", COLOR.latte, 20],
      ["Salvia", COLOR.salvia, 9],
    ],
    weight: 650,
  },
  {
    id: "ciotola-onda",
    name: "Ciotola Onda",
    seller: "s_argilla",
    category: "ceramiche",
    art: "bowl",
    short: "Ciotola da 15 cm per zuppe, insalate e colazioni.",
    description:
      "Profonda il giusto, con un'onda leggera sul bordo che la rende facile da tenere. Lo smalto si raccoglie nei solchi del tornio creando sfumature sempre diverse.",
    details: ["Gres smaltato, 600 ml", "Diametro 15 cm, altezza 7 cm", "Lavabile in lavastoviglie"],
    price: 2200,
    history: [[-420, 2000], [-200, 2200], [-6, 1760]],
    sale: [1760, -6, 24],
    variants: [
      ["Azzurro", COLOR.azzurro, 14],
      ["Sabbia", COLOR.sabbia, 11],
      ["Salvia", COLOR.salvia, 0],
    ],
    weight: 480,
    featured: true,
  },
  {
    id: "vaso-colle",
    name: "Vaso Colle",
    seller: "s_argilla",
    category: "ceramiche",
    art: "vase",
    short: "Vaso a collo stretto, 24 cm, per fiori recisi e rami secchi.",
    description:
      "Linee morbide e un collo stretto che sostiene anche pochi steli. Impermeabile all'interno, con fondo in sughero che protegge i mobili.",
    details: ["Gres smaltato, impermeabile", "Altezza 24 cm", "Fondo in sughero naturale"],
    price: 4800,
    history: [[-300, 4800]],
    variants: [
      ["Terracotta", COLOR.terracotta, 5],
      ["Avorio", COLOR.avorio, 3],
    ],
    weight: 900,
    featured: true,
  },
  {
    id: "teiera-quiete",
    name: "Teiera Quiete",
    seller: "s_argilla",
    category: "ceramiche",
    art: "teapot",
    short: "Teiera da 800 ml con filtro in acciaio.",
    description:
      "Per tre o quattro tazze di tè o tisana. Il beccuccio è tagliato a mano per non gocciolare; il filtro in acciaio si toglie per la pulizia.",
    details: ["Gres smaltato, 800 ml", "Filtro in acciaio inox", "Lavare a mano"],
    price: 6400,
    history: [[-240, 6400]],
    variants: [
      ["Notte", COLOR.notte, 4],
      ["Salvia", COLOR.salvia, 0],
    ],
    weight: 1100,
  },
  {
    id: "canovaccio-righe",
    name: "Canovaccio a righe in lino",
    seller: "s_trame",
    category: "tessili",
    art: "towel",
    short: "Canovaccio 50 × 70 cm in lino lavato, assorbente e veloce ad asciugare.",
    description:
      "Lino lavato in pietra, morbido dal primo uso e sempre più assorbente con i lavaggi. Righe tessute (non stampate) e asola per appenderlo.",
    details: ["100% lino", "50 × 70 cm", "Lavaggio a 40 °C"],
    price: 1600,
    // Una promozione breve nei 30 giorni precedenti abbassa il prezzo di riferimento.
    history: [[-500, 1400], [-300, 1600], [-25, 1300], [-18, 1600], [-4, 1200]],
    sale: [1200, -4, 26],
    variants: [
      ["Rosso", COLOR.rosso, 25],
      ["Blu", COLOR.blu, 18],
      ["Oliva", COLOR.oliva, 12],
    ],
    weight: 120,
    featured: true,
  },
  {
    id: "tovaglioli-desco",
    name: "Tovaglioli Desco, set da quattro",
    seller: "s_trame",
    category: "tessili",
    art: "napkins",
    short: "Quattro tovaglioli 45 × 45 cm in lino e cotone.",
    description:
      "Misto lino e cotone, orli cuciti a mano. Non serve stirarli: la piega naturale fa parte del loro carattere.",
    details: ["55% lino, 45% cotone", "45 × 45 cm", "Lavaggio a 40 °C"],
    price: 3400,
    history: [[-330, 3400]],
    variants: [
      ["Naturale", COLOR.naturale, 15],
      ["Grigio", COLOR.grigio, 9],
    ],
    weight: 260,
  },
  {
    id: "grembiule-cucina",
    name: "Grembiule da cucina",
    seller: "s_trame",
    category: "tessili",
    art: "apron",
    short: "Grembiule in tela di cotone con tasca e lacci lunghi.",
    description:
      "Tela pesante di cotone, una tasca ampia e lacci lunghi che si annodano davanti. Taglia unica regolabile.",
    details: ["100% cotone, 320 g/m²", "Taglia unica", "Lavaggio a 40 °C"],
    price: 3800,
    history: [[-280, 3800]],
    variants: [
      ["Tabacco", COLOR.tabacco, 7],
      ["Blu", COLOR.blu, 10],
    ],
    weight: 340,
  },
  {
    id: "tovaglia-desco",
    name: "Tovaglia Desco 150 × 250",
    seller: "s_trame",
    category: "tessili",
    art: "napkins",
    short: "Tovaglia in lino per sei-otto persone.",
    description:
      "Lino lavato e orli a mano, per la tavola di tutti i giorni e per le occasioni. Si abbina ai tovaglioli Desco.",
    details: ["100% lino", "150 × 250 cm", "Lavaggio a 40 °C"],
    price: 7900,
    history: [[-210, 7900]],
    variants: [
      ["Naturale", COLOR.naturale, 6],
      ["Salvia", COLOR.salvia, 2],
    ],
    weight: 780,
  },
  {
    id: "cesto-corda",
    name: "Cesto in corda di cotone",
    seller: "s_trame",
    category: "tessili",
    art: "basket",
    short: "Cesto morbido Ø 30 cm per coperte, giochi e frutta.",
    description:
      "Corda di cotone cucita a spirale: leggero, lavabile e stabile. Le maniglie sono rinforzate.",
    details: ["Corda di cotone", "Diametro 30 cm, altezza 25 cm", "Lavaggio a 30 °C"],
    price: 4200,
    history: [[-160, 4200]],
    variants: [
      ["Naturale", COLOR.naturale, 8],
      ["Tabacco", COLOR.tabacco, 0],
    ],
    weight: 520,
  },
  {
    id: "tagliere-noce",
    name: "Tagliere in noce",
    seller: "s_legno",
    category: "legno",
    art: "board",
    short: "Tagliere 40 × 22 cm da un'unica tavola, con impugnatura.",
    description:
      "Ricavato da un'unica tavola di noce nazionale, con impugnatura forata. Il legno duro non si segna facilmente e protegge il filo dei coltelli.",
    details: [
      "Noce o ciliegio massello",
      "40 × 22 × 2 cm",
      "Finitura con olio alimentare e cera d'api",
      "Lavare a mano, non in lavastoviglie",
    ],
    price: 4500,
    history: [[-400, 4200], [-120, 4500]],
    variants: [
      ["Noce", COLOR.noce, 9],
      ["Ciliegio", COLOR.ciliegio, 4],
    ],
    weight: 1300,
    featured: true,
  },
  {
    id: "tagliere-olivo",
    name: "Tagliere tondo in olivo",
    seller: "s_legno",
    category: "legno",
    art: "board",
    short: "Tagliere Ø 28 cm in legno d'olivo per formaggi e pane.",
    description:
      "Le venature dell'olivo rendono ogni tagliere diverso. Perfetto per servire formaggi, salumi e pane in tavola.",
    details: ["Olivo massello", "Diametro 28 cm", "Lavare a mano e oliare ogni tanto"],
    price: 3900,
    history: [[-350, 3900]],
    variants: [["Olivo", COLOR.olivo, 6]],
    weight: 900,
  },
  {
    id: "cucchiai-faggio",
    name: "Cucchiai in faggio, set da tre",
    seller: "s_legno",
    category: "legno",
    art: "spoons",
    short: "Tre cucchiai da cucina in faggio, 30 cm.",
    description:
      "Cucchiaio tondo, a paletta e forato: i tre gesti di ogni giorno in cucina. Faggio evaporato, leggero e resistente.",
    details: ["Faggio massello", "Lunghezza 30 cm", "Lavare a mano"],
    price: 2400,
    history: [[-450, 2400]],
    variants: [["Faggio", COLOR.faggio, 30]],
    weight: 240,
  },
  {
    id: "vassoio-rovere",
    name: "Vassoio in rovere",
    seller: "s_legno",
    category: "legno",
    art: "tray",
    short: "Vassoio 45 × 30 cm con maniglie incassate.",
    description:
      "Rovere massello con bordo rialzato e maniglie scavate nel legno. Per la colazione a letto o l'aperitivo in terrazza.",
    details: ["Rovere massello", "45 × 30 × 4 cm", "Finitura a olio"],
    price: 5200,
    history: [[-5, 5200]],
    variants: [["Rovere", COLOR.rovere, 6]],
    weight: 1500,
  },
  {
    id: "taccuino-a5",
    name: "Taccuino A5 rilegato a mano",
    seller: "s_carta",
    category: "carta",
    art: "notebook",
    short: "192 pagine a righe, cucitura a vista, si apre piatto.",
    description:
      "Carta avoriata da 120 g che non lascia trasparire l'inchiostro, cucitura copta a vista che permette di aprirlo completamente piatto.",
    details: ["Formato A5 (14,8 × 21 cm)", "192 pagine a righe, carta da 120 g", "Copertina in tela"],
    price: 1800,
    history: [[-390, 1800]],
    variants: [
      ["Ocra", COLOR.ocra, 22],
      ["Verde bosco", COLOR.bosco, 14],
      ["Carminio", COLOR.carminio, 0],
    ],
    weight: 320,
    featured: true,
  },
  {
    id: "quaderno-puntinato",
    name: "Quaderno puntinato",
    seller: "s_carta",
    category: "carta",
    art: "notebook",
    short: "Quaderno A5 a puntini, 96 pagine, copertina morbida.",
    description:
      "Puntini leggeri ogni 5 mm per appunti, schemi e liste. Leggero da portare sempre con sé.",
    details: ["Formato A5", "96 pagine a puntini, carta da 100 g", "Copertina in cartoncino"],
    price: 1400,
    history: [[-300, 1400]],
    variants: [
      ["Sabbia", COLOR.sabbia, 30],
      ["Notte", COLOR.notte, 12],
    ],
    weight: 180,
  },
  {
    id: "biglietti-buste",
    name: "Biglietti e buste, set da otto",
    seller: "s_carta",
    category: "carta",
    art: "cards",
    short: "Otto biglietti piegati con buste in carta riciclata.",
    description:
      "Per auguri, ringraziamenti e due righe scritte a mano. Carta riciclata con fibre visibili e buste coordinate.",
    details: ["8 biglietti 10,5 × 15 cm e 8 buste", "Carta riciclata da 300 g"],
    price: 1200,
    history: [[-260, 1200]],
    variants: [["Assortiti", COLOR.misto, 40]],
    weight: 150,
  },
  {
    id: "diario-viaggio",
    name: "Diario di viaggio in pelle",
    seller: "s_carta",
    category: "carta",
    art: "notebook",
    short: "Copertina in pelle conciata al vegetale con laccio, ricaricabile.",
    description:
      "Una copertina che dura anni e quaderni interni che si sostituiscono. La pelle conciata al vegetale prende il colore del tempo.",
    details: [
      "Pelle conciata al vegetale",
      "Due quaderni interni da 64 pagine",
      "Ricariche disponibili",
    ],
    price: 3600,
    history: [[-200, 3600]],
    variants: [["Cuoio", COLOR.tabacco, 3]],
    weight: 260,
  },
  {
    id: "candela-fico",
    name: "Candela in barattolo",
    seller: "s_lume",
    category: "candele",
    art: "candle",
    short: "Cera di soia, 40 ore di accensione, tre profumi.",
    description:
      "Versata a mano in un barattolo di vetro riutilizzabile, con stoppino in cotone e oli essenziali. Profumo presente ma mai invadente.",
    details: [
      "Cera di soia e oli essenziali, 200 g",
      "Circa 40 ore di accensione",
      "Barattolo in vetro riutilizzabile",
      "Leggi le avvertenze di sicurezza sull'etichetta",
    ],
    price: 2600,
    history: [[-300, 2600], [-2, 2200]],
    sale: [2200, -2, 12],
    variants: [
      ["Fico", COLOR.fico, 18],
      ["Bergamotto", COLOR.bergamotto, 11],
      ["Legno di cedro", COLOR.cedro, 5],
    ],
    weight: 450,
    featured: true,
  },
  {
    id: "candele-affusolate",
    name: "Candele affusolate, set da due",
    seller: "s_lume",
    category: "candele",
    art: "tapers",
    short: "Due candele da tavola alte 25 cm, non profumate.",
    description:
      "Cera di colza colorata con pigmenti naturali, combustione lenta e senza fumo. Per i candelabri di casa.",
    details: ["Cera di colza", "Altezza 25 cm, diametro 2,2 cm", "Circa 8 ore di accensione"],
    price: 1400,
    history: [[-240, 1400]],
    variants: [
      ["Avorio", COLOR.avorio, 24],
      ["Salvia", COLOR.salvia, 16],
      ["Ruggine", COLOR.ruggine, 9],
    ],
    weight: 160,
  },
];

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Prodotti con le date materializzate rispetto a `today`. */
export function buildProducts(today: ISODate): Product[] {
  return DEFS.map((def) => {
    const history = [...def.history]
      .sort((a, b) => a[0] - b[0])
      .map(([offset, price]) => ({ from: shiftISODate(today, offset), price }));
    return {
      id: def.id,
      slug: def.id,
      name: def.name,
      sellerId: def.seller,
      categoryId: def.category,
      art: def.art,
      shortDescription: def.short,
      description: def.description,
      details: def.details,
      price: def.price,
      sale: def.sale
        ? {
            price: def.sale[0],
            from: shiftISODate(today, def.sale[1]),
            to: shiftISODate(today, def.sale[2]),
          }
        : null,
      priceHistory: history,
      variants: def.variants.map(([name, color, stock]) => ({
        id: `${def.id}--${slugify(name)}`,
        name,
        color,
        sku: `${def.id.slice(0, 3).toUpperCase()}-${slugify(name).slice(0, 3).toUpperCase()}`,
        stock,
      })),
      weight: def.weight,
      featured: def.featured ?? false,
      active: true,
      createdAt: history[0]?.from ?? today,
    };
  });
}

// ---------------------------------------------------------------------------
// Recensioni
// ---------------------------------------------------------------------------

const REVIEWERS = [
  "Giulia R.",
  "Marco T.",
  "Elena B.",
  "Francesca M.",
  "Luca P.",
  "Sara G.",
  "Andrea C.",
  "Chiara L.",
  "Paolo D.",
  "Valentina F.",
  "Davide S.",
  "Martina V.",
  "Simone A.",
  "Laura N.",
];

const REVIEW_TEXT: Record<number, [string, string][]> = {
  5: [
    ["Bellissimo dal vivo", "Ancora più bello che in foto, si vede la cura del lavoro a mano."],
    ["Lo ricomprerei", "Qualità ottima e spedizione veloce, imballato con molta attenzione."],
    ["Regalo perfetto", "L'ho regalato a mia sorella ed è piaciuto moltissimo."],
    ["Uso quotidiano", "Lo uso ogni giorno da settimane ed è perfetto."],
  ],
  4: [
    ["Molto bello", "Ben fatto, il colore è leggermente diverso dalla foto ma mi piace."],
    ["Soddisfatta", "Buona qualità, consegna in tre giorni."],
    ["Consigliato", "Prezzo giusto per un oggetto artigianale, arrivato integro."],
  ],
  3: [["Carino", "Ben fatto, ma un po' più piccolo di quanto pensassi: controllate le misure."]],
  2: [["Così così", "Il prodotto va bene ma la consegna è arrivata in ritardo."]],
};

function demoReviews(products: Product[], today: ISODate, random: Random): Review[] {
  const reviews: Review[] = [];
  for (const product of products) {
    const count = product.createdAt > shiftISODate(today, -30) ? 0 : random.int(1, 7);
    for (let i = 0; i < count; i += 1) {
      const rating = random.weighted([
        [5, 60],
        [4, 28],
        [3, 8],
        [2, 4],
      ] as const);
      const [title, body] = random.pick(REVIEW_TEXT[rating]!);
      reviews.push({
        id: `rv_${reviews.length + 1}`,
        productId: product.id,
        author: random.pick(REVIEWERS),
        rating,
        title,
        body,
        date: shiftISODate(today, -random.int(3, 150)),
        verified: random.chance(0.85),
      });
    }
  }
  return reviews.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Catalogo pubblico (impostazioni, categorie, venditori, prodotti, recensioni)
 * rispetto a una data: usato per il prerendering e come base dei dati demo.
 */
export function catalogAt(today: ISODate) {
  const products = buildProducts(today);
  return {
    settings: { ...structuredClone(DEMO_SETTINGS), coupons: demoCoupons(today) },
    categories: structuredClone(CATEGORIES),
    sellers: structuredClone(SELLERS),
    products,
    reviews: demoReviews(products, today, createRandom(SEED + 1)),
  };
}

export type Catalog = ReturnType<typeof catalogAt>;

// ---------------------------------------------------------------------------
// Clienti e ordini
// ---------------------------------------------------------------------------

/** Cliente demo per l'area personale. */
export const DEMO_CUSTOMER_ID = "c_1";

const FIRST = [
  "Alessandro",
  "Alice",
  "Anna",
  "Beatrice",
  "Carlo",
  "Chiara",
  "Daniele",
  "Elisa",
  "Federico",
  "Giorgia",
  "Giovanni",
  "Ilaria",
  "Lorenzo",
  "Marta",
  "Matteo",
  "Nicola",
  "Paola",
  "Riccardo",
  "Roberta",
  "Silvia",
  "Stefano",
  "Teresa",
  "Tommaso",
  "Viola",
];
const LAST = [
  "Bassi",
  "Benassi",
  "Bertoni",
  "Cattaneo",
  "Colombo",
  "Conti",
  "De Luca",
  "Fabbri",
  "Galli",
  "Gentile",
  "Lombardi",
  "Mancini",
  "Marchetti",
  "Moretti",
  "Pellegrini",
  "Rinaldi",
  "Rizzi",
  "Sala",
  "Serra",
  "Testa",
  "Valentini",
  "Villa",
];
const CITIES: [city: string, province: string, cap: string][] = [
  ["Bologna", "BO", "40125"],
  ["Milano", "MI", "20121"],
  ["Torino", "TO", "10123"],
  ["Roma", "RM", "00184"],
  ["Firenze", "FI", "50125"],
  ["Padova", "PD", "35121"],
  ["Genova", "GE", "16121"],
  ["Napoli", "NA", "80134"],
  ["Verona", "VR", "37121"],
  ["Parma", "PR", "43121"],
  ["Bari", "BA", "70122"],
  ["Trento", "TN", "38122"],
];
const CARRIERS = ["Poste Italiane", "BRT", "GLS", "SDA"];

function plain(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

function makeCustomer(index: number, random: Random, createdAt: Date): Customer {
  const first = random.pick(FIRST);
  const last = random.pick(LAST);
  const [city, province, cap] = random.pick(CITIES);
  const name = `${first} ${last}`;
  const phone = `+39 3${random.int(20, 49)} 000 ${random.int(1000, 9999)}`;
  return {
    id: `c_${index}`,
    name,
    email: `${plain(first)}.${plain(last)}${random.int(1, 99)}@example.com`,
    phone,
    address: {
      name,
      street: `Via dell'Esempio ${random.int(1, 120)}`,
      postalCode: cap,
      city,
      province,
      country: "IT",
      phone,
    },
    marketingConsent: random.chance(0.35),
    createdAt: createdAt.toISOString(),
  };
}

const DEMO_CUSTOMER: Omit<Customer, "createdAt"> = {
  id: DEMO_CUSTOMER_ID,
  name: "Chiara Benassi",
  email: "chiara.benassi@example.com",
  phone: "+39 333 000 1234",
  address: {
    name: "Chiara Benassi",
    street: "Via dell'Esempio 21",
    postalCode: "40125",
    city: "Bologna",
    province: "BO",
    country: "IT",
    phone: "+39 333 000 1234",
  },
  marketingConsent: false,
};

/** Stato dell'ordine in base all'età (giorni) e al metodo di pagamento. */
function statusForAge(age: number, payment: PaymentMethod, random: Random): OrderStatus {
  if (random.chance(0.03)) return "cancelled";
  if (age === 0) {
    if (payment === "bank_transfer") return "awaiting_payment";
    return random.chance(0.6) ? "paid" : "processing";
  }
  if (age <= 1) return random.chance(0.5) ? "processing" : "shipped";
  if (age <= 4) return random.chance(0.7) ? "shipped" : "delivered";
  return "delivered";
}

const FLOW: OrderStatus[] = ["paid", "processing", "shipped", "delivered"];

export function createDemoData(now: Date): DataSnapshot {
  const random = createRandom(SEED);
  const today = toISODate(now);
  const catalog = catalogAt(today);
  const { settings, products } = catalog;
  const orderable = products.filter((p) => p.createdAt <= today);

  const customers: Customer[] = [
    { ...structuredClone(DEMO_CUSTOMER), createdAt: addDays(now, -200).toISOString() },
  ];
  for (let i = 2; i <= 72; i += 1) {
    customers.push(makeCustomer(i, random, addDays(now, -random.int(20, 400))));
  }

  type Draft = { at: Date; customer: Customer | null; forced?: Partial<Order> };
  const drafts: Draft[] = [];
  for (let offset = 90; offset >= 0; offset -= 1) {
    const day = startOfDay(addDays(now, -offset));
    const weekend = day.getDay() === 0 || day.getDay() === 6;
    const count = random.int(weekend ? 2 : 1, weekend ? 5 : 4);
    for (let i = 0; i < count; i += 1) {
      const at = addMinutes(day, random.int(7 * 60, 23 * 60));
      if (at.getTime() > now.getTime()) continue;
      const customer = random.chance(0.8) ? random.pick(customers.slice(1)) : null;
      drafts.push({ at, customer });
    }
  }
  // Ordini della cliente demo: uno consegnato da poco (reso possibile), uno in viaggio,
  // uno vecchio (recesso scaduto).
  const demo = customers[0]!;
  drafts.push(
    { at: addHours(startOfDay(addDays(now, -9)), 18), customer: demo, forced: { status: "delivered" } },
    { at: addHours(startOfDay(addDays(now, -2)), 11), customer: demo, forced: { status: "shipped" } },
    { at: addHours(startOfDay(addDays(now, -64)), 20), customer: demo, forced: { status: "delivered" } },
  );
  drafts.sort((a, b) => a.at.getTime() - b.at.getTime());

  const coupons = settings.coupons.filter((c) => c.active && c.code !== "ESTATE15");
  const orders: Order[] = drafts.map((draft, index) => {
    const day = toISODate(draft.at);
    const lineCount = random.weighted([
      [1, 50],
      [2, 32],
      [3, 18],
    ] as const);
    const lines: OrderLine[] = [];
    for (let i = 0; i < lineCount; i += 1) {
      const product = random.pick(orderable);
      const variant = random.pick(product.variants);
      if (lines.some((l) => l.variantId === variant.id)) continue;
      lines.push({
        productId: product.id,
        variantId: variant.id,
        sellerId: product.sellerId,
        name: product.name,
        variantName: variant.name,
        unitPrice: priceOn(product.priceHistory, day) ?? product.price,
        quantity: random.weighted([
          [1, 75],
          [2, 20],
          [3, 5],
        ] as const),
      });
    }
    const subtotal = lines.reduce((acc, l) => acc + l.unitPrice * l.quantity, 0);
    const method: ShippingMethod = random.weighted([
      ["standard", 70],
      ["express", 15],
      ["pickup", 15],
    ] as const);
    const payment: PaymentMethod = random.weighted([
      ["card", 70],
      ["paypal", 22],
      ["bank_transfer", 8],
    ] as const);
    const couponCandidate = random.chance(0.15) ? random.pick(coupons) : null;
    const coupon =
      couponCandidate && subtotal >= couponCandidate.minSubtotal ? couponCandidate : null;
    const totals = cartTotals({ subtotal, coupon, method, settings });

    const age = Math.round((startOfDay(now).getTime() - startOfDay(draft.at).getTime()) / 86_400_000);
    const status = draft.forced?.status ?? statusForAge(age, payment, random);
    const customer = draft.customer;
    const guest = customer ?? makeCustomer(1000 + index, random, draft.at);
    const address = structuredClone(guest.address!);

    // Cronologia coerente con lo stato raggiunto.
    const history: OrderEvent[] = [];
    let cursor = draft.at;
    if (payment === "bank_transfer") {
      history.push({ at: cursor.toISOString(), status: "awaiting_payment" });
      cursor = addHours(cursor, random.int(6, 30));
    }
    let deliveredAt: string | null = null;
    if (status === "cancelled") {
      history.push({ at: addHours(cursor, 2).toISOString(), status: "cancelled" });
    } else if (status !== "awaiting_payment") {
      const reached = FLOW.indexOf(status);
      FLOW.slice(0, reached + 1).forEach((step, i) => {
        if (i > 0) cursor = addHours(cursor, step === "delivered" ? random.int(30, 70) : random.int(3, 20));
        const at = new Date(Math.min(cursor.getTime(), now.getTime() - (FLOW.length - i) * 60_000));
        history.push({ at: at.toISOString(), status: step });
        if (step === "delivered") deliveredAt = at.toISOString();
      });
    }

    const order: Order = {
      id: `o_${index + 1}`,
      number: orderNumber(index + 1),
      customerId: customer?.id ?? null,
      email: guest.email,
      phone: guest.phone,
      shippingAddress: address,
      lines,
      subtotal: totals.subtotal,
      discount: totals.discount,
      shipping: totals.shipping,
      total: totals.total,
      coupon: coupon?.code ?? null,
      shippingMethod: method,
      payment,
      status,
      tracking:
        (status === "shipped" || status === "delivered") && method !== "pickup"
          ? { carrier: random.pick(CARRIERS), code: `${random.int(100_000, 999_999)}${random.int(1000, 9999)}IT` }
          : null,
      createdAt: draft.at.toISOString(),
      deliveredAt,
      history,
      returnRequest: null,
      marketingConsent: customer?.marketingConsent ?? false,
    };

    // Alcuni resi: richiesti di recente (da gestire) o già rimborsati.
    if (status === "delivered" && deliveredAt && customer?.id !== DEMO_CUSTOMER_ID) {
      const deliveredAge = (now.getTime() - new Date(deliveredAt).getTime()) / 86_400_000;
      if (deliveredAge <= 12 && random.chance(0.12)) {
        const items = [{ index: 0, quantity: lines[0]!.quantity }];
        order.returnRequest = {
          at: addDays(new Date(deliveredAt), 1).toISOString(),
          lines: items,
          reason: "Il colore non è quello che mi aspettavo.",
          status: "requested",
          refund: refundAmount(order, items, settings.shipping.standard),
        };
        order.history.push({ at: order.returnRequest.at, status: "requested" });
      } else if (deliveredAge > 15 && random.chance(0.05)) {
        const items = [{ index: 0, quantity: 1 }];
        const requestedAt = addDays(new Date(deliveredAt), 3);
        order.returnRequest = {
          at: requestedAt.toISOString(),
          lines: items,
          reason: "Arrivato con una piccola sbeccatura.",
          status: "refunded",
          refund: refundAmount(order, items, settings.shipping.standard),
        };
        order.history.push(
          { at: requestedAt.toISOString(), status: "requested" },
          { at: addDays(requestedAt, 1).toISOString(), status: "approved" },
          { at: addDays(requestedAt, 6).toISOString(), status: "refunded" },
        );
      }
    }
    return order;
  });

  return {
    ...catalog,
    customers,
    orders: orders.filter((o) => o.lines.length > 0),
  };
}
