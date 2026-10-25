/**
 * Contenuti del sito demo "Quadrante", software inventato per turni e presenze.
 * Sostituisci testi, numeri e testimonianze con dati reali e verificabili:
 * affermazioni non dimostrabili sono pratiche commerciali scorrette (Codice del Consumo).
 */

export const site = {
  name: "Quadrante",
  tagline: "Turni, presenze e ferie per piccoli team.",
  description:
    "Quadrante è il software per pianificare i turni, registrare le presenze e gestire ferie e permessi nelle piccole attività: negozi, ristoranti, studi e laboratori.",
  company: "Quadrante S.r.l. (dati di esempio)",
  vatNumber: "IT00000000000",
  rea: "RM-0000000",
  address: "Via dell'Esempio 10, 00100 Roma",
  email: "ciao@quadrante.example",
  /** Contatto per la privacy (titolare o responsabile della protezione dei dati). */
  privacyEmail: "privacy@quadrante.example",
} as const;

export const hero = {
  eyebrow: "Software per turni e presenze",
  title: "I turni del tuo team, senza fogli di calcolo.",
  text: "Pianifica la settimana in pochi minuti, lascia che il team timbri dal telefono e chiedi ferie e cambi turno in un'app sola.",
  primary: "Richiedi una demo",
  secondary: "Vedi i prezzi",
  note: "30 giorni di prova del piano Team, senza carta di credito.",
} as const;

/** Numeri di esempio: vanno sostituiti con dati reali e verificabili. */
export const stats = [
  { value: "1.200", label: "attività in Italia" },
  { value: "4 ore", label: "risparmiate ogni settimana in media" },
  { value: "4,8/5", label: "valutazione dei clienti" },
] as const;

export const features = [
  {
    id: "turni",
    title: "Turni in pochi minuti",
    text: "Parti da un modello, trascina le persone sui turni, vedi subito ore e sovrapposizioni. Pubblichi e il team riceve la notifica.",
    points: [
      "Modelli settimanali riutilizzabili",
      "Avvisi su ore massime e riposi",
      "Turni aperti da assegnare",
    ],
  },
  {
    id: "presenze",
    title: "Presenze dal telefono",
    text: "Entrata e uscita con un tocco, anche da tablet condiviso. Le differenze rispetto al turno sono evidenziate.",
    points: ["Timbratura da app o tablet", "Pause e straordinari", "Correzioni con storico"],
  },
  {
    id: "ferie",
    title: "Ferie e permessi",
    text: "Richieste, approvazioni e saldi in un unico posto. Il calendario mostra chi è assente prima di pianificare.",
    points: ["Saldo aggiornato da solo", "Approvazione con un clic", "Calendario delle assenze"],
  },
  {
    id: "cambi",
    title: "Cambi turno tra colleghi",
    text: "Chi non può coprire un turno lo propone ai colleghi; il responsabile approva solo lo scambio finale.",
    points: ["Proposta e accettazione", "Regole su ruoli e competenze", "Storico dei cambi"],
  },
  {
    id: "report",
    title: "Report per il consulente",
    text: "Ore lavorate, straordinari e assenze del mese pronti da esportare per le buste paga.",
    points: ["Esportazione CSV ed Excel", "Riepilogo per persona", "Chiusura del mese"],
  },
  {
    id: "ruoli",
    title: "Ruoli e sedi",
    text: "Più punti vendita, responsabili per sede e permessi chiari su chi vede e modifica cosa.",
    points: ["Sedi e reparti", "Permessi per ruolo", "Registro delle modifiche"],
  },
] as const;

export const steps = [
  { title: "Crea il team", text: "Importa le persone da un file o invitale via email." },
  { title: "Pianifica la settimana", text: "Usa un modello e sistema i turni trascinandoli." },
  { title: "Pubblica", text: "Il team riceve turni e notifiche sul telefono." },
] as const;

/** Testimonianze di esempio (persone e attività inventate). */
export const testimonials = [
  {
    quote:
      "Prima passavo il lunedì mattina sui turni. Adesso li chiudo in venti minuti e nessuno mi chiama per chiedere quando lavora.",
    name: "Serena Galli",
    role: "Titolare, Panificio Galli",
  },
  {
    quote:
      "Con tre sedi era impossibile sapere chi fosse in ferie. Ora lo vedo prima di pianificare.",
    name: "Marco De Luca",
    role: "Responsabile, Ottica Lumen",
  },
  {
    quote: "Il consulente riceve il riepilogo delle ore già pronto. Niente più fogli da ricopiare.",
    name: "Giada Ferri",
    role: "Amministrazione, Studio Ferri",
  },
] as const;

export type PlanId = "base" | "team" | "azienda";

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  /** Prezzo mensile per persona in centesimi (IVA esclusa); null = su misura. */
  monthly: number | null;
  /** Limite di persone (null = illimitato). */
  maxPeople: number | null;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

export const plans: Plan[] = [
  {
    id: "base",
    name: "Base",
    description: "Per iniziare con un piccolo team.",
    monthly: 0,
    maxPeople: 5,
    features: ["Fino a 5 persone", "Turni e calendario", "App per il team", "Assistenza via email"],
    cta: "Inizia gratis",
  },
  {
    id: "team",
    name: "Team",
    description: "Per attività con turni ogni settimana.",
    monthly: 400,
    maxPeople: null,
    features: [
      "Tutto il piano Base",
      "Presenze e timbratura",
      "Ferie, permessi e cambi turno",
      "Report per il consulente",
      "Assistenza in chat",
    ],
    cta: "Prova 30 giorni",
    highlighted: true,
  },
  {
    id: "azienda",
    name: "Azienda",
    description: "Per più sedi e integrazioni.",
    monthly: null,
    maxPeople: null,
    features: [
      "Tutto il piano Team",
      "Più sedi e reparti",
      "Integrazione con le paghe",
      "Accesso unico (SSO)",
      "Referente dedicato",
    ],
    cta: "Parla con noi",
  },
];

/** Sconto per la fatturazione annuale (0,2 = 20%). */
export const ANNUAL_DISCOUNT = 0.2;

export const comparison: { label: string; values: Record<PlanId, string | boolean> }[] = [
  { label: "Persone", values: { base: "Fino a 5", team: "Illimitate", azienda: "Illimitate" } },
  { label: "Turni e modelli", values: { base: true, team: true, azienda: true } },
  { label: "App per il team", values: { base: true, team: true, azienda: true } },
  { label: "Timbratura e presenze", values: { base: false, team: true, azienda: true } },
  { label: "Ferie e permessi", values: { base: false, team: true, azienda: true } },
  { label: "Report ed esportazioni", values: { base: false, team: true, azienda: true } },
  { label: "Più sedi", values: { base: false, team: false, azienda: true } },
  { label: "Accesso unico (SSO)", values: { base: false, team: false, azienda: true } },
  { label: "Assistenza", values: { base: "Email", team: "Chat", azienda: "Referente dedicato" } },
];

export const faq = [
  {
    q: "Serve una carta di credito per la prova?",
    a: "No. La prova del piano Team dura 30 giorni; alla fine scegli se passare a un piano a pagamento o restare sul piano Base.",
  },
  {
    q: "Come si calcola il prezzo?",
    a: "Paghi per le persone attive nel mese. Con la fatturazione annuale il prezzo per persona è più basso del 20%. I prezzi sono IVA esclusa.",
  },
  {
    q: "Posso cambiare piano o disdire?",
    a: "Sì, in qualsiasi momento dalle impostazioni. Con la fatturazione mensile la disdetta vale dal mese successivo.",
  },
  {
    q: "La timbratura dal telefono usa la posizione?",
    a: "Solo se la attivi e dopo aver valutato con il consulente gli obblighi su privacy e controlli a distanza (art. 4 dello Statuto dei lavoratori).",
  },
  {
    q: "Dove sono conservati i dati?",
    a: "In data center nell'Unione europea, con backup giornalieri cifrati. Agiamo come responsabile del trattamento per i dati del tuo team.",
  },
  {
    q: "Posso esportare i miei dati?",
    a: "Sì, in ogni momento in CSV o Excel, anche dopo la disdetta per 30 giorni.",
  },
] as const;

export const about = {
  title: "Chi siamo",
  intro:
    "Quadrante nasce nel 2021 dall'esperienza di chi ha gestito per anni i turni di un negozio di famiglia con fogli di calcolo e messaggi.",
  story: [
    "Abbiamo visto quanto tempo si perde a ricopiare orari, rispondere alle stesse domande e correggere errori nelle ore di fine mese.",
    "Per questo costruiamo uno strumento semplice per chi non ha un ufficio del personale: si impara in un pomeriggio e funziona sul telefono di tutti.",
  ],
  values: [
    {
      title: "Semplice prima di tutto",
      text: "Ogni funzione deve essere chiara anche senza manuale.",
    },
    {
      title: "Dalla parte di chi lavora",
      text: "Turni pubblicati in anticipo e richieste trasparenti aiutano tutto il team.",
    },
    {
      title: "Dati al sicuro",
      text: "Data center nell'UE, accessi controllati, nessuna vendita di dati.",
    },
  ],
  /** Persone inventate. */
  team: [
    { name: "Elena Bassi", role: "Cofondatrice e prodotto" },
    { name: "Luca Moretti", role: "Cofondatore e tecnologia" },
    { name: "Sara Villa", role: "Assistenza clienti" },
    { name: "Davide Greco", role: "Design" },
  ],
} as const;
