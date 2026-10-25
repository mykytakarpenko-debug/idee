import { addDays, addHours, addMinutes, startOfMonth, subMonths } from "date-fns";
import { maskIp } from "@/lib/domain/auth";
import { shiftISODate, toISODate } from "@/lib/domain/dates";
import { ticketNumber } from "@/lib/domain/tickets";
import type {
  AuditAction,
  AuditEvent,
  DataSnapshot,
  DocumentFile,
  DocumentKind,
  Folder,
  Invoice,
  Organization,
  PortalSettings,
  Project,
  Role,
  Ticket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  User,
} from "@/lib/domain/types";
import { createRandom, type Random } from "./random";

/**
 * Dati demo di "Orbita Digital", fornitore inventato di servizi digitali, e dei
 * suoi clienti. Deterministici (stesso seme, stessa data → stessi dati), con
 * date relative a oggi. Aziende, persone, email e partite IVA sono inventate.
 */

const SEED = 20_260_606;

/** Codice del secondo fattore in demo (in produzione: TOTP o passkey). */
export const DEMO_OTP = "246810";

export const DEMO_SETTINGS: PortalSettings = {
  providerName: "Orbita Digital",
  supportEmail: "supporto@orbita.example",
  slaHours: { urgent: 4, high: 8, normal: 24, low: 48 },
  mfaRequired: true,
  sessionTimeoutMinutes: 30,
  auditRetentionDays: 365,
  vatRate: 0.22,
};

/** Account demo mostrati nella pagina di accesso, uno per ruolo. */
export const DEMO_ACCOUNTS: { email: string; role: Role }[] = [
  { email: "giulia.ferri@ferri-arredamenti.example", role: "client_admin" },
  { email: "marco.rossi@ferri-arredamenti.example", role: "client_member" },
  { email: "anna.galli@ferri-arredamenti.example", role: "client_viewer" },
  { email: "luca.ferretti@orbita.example", role: "support" },
  { email: "elisa.marchi@orbita.example", role: "admin" },
];

const ORGS: Omit<Organization, "createdAt">[] = [
  {
    id: "o_ferri",
    name: "Ferri Arredamenti S.p.A.",
    sector: "Arredamento",
    city: "Brescia",
    vatNumber: "IT00000000101",
    plan: "pro",
    accountManagerId: "s_luca",
    active: true,
  },
  {
    id: "o_lumen",
    name: "Lumen Ottica S.r.l.",
    sector: "Retail ottico",
    city: "Torino",
    vatNumber: "IT00000000102",
    plan: "base",
    accountManagerId: "s_sara",
    active: true,
  },
  {
    id: "o_alpi",
    name: "Cantine Alpi S.r.l.",
    sector: "Vitivinicolo",
    city: "Trento",
    vatNumber: "IT00000000103",
    plan: "pro",
    accountManagerId: "s_luca",
    active: true,
  },
  {
    id: "o_nova",
    name: "Nova Logistica S.p.A.",
    sector: "Logistica",
    city: "Piacenza",
    vatNumber: "IT00000000104",
    plan: "enterprise",
    accountManagerId: "s_davide",
    active: true,
  },
  {
    id: "o_verde",
    name: "Studio Verde Architetti",
    sector: "Architettura",
    city: "Firenze",
    vatNumber: "IT00000000105",
    plan: "base",
    accountManagerId: "s_sara",
    active: true,
  },
  {
    id: "o_mare",
    name: "Hotel Mare Blu",
    sector: "Ospitalità",
    city: "Rimini",
    vatNumber: "IT00000000106",
    plan: "pro",
    accountManagerId: "s_davide",
    active: true,
  },
];

const DOMAINS: Record<string, string> = {
  o_ferri: "ferri-arredamenti.example",
  o_lumen: "lumenottica.example",
  o_alpi: "cantinealpi.example",
  o_nova: "novalogistica.example",
  o_verde: "studioverde.example",
  o_mare: "hotelmareblu.example",
};

const STAFF: Omit<User, "lastLoginAt" | "createdAt">[] = [
  {
    id: "s_elisa",
    name: "Elisa Marchi",
    email: "elisa.marchi@orbita.example",
    title: "Responsabile operations",
    orgId: null,
    role: "admin",
    status: "active",
    mfaEnabled: true,
  },
  {
    id: "s_luca",
    name: "Luca Ferretti",
    email: "luca.ferretti@orbita.example",
    title: "Account manager",
    orgId: null,
    role: "support",
    status: "active",
    mfaEnabled: true,
  },
  {
    id: "s_sara",
    name: "Sara Conti",
    email: "sara.conti@orbita.example",
    title: "Supporto clienti",
    orgId: null,
    role: "support",
    status: "active",
    mfaEnabled: true,
  },
  {
    id: "s_davide",
    name: "Davide Neri",
    email: "davide.neri@orbita.example",
    title: "Sviluppatore senior",
    orgId: null,
    role: "support",
    status: "active",
    mfaEnabled: true,
  },
];

const CLIENT_DEMO: Omit<User, "lastLoginAt" | "createdAt">[] = [
  {
    id: "u_giulia",
    name: "Giulia Ferri",
    email: "giulia.ferri@ferri-arredamenti.example",
    title: "Direttrice marketing",
    orgId: "o_ferri",
    role: "client_admin",
    status: "active",
    mfaEnabled: true,
  },
  {
    id: "u_marco",
    name: "Marco Rossi",
    email: "marco.rossi@ferri-arredamenti.example",
    title: "E-commerce manager",
    orgId: "o_ferri",
    role: "client_member",
    status: "active",
    mfaEnabled: true,
  },
  {
    id: "u_anna",
    name: "Anna Galli",
    email: "anna.galli@ferri-arredamenti.example",
    title: "Amministrazione",
    orgId: "o_ferri",
    role: "client_viewer",
    status: "active",
    mfaEnabled: false,
  },
];

const FIRST = [
  "Andrea",
  "Beatrice",
  "Carlo",
  "Chiara",
  "Daniela",
  "Fabio",
  "Federica",
  "Giorgio",
  "Irene",
  "Lorenzo",
  "Matteo",
  "Nicoletta",
  "Paolo",
  "Roberta",
  "Simone",
  "Valentina",
];
const LAST = [
  "Bassi",
  "Bianchi",
  "Colombo",
  "Costa",
  "Fontana",
  "Greco",
  "Leone",
  "Lombardi",
  "Marino",
  "Moretti",
  "Palumbo",
  "Rizzi",
  "Santoro",
  "Testa",
  "Villa",
];
const TITLES = [
  "Amministratore delegato",
  "Responsabile IT",
  "Marketing",
  "Amministrazione",
  "Vendite",
  "Operations",
];

const plain = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

interface ProjectDef {
  name: string;
  description: string;
  status: Project["status"];
  health: Project["health"];
  start: number;
  due: number;
  milestones: [title: string, due: number, done: boolean][];
}

const FERRI_PROJECTS: ProjectDef[] = [
  {
    name: "Nuovo sito e-commerce",
    description: "Catalogo di 1.200 prodotti, configuratore dei tessuti e pagamenti online.",
    status: "active",
    health: "at_risk",
    start: -95,
    due: 40,
    milestones: [
      ["Analisi e requisiti", -80, true],
      ["Design delle pagine", -45, true],
      ["Sviluppo del catalogo", -3, false],
      ["Integrazione pagamenti", 18, false],
      ["Messa online", 40, false],
    ],
  },
  {
    name: "App per gli agenti",
    description: "App per tablet con listini, ordini offline e sincronizzazione con il gestionale.",
    status: "planning",
    health: "on_track",
    start: 20,
    due: 150,
    milestones: [
      ["Workshop con la rete vendita", 25, false],
      ["Prototipo", 60, false],
      ["Pilota con 5 agenti", 110, false],
    ],
  },
  {
    name: "Manutenzione e sicurezza 2026",
    description: "Aggiornamenti, backup, monitoraggio e piccoli interventi evolutivi.",
    status: "active",
    health: "on_track",
    start: -290,
    due: 70,
    milestones: [
      ["Aggiornamento infrastruttura", -200, true],
      ["Test di ripristino dei backup", -60, true],
      ["Revisione degli accessi", 12, false],
    ],
  },
];

const GENERIC_PROJECTS: ProjectDef[] = [
  {
    name: "Restyling del sito",
    description: "Nuova grafica, contenuti multilingua e migliore velocità sui telefoni.",
    status: "active",
    health: "on_track",
    start: -60,
    due: 45,
    milestones: [
      ["Moodboard", -50, true],
      ["Prototipo navigabile", -20, true],
      ["Sviluppo", 20, false],
      ["Messa online", 45, false],
    ],
  },
  {
    name: "Integrazione con il gestionale",
    description: "Sincronizzazione di ordini, clienti e magazzino ogni 15 minuti.",
    status: "active",
    health: "off_track",
    start: -120,
    due: 5,
    milestones: [
      ["Mappatura dei dati", -100, true],
      ["Connettore ordini", -30, true],
      ["Connettore magazzino", -8, false],
      ["Collaudo", 5, false],
    ],
  },
  {
    name: "Campagna newsletter",
    description: "Modelli email, automazioni di benvenuto e report mensile.",
    status: "completed",
    health: "on_track",
    start: -200,
    due: -90,
    milestones: [
      ["Modelli", -170, true],
      ["Automazioni", -120, true],
      ["Primo report", -90, true],
    ],
  },
  {
    name: "Assistenza applicativa",
    description: "Supporto e correzioni sul portale prenotazioni.",
    status: "on_hold",
    health: "at_risk",
    start: -40,
    due: 60,
    milestones: [
      ["Analisi dei problemi aperti", -30, true],
      ["Piano di intervento", 10, false],
    ],
  },
];

const DOCS: [name: string, kind: DocumentKind, folder: Folder, sizeKb: number][] = [
  ["Contratto quadro 2026.pdf", "pdf", "contratti", 420],
  ["Accordo sul trattamento dei dati (art. 28).pdf", "pdf", "contratti", 310],
  ["Offerta tecnica ed economica v3.pdf", "pdf", "contratti", 1250],
  ["Specifiche funzionali.docx", "doc", "consegne", 860],
  ["Piano di progetto.xlsx", "sheet", "consegne", 140],
  ["Wireframe pagine principali.png", "image", "consegne", 2300],
  ["Asset grafici.zip", "zip", "consegne", 48_200],
  ["Report mensile di settembre.pdf", "pdf", "report", 980],
  ["Report di sicurezza trimestrale.pdf", "pdf", "report", 640],
  ["Verbale di collaudo.pdf", "pdf", "amministrazione", 210],
  ["Anagrafica fornitore.pdf", "pdf", "amministrazione", 95],
];

const TICKET_TEXT: Record<TicketCategory, [subject: string, body: string][]> = {
  bug: [
    [
      "Il carrello si svuota dopo l'accesso",
      "Alcuni clienti segnalano che, dopo aver fatto l'accesso, il carrello risulta vuoto. Succede soprattutto da telefono.",
    ],
    [
      "Errore 500 nella pagina ordini",
      "Aprendo l'elenco ordini filtrato per mese compare un errore. Allego lo screenshot.",
    ],
    [
      "Le immagini dei prodotti non si caricano",
      "Da stamattina alcune immagini del catalogo restano grigie.",
    ],
    [
      "Email di conferma non arrivano",
      "Due clienti non hanno ricevuto la conferma d'ordine, controllate anche lo spam?",
    ],
  ],
  request: [
    [
      "Nuovo banner per la promozione di novembre",
      "Vorremmo pubblicare il banner allegato in home dal 1° novembre.",
    ],
    [
      "Aggiungere un utente per il magazzino",
      "Ci serve un accesso in sola lettura per il responsabile del magazzino.",
    ],
    [
      "Esportazione mensile dei contatti",
      "È possibile ricevere ogni mese un file con i nuovi iscritti alla newsletter?",
    ],
  ],
  question: [
    [
      "Come si aggiorna il listino?",
      "Dobbiamo caricare i nuovi prezzi: qual è la procedura corretta?",
    ],
    ["Tempi per la nuova sezione blog", "Potete darci una stima dei tempi per la sezione blog?"],
  ],
  billing: [
    [
      "Copia della fattura di settembre",
      "Il nostro commercialista chiede una copia della fattura di settembre.",
    ],
    ["Dati di fatturazione aggiornati", "Abbiamo cambiato sede legale: vi inviamo i nuovi dati."],
  ],
};

const STAFF_REPLIES = [
  "Grazie della segnalazione, stiamo verificando e vi aggiorniamo entro oggi.",
  "Abbiamo individuato la causa: la correzione sarà pubblicata stasera.",
  "Fatto! Potete verificare e, se è tutto a posto, chiudere il ticket.",
  "Ci servirebbe un esempio (numero d'ordine o orario) per riprodurre il problema.",
];
const CLIENT_REPLIES = [
  "Perfetto, grazie mille.",
  "Vi mando qui l'esempio richiesto: ordine 10432 di ieri pomeriggio.",
  "Confermo, ora funziona.",
];
const INTERNAL_NOTES = [
  "Nota interna: probabilmente legato al rilascio di martedì, controllare i log.",
  "Nota interna: cliente in rinnovo a fine mese, dare priorità.",
];

const CATEGORY_WEIGHTS: [TicketCategory, number][] = [
  ["bug", 40],
  ["request", 30],
  ["question", 20],
  ["billing", 10],
];
const PRIORITY_WEIGHTS: [TicketPriority, number][] = [
  ["low", 20],
  ["normal", 50],
  ["high", 22],
  ["urgent", 8],
];

const ip = (random: Random) =>
  maskIp(
    `${random.pick([93, 151, 79, 2, 5])}.${random.int(1, 254)}.${random.int(1, 254)}.${random.int(1, 254)}`,
  );

function makeProject(
  def: ProjectDef,
  orgId: string,
  index: number,
  today: string,
  managerId: string,
): Project {
  return {
    id: `p_${orgId.slice(2)}_${index}`,
    orgId,
    name: def.name,
    description: def.description,
    status: def.status,
    health: def.health,
    start: shiftISODate(today, def.start),
    due: shiftISODate(today, def.due),
    managerId,
    milestones: def.milestones.map(([title, due, done], i) => ({
      id: `m_${orgId.slice(2)}_${index}_${i}`,
      title,
      due: shiftISODate(today, due),
      done,
    })),
  };
}

export function createDemoData(now: Date): DataSnapshot {
  const random = createRandom(SEED);
  const today = toISODate(now);
  const settings = structuredClone(DEMO_SETTINGS);

  const organizations: Organization[] = ORGS.map((org, i) => ({
    ...org,
    createdAt: shiftISODate(today, -700 + i * 60),
  }));

  // Utenti: staff, demo del cliente Ferri, poi 2–5 per ogni altra organizzazione.
  const users: User[] = [
    ...STAFF.map((u) => ({
      ...u,
      createdAt: addDays(now, -800).toISOString(),
      lastLoginAt: addHours(now, -random.int(1, 30)).toISOString(),
    })),
    ...CLIENT_DEMO.map((u) => ({
      ...u,
      createdAt: addDays(now, -400).toISOString(),
      lastLoginAt: addDays(now, -random.int(1, 6)).toISOString(),
    })),
  ];
  for (const org of organizations) {
    const count = org.id === "o_ferri" ? 1 : random.int(2, 5);
    for (let i = 0; i < count; i += 1) {
      const first = random.pick(FIRST);
      const last = random.pick(LAST);
      const status =
        i === 0
          ? "active"
          : random.weighted([
              ["active", 80],
              ["invited", 12],
              ["disabled", 8],
            ] as const);
      users.push({
        id: `u_${org.id.slice(2)}_${i}`,
        name: `${first} ${last}`,
        email: `${plain(first)}.${plain(last)}@${DOMAINS[org.id]}`,
        title: random.pick(TITLES),
        orgId: org.id,
        role:
          i === 0 && org.id !== "o_ferri"
            ? "client_admin"
            : random.weighted([
                ["client_member", 60],
                ["client_viewer", 30],
                ["client_admin", 10],
              ] as const),
        status,
        mfaEnabled: status === "active" ? random.chance(0.75) : false,
        createdAt: addDays(now, -random.int(30, 500)).toISOString(),
        lastLoginAt: status === "active" ? addDays(now, -random.int(0, 40)).toISOString() : null,
      });
    }
  }
  const clientsOf = (orgId: string) =>
    users.filter((u) => u.orgId === orgId && u.status === "active");
  const staffIds = STAFF.map((s) => s.id);

  const projects: Project[] = [];
  for (const org of organizations) {
    const defs =
      org.id === "o_ferri"
        ? FERRI_PROJECTS
        : [random.pick(GENERIC_PROJECTS), random.pick(GENERIC_PROJECTS)].filter(
            (def, i, list) => list.indexOf(def) === i,
          );
    defs.forEach((def, i) =>
      projects.push(makeProject(def, org.id, i, today, org.accountManagerId)),
    );
  }

  const documents: DocumentFile[] = [];
  for (const org of organizations) {
    const own = projects.filter((p) => p.orgId === org.id);
    for (const [name, kind, folder, sizeKb] of DOCS) {
      if (org.id !== "o_ferri" && random.chance(0.35)) continue;
      const author =
        folder === "consegne" || folder === "report"
          ? random.pick(staffIds)
          : random.pick(clientsOf(org.id)).id;
      documents.push({
        id: `d_${documents.length + 1}`,
        orgId: org.id,
        projectId: folder === "consegne" && own[0] ? own[0].id : null,
        name,
        kind,
        folder,
        sizeKb,
        uploadedBy: author,
        uploadedAt: addHours(now, -random.int(10, 2400)).toISOString(),
        version: folder === "contratti" ? random.int(1, 3) : 1,
      });
    }
  }

  // Ticket negli ultimi 60 giorni; quelli recenti restano aperti.
  const tickets: Ticket[] = [];
  const draftTimes: { at: Date; orgId: string }[] = [];
  for (const org of organizations) {
    const count = org.id === "o_ferri" ? 14 : random.int(6, 12);
    for (let i = 0; i < count; i += 1) {
      draftTimes.push({ at: addMinutes(now, -random.int(30, 60 * 24 * 60)), orgId: org.id });
    }
  }
  // Qualche ticket di oggi, per avere una coda viva.
  draftTimes.push(
    { at: addMinutes(now, -95), orgId: "o_ferri" },
    { at: addMinutes(now, -260), orgId: "o_nova" },
    { at: addMinutes(now, -1300), orgId: "o_alpi" },
  );
  draftTimes.sort((a, b) => a.at.getTime() - b.at.getTime());
  draftTimes.forEach(({ at, orgId }, index) => {
    const category = random.weighted(CATEGORY_WEIGHTS);
    const priority = random.weighted(PRIORITY_WEIGHTS);
    const [subject, body] = random.pick(TICKET_TEXT[category]);
    const author = random.pick(clientsOf(orgId).filter((u) => u.role !== "client_viewer"));
    const ageHours = (now.getTime() - at.getTime()) / 3_600_000;
    const sla = settings.slaHours[priority];
    // I ticket più vecchi dello SLA sono sempre assegnati; i recenti a volte no.
    const recent = ageHours < sla;
    const assignee = !recent || random.chance(0.6) ? random.pick(staffIds.slice(1)) : null;
    // Risposta: quasi sempre entro lo SLA, a volte in ritardo, i più recenti ancora senza.
    const responseDelay = random.chance(0.9)
      ? random.int(10, Math.max(20, sla * 45))
      : sla * 60 + random.int(30, 600);
    const responded =
      assignee !== null && responseDelay / 60 < ageHours && (!recent || random.chance(0.5));
    const firstResponseAt = responded ? addMinutes(at, responseDelay) : null;

    let status: TicketStatus = "open";
    if (firstResponseAt) {
      if (ageHours > 24 * 10) status = random.chance(0.85) ? "closed" : "resolved";
      else if (ageHours > 24 * 3)
        status = random.weighted([
          ["resolved", 40],
          ["closed", 30],
          ["waiting", 15],
          ["in_progress", 15],
        ] as const);
      else
        status = random.weighted([
          ["in_progress", 55],
          ["waiting", 25],
          ["resolved", 20],
        ] as const);
    }
    const messages: Ticket["messages"] = [
      { id: `msg_${index}_0`, authorId: author.id, body, at: at.toISOString(), internal: false },
    ];
    if (firstResponseAt && assignee) {
      if (random.chance(0.3)) {
        messages.push({
          id: `msg_${index}_n`,
          authorId: assignee,
          body: random.pick(INTERNAL_NOTES),
          at: addMinutes(firstResponseAt, -5).toISOString(),
          internal: true,
        });
      }
      messages.push({
        id: `msg_${index}_1`,
        authorId: assignee,
        body: random.pick(STAFF_REPLIES),
        at: firstResponseAt.toISOString(),
        internal: false,
      });
      if (status !== "in_progress" && random.chance(0.6)) {
        const later = addHours(firstResponseAt, random.int(1, 30));
        if (later.getTime() < now.getTime()) {
          messages.push({
            id: `msg_${index}_2`,
            authorId: author.id,
            body: random.pick(CLIENT_REPLIES),
            at: later.toISOString(),
            internal: false,
          });
        }
      }
    }
    const last = messages.at(-1)!.at;
    const resolvedAt =
      status === "resolved" || status === "closed"
        ? new Date(
            Math.min(addHours(new Date(last), random.int(1, 20)).getTime(), now.getTime() - 60_000),
          ).toISOString()
        : null;
    tickets.push({
      id: `t_${index + 1}`,
      number: ticketNumber(index + 1),
      orgId,
      subject,
      category,
      priority,
      status,
      createdBy: author.id,
      assigneeId: assignee,
      createdAt: at.toISOString(),
      updatedAt: resolvedAt ?? last,
      firstResponseAt: firstResponseAt?.toISOString() ?? null,
      resolvedAt,
      messages: [...messages].sort((a, b) => a.at.localeCompare(b.at)),
    });
  });

  // Fatture mensili degli ultimi 10 mesi: pagate, in scadenza, una scaduta (Lumen).
  const invoices: Invoice[] = [];
  const fees: Record<Organization["plan"], number> = {
    base: 39_000,
    pro: 89_000,
    enterprise: 240_000,
  };
  for (let m = 9; m >= 0; m -= 1) {
    const issue = startOfMonth(subMonths(now, m));
    for (const org of organizations) {
      const issueDate = toISODate(issue);
      const dueDate = shiftISODate(issueDate, 30);
      const extraHours = random.chance(0.4) ? random.int(2, 16) : 0;
      const overdue = org.id === "o_lumen" && m === 1;
      invoices.push({
        id: `i_${invoices.length + 1}`,
        number: `${issue.getFullYear()}/${String(invoices.length + 1).padStart(4, "0")}`,
        orgId: org.id,
        issueDate,
        dueDate,
        vatRate: settings.vatRate,
        lines: [
          {
            description: `Canone piano ${org.plan === "enterprise" ? "Enterprise" : org.plan === "pro" ? "Pro" : "Base"}`,
            amount: fees[org.plan],
          },
          ...(extraHours > 0
            ? [{ description: `Interventi extra (${extraHours} ore)`, amount: extraHours * 6_500 }]
            : []),
        ],
        paidAt: dueDate < today && !overdue ? shiftISODate(issueDate, random.int(5, 29)) : null,
      });
    }
  }

  // Registro attività: accessi e azioni degli ultimi 30 giorni.
  const audit: AuditEvent[] = [];
  const log = (
    at: Date,
    actorId: string,
    action: AuditAction,
    target: string,
    orgId: string | null,
  ) =>
    audit.push({
      id: `a_${audit.length + 1}`,
      at: at.toISOString(),
      actorId,
      action,
      target,
      orgId,
      ip: ip(random),
    });
  for (const user of users.filter((u) => u.status === "active")) {
    const logins = user.orgId === null ? 18 : random.int(2, 10);
    for (let i = 0; i < logins; i += 1) {
      const at = addMinutes(now, -random.int(60, 60 * 24 * 30));
      if (random.chance(0.06))
        log(addMinutes(at, -2), user.id, "auth.mfa_failed", user.email, user.orgId);
      log(at, user.id, "auth.login", user.email, user.orgId);
    }
  }
  for (const ticket of tickets) {
    if (new Date(ticket.createdAt).getTime() < addDays(now, -30).getTime()) continue;
    log(new Date(ticket.createdAt), ticket.createdBy, "ticket.create", ticket.number, ticket.orgId);
    for (const message of ticket.messages.slice(1))
      log(new Date(message.at), message.authorId, "ticket.reply", ticket.number, ticket.orgId);
  }
  for (const doc of documents) {
    if (new Date(doc.uploadedAt).getTime() >= addDays(now, -30).getTime()) {
      log(new Date(doc.uploadedAt), doc.uploadedBy, "document.upload", doc.name, doc.orgId);
    }
  }
  const invited = users.filter((u) => u.status === "invited");
  for (const user of invited) {
    const admin = users.find(
      (u) => u.orgId === user.orgId && u.role === "client_admin" && u.status === "active",
    );
    log(
      addDays(now, -random.int(1, 20)),
      admin?.id ?? "s_elisa",
      "user.invite",
      user.email,
      user.orgId,
    );
  }
  log(addDays(now, -12), "s_elisa", "settings.update", "Tempi di risposta (SLA)", null);
  audit.sort((a, b) => a.at.localeCompare(b.at));

  return { organizations, users, projects, documents, tickets, invoices, audit, settings };
}
