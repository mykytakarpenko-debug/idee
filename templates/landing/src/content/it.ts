/**
 * Testi dell'interfaccia di Vetrina (italiano). I contenuti del sito demo
 * (prodotto, prezzi, articoli) sono in content/site.ts e content/posts.ts.
 */
export const copy = {
  common: {
    save: "Salva",
    cancel: "Annulla",
    close: "Chiudi",
    readMore: "Leggi l'articolo",
    allPosts: "Tutti gli articoli",
    optional: "facoltativo",
    minutes: (n: number) => `${n} min di lettura`,
  },

  a11y: {
    skipToContent: "Vai al contenuto principale",
    mainNavigation: "Navigazione principale",
    footerNavigation: "Navigazione del piè di pagina",
    openMenu: "Apri il menu",
    notifications: "Notifiche",
    included: "Incluso",
    notIncluded: "Non incluso",
    sortBy: (label: string) => `Ordina per ${label}`,
  },

  theme: {
    label: "Tema",
    light: "Chiaro",
    dark: "Scuro",
    system: "Sistema",
    toggle: "Cambia tema",
  },

  header: {
    cta: "Richiedi una demo",
  },

  footer: {
    product: "Prodotto",
    company: "Azienda",
    legal: "Note legali",
    cookiePreferences: "Preferenze cookie",
    rights: (company: string, vat: string, rea: string) =>
      `${company} · P. IVA ${vat} · REA ${rea}`,
  },

  home: {
    features: "Tutto quello che serve, niente di più",
    featuresText: "Pensato per attività da 3 a 50 persone, senza un ufficio del personale.",
    steps: "Pronti in un pomeriggio",
    testimonials: "Cosa dicono i clienti",
    testimonialsNote: "Testimonianze di esempio.",
    pricing: "Prezzi semplici",
    pricingText: "Paghi solo per le persone attive. Prezzi IVA esclusa.",
    faq: "Domande frequenti",
    ctaTitle: "Prova Quadrante con il tuo team",
    ctaText: "Ti mostriamo il prodotto in 20 minuti, con i tuoi turni.",
    mockupLabel: "Anteprima dell'app: settimana di turni con persone, orari e ore totali",
  },

  pricing: {
    title: "Prezzi",
    description: "Scegli il piano adatto al tuo team. Puoi cambiare in qualsiasi momento.",
    billing: "Fatturazione",
    monthly: "Mensile",
    annual: "Annuale",
    annualBadge: "−20%",
    perPerson: "/ persona al mese",
    free: "Gratis",
    custom: "Su misura",
    billedAnnually: (total: string) => `${total} all'anno per persona, fatturati annualmente`,
    billedMonthly: "Fatturazione mensile, disdici quando vuoi",
    vatNote: "Prezzi IVA esclusa. Per i privati si aggiunge l'IVA al 22%.",
    popular: "Il più scelto",
    compare: "Confronta i piani",
    feature: "Funzione",
    calculator: "Calcola il costo",
    people: "Persone nel team",
    estimate: (people: number, total: string) =>
      `Per ${people} persone: ${total} all'anno (IVA esclusa)`,
    savings: (amount: string) => `Con la fatturazione annuale risparmi ${amount}`,
    overLimit: "Oltre 5 persone serve il piano Team.",
  },

  features: {
    title: "Funzionalità",
    description: "Dalla pianificazione alla busta paga, in un unico strumento.",
  },

  blog: {
    title: "Blog",
    description: "Guide pratiche su turni, ferie e gestione del personale nelle piccole attività.",
    by: (author: string) => `di ${author}`,
    back: "Torna al blog",
    related: "Altri articoli",
  },

  contact: {
    title: "Contatti",
    description: "Raccontaci il tuo team: ti rispondiamo entro un giorno lavorativo.",
    name: "Nome e cognome",
    email: "Email di lavoro",
    company: "Azienda",
    teamSize: "Persone nel team",
    message: "Messaggio",
    messageHint: "Cosa vorresti migliorare nella gestione dei turni?",
    newsletter: "Voglio ricevere la newsletter mensile (facoltativo, puoi annullare quando vuoi)",
    honeypot: "Lascia vuoto questo campo",
    privacyNote: "Usiamo i tuoi dati solo per rispondere alla richiesta.",
    privacyLink: "Informativa privacy",
    submit: "Invia richiesta",
    sending: "Invio in corso…",
    sent: "Richiesta inviata",
    sentText: "Grazie! Ti scriviamo entro un giorno lavorativo all'indirizzo indicato.",
    another: "Invia un'altra richiesta",
    error: "Invio non riuscito. Riprova tra qualche minuto o scrivici via email.",
    tooMany: "Troppe richieste in poco tempo. Riprova più tardi.",
    demoNote: "Demo: la richiesta viene validata dal server ma non viene inviata a nessuno.",
    direct: "Preferisci l'email?",
    teamSizes: { "1-5": "1–5", "6-20": "6–20", "21-50": "21–50", "50+": "Più di 50" },
  },

  cookies: {
    title: "Cookie e privacy",
    text: "Usiamo cookie tecnici per far funzionare il sito. Con il tuo consenso useremmo anche strumenti di statistica e di marketing. Puoi cambiare idea in qualsiasi momento.",
    policy: "Cookie policy",
    accept: "Accetta tutti",
    reject: "Rifiuta",
    customize: "Personalizza",
    closeReject: "Chiudi e rifiuta i cookie non necessari",
    preferences: "Preferenze cookie",
    preferencesText:
      "Scegli quali categorie attivare. I cookie necessari non si possono disattivare.",
    save: "Salva le scelte",
    saved: "Preferenze salvate",
    categories: {
      necessary: { title: "Necessari", text: "Consenso, tema e funzioni del sito. Sempre attivi." },
      statistics: {
        title: "Statistiche",
        text: "Misurano in forma aggregata come viene usato il sito.",
      },
      marketing: { title: "Marketing", text: "Misurano l'efficacia delle campagne pubblicitarie." },
    },
    alwaysOn: "Sempre attivi",
  },

  legal: {
    templateNote: "Testo di esempio da adattare con un legale prima della pubblicazione.",
    privacy: "Informativa privacy",
    cookies: "Cookie policy",
    terms: "Termini di servizio",
    updated: (date: string) => `Ultimo aggiornamento: ${date}`,
  },

  errors: {
    genericTitle: "Qualcosa è andato storto",
    genericBody: "Si è verificato un errore imprevisto. Riprova tra qualche istante.",
    retry: "Riprova",
    notFoundTitle: "Pagina non trovata",
    notFoundBody: "La pagina che cerchi non esiste o è stata spostata.",
    goHome: "Torna alla home",
  },
};
