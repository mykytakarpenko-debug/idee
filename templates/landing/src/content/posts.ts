/**
 * Articoli del blog. In produzione possono arrivare da file MDX o da un CMS
 * headless: basta restituire oggetti con la stessa forma (vedi docs/personalizzazione.md).
 */

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "note"; text: string };

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  /** Data di pubblicazione "YYYY-MM-DD". */
  date: string;
  author: string;
  category: "Guide" | "Normative" | "Prodotto";
  minutes: number;
  body: Block[];
}

export const posts: Post[] = [
  {
    slug: "turni-piccolo-negozio",
    title: "Come organizzare i turni in un piccolo negozio",
    excerpt:
      "Un metodo in cinque passi per passare dal foglio di calcolo a una pianificazione che regge anche le settimane difficili.",
    date: "2026-10-14",
    author: "Elena Bassi",
    category: "Guide",
    minutes: 5,
    body: [
      {
        type: "p",
        text: "Nei negozi con meno di dieci persone i turni si fanno spesso a memoria, il lunedì mattina. Funziona finché qualcuno si ammala o chiede un cambio: da lì in poi ogni modifica genera telefonate e messaggi.",
      },
      { type: "h2", text: "1. Parti dal fabbisogno, non dalle persone" },
      {
        type: "p",
        text: "Scrivi per ogni giorno quante persone servono in ogni fascia oraria, con le competenze necessarie (cassa, magazzino, apertura). È il modello da cui partire ogni settimana.",
      },
      { type: "h2", text: "2. Raccogli disponibilità e vincoli in anticipo" },
      {
        type: "ul",
        items: [
          "Ferie e permessi già approvati",
          "Giorni in cui qualcuno non può lavorare",
          "Ore contrattuali e riposi minimi",
        ],
      },
      { type: "h2", text: "3. Pubblica con almeno una settimana di anticipo" },
      {
        type: "p",
        text: "Turni pubblicati in anticipo riducono richieste di cambio e assenze. Molti contratti collettivi prevedono termini di preavviso: verificali con il consulente.",
      },
      { type: "h2", text: "4. Regola i cambi turno" },
      {
        type: "p",
        text: "Lascia che i colleghi si propongano gli scambi e approva solo il risultato finale, controllando competenze e ore.",
      },
      { type: "h2", text: "5. Chiudi il mese con i dati giusti" },
      {
        type: "p",
        text: "Confronta turni e presenze, correggi le differenze e invia il riepilogo al consulente: meno errori in busta paga, meno discussioni.",
      },
    ],
  },
  {
    slug: "ferie-estive-metodo",
    title: "Ferie estive senza discussioni: un metodo in 4 passi",
    excerpt:
      "Regole chiare, richieste entro una data e un calendario condiviso: così le ferie si pianificano a marzo, non a luglio.",
    date: "2026-09-22",
    author: "Sara Villa",
    category: "Guide",
    minutes: 4,
    body: [
      {
        type: "p",
        text: "Le ferie estive sono il momento più delicato dell'anno per i piccoli team: tutti vogliono agosto, ma il servizio deve continuare.",
      },
      { type: "h2", text: "1. Fissa le regole a inizio anno" },
      {
        type: "p",
        text: "Quante persone possono essere assenti insieme, quali periodi sono a rotazione, entro quando presentare le richieste.",
      },
      { type: "h2", text: "2. Raccogli le richieste entro una data" },
      {
        type: "p",
        text: "Chiedi le preferenze entro fine marzo, con una prima e una seconda scelta.",
      },
      { type: "h2", text: "3. Decidi con criteri trasparenti" },
      {
        type: "ul",
        items: [
          "Rotazione rispetto all'anno precedente",
          "Esigenze familiari documentate",
          "Ordine di arrivo come ultimo criterio",
        ],
      },
      { type: "h2", text: "4. Pubblica il calendario" },
      {
        type: "p",
        text: "Un calendario condiviso delle assenze evita sorprese e permette a tutti di organizzarsi.",
      },
    ],
  },
  {
    slug: "timbratura-digitale-privacy",
    title: "Timbratura digitale e privacy: cosa sapere prima di iniziare",
    excerpt:
      "Registrare le presenze dal telefono è comodo, ma va fatto rispettando GDPR e Statuto dei lavoratori. I punti da verificare.",
    date: "2026-08-30",
    author: "Luca Moretti",
    category: "Normative",
    minutes: 6,
    body: [
      {
        type: "note",
        text: "Questo articolo è informativo e non sostituisce il parere di un consulente del lavoro o di un legale.",
      },
      {
        type: "p",
        text: "Registrare l'orario di lavoro è necessario per paghe e obblighi contrattuali. Gli strumenti digitali lo rendono più semplice, ma trattano dati personali dei dipendenti.",
      },
      { type: "h2", text: "Informare i dipendenti" },
      {
        type: "p",
        text: "Serve un'informativa chiara su quali dati si raccolgono, per quali finalità e per quanto tempo (artt. 13 e 14 GDPR).",
      },
      { type: "h2", text: "Raccogliere solo il necessario" },
      {
        type: "ul",
        items: [
          "Orari di entrata e uscita, non la posizione continua",
          "Accessi limitati a chi gestisce le presenze",
          "Conservazione per il tempo previsto dagli obblighi di legge",
        ],
      },
      { type: "h2", text: "Geolocalizzazione e controlli a distanza" },
      {
        type: "p",
        text: "Se lo strumento consente un controllo a distanza dell'attività, l'art. 4 dello Statuto dei lavoratori può richiedere un accordo sindacale o un'autorizzazione dell'Ispettorato. Valuta questi aspetti prima di attivare la posizione.",
      },
      { type: "h2", text: "Scegliere un fornitore affidabile" },
      {
        type: "p",
        text: "Il fornitore del software è responsabile del trattamento: verifica dove sono i dati, le misure di sicurezza e il contratto ai sensi dell'art. 28 GDPR.",
      },
    ],
  },
];

export function findPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

/** Articoli dal più recente. */
export function sortedPosts(): Post[] {
  return [...posts].sort((a, b) => b.date.localeCompare(a.date));
}
