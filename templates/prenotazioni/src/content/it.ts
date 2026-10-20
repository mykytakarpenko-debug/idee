/**
 * Testi dell'interfaccia di Agenda (italiano).
 * Modifica qui i testi senza toccare i componenti; per tradurre duplica il file
 * mantenendo le stesse chiavi.
 */
import type { AppointmentSource, AppointmentStatus, Mode } from "@/lib/domain/types";

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export const copy = {
  common: {
    save: "Salva",
    saveChanges: "Salva modifiche",
    cancel: "Annulla",
    close: "Chiudi",
    edit: "Modifica",
    delete: "Elimina",
    add: "Aggiungi",
    back: "Indietro",
    continue: "Continua",
    confirm: "Conferma",
    search: "Cerca",
    all: "Tutti",
    moreActions: "Altre azioni",
    optional: "facoltativo",
    today: "Oggi",
    tomorrow: "Domani",
    previous: "Precedente",
    next: "Successivo",
    resetFilters: "Azzera filtri",
    free: "Gratuito",
    minutes: (n: number) => `${n} min`,
    page: (current: number, total: number) => `Pagina ${current} di ${total}`,
    showing: (from: number, to: number, total: number) => `${from}–${to} di ${total}`,
    results: (n: number) => `${n} ${plural(n, "risultato", "risultati")}`,
    appointments: (n: number) => `${n} ${plural(n, "appuntamento", "appuntamenti")}`,
    addToCalendar: "Aggiungi al calendario",
    copy: "Copia",
    copied: "Copiato negli appunti",
  },

  a11y: {
    skipToContent: "Vai al contenuto principale",
    mainNavigation: "Navigazione principale",
    panelNavigation: "Navigazione del pannello",
    mobileNavigation: "Navigazione rapida",
    pagination: "Paginazione",
    sortBy: (label: string) => `Ordina per ${label}`,
    notifications: "Notifiche",
    openMenu: "Apri il menu",
    steps: "Passaggi della prenotazione",
    stepOf: (current: number, total: number) => `Passaggio ${current} di ${total}`,
  },

  theme: {
    label: "Tema",
    light: "Chiaro",
    dark: "Scuro",
    system: "Sistema",
    toggle: "Cambia tema",
  },

  modes: {
    in_person: "In studio",
    online: "Videochiamata",
  } satisfies Record<Mode, string>,

  status: {
    pending: "Da confermare",
    confirmed: "Confermato",
    cancelled: "Cancellato",
    completed: "Concluso",
    no_show: "Non presentato",
  } satisfies Record<AppointmentStatus, string>,

  sources: {
    online: "Sito",
    widget: "Widget",
    phone: "Telefono",
  } satisfies Record<AppointmentSource, string>,

  weekdays: ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"],
  weekdaysShort: ["L", "M", "M", "G", "V", "S", "D"],

  demo: {
    banner: "Sito demo: le prenotazioni sono simulate e restano in questo browser.",
    panel: "Area gestione",
    reset: "Ripristina dati demo",
    resetDone: "Dati demo ripristinati",
  },

  // --------------------------------------------------------------------------
  // Pagina pubblica
  // --------------------------------------------------------------------------
  site: {
    nav: { services: "Servizi", team: "Lo studio", faq: "Domande", manage: "La mia prenotazione" },
    cta: "Prenota un appuntamento",
    footer: {
      contacts: "Contatti",
      info: "Informazioni",
      privacy: "Privacy",
      panel: "Area gestione (demo)",
      vat: "P. IVA",
      rights: "Tutti i diritti riservati.",
      widget: "Widget di prenotazione",
    },
  },

  home: {
    eyebrow: "Prenotazione online",
    servicesTitle: "Servizi",
    servicesHint:
      "Prezzi indicativi IVA inclusa. Il preventivo definitivo viene confermato prima di iniziare.",
    book: "Prenota",
    teamTitle: "Lo studio",
    hoursTitle: "Quando riceviamo",
    hoursClosed: "Chiuso",
    faqTitle: "Domande frequenti",
    faq: [
      {
        q: "Come funziona la videochiamata?",
        a: "Riceverai il link via email il giorno prima. Basta un browser: non serve installare nulla.",
      },
      {
        q: "Posso spostare o cancellare l'appuntamento?",
        a: "Sì, dalla pagina della tua prenotazione fino a 24 ore prima. Dopo, contattaci per telefono.",
      },
      {
        q: "Quali documenti devo portare?",
        a: "Te lo indichiamo nella email di conferma, in base al servizio scelto.",
      },
      {
        q: "Perché alcune richieste sono da confermare?",
        a: "Le prime consulenze gratuite vengono confermate dallo studio entro un giorno lavorativo, per abbinarti al professionista giusto.",
      },
    ],
    manageTitle: "Hai già prenotato?",
    manageText: "Ritrova la tua prenotazione con il codice ricevuto per spostarla o cancellarla.",
  },

  booking: {
    title: "Prenota un appuntamento",
    steps: ["Servizio", "Professionista", "Data e ora", "I tuoi dati"],
    service: {
      title: "Quale servizio ti serve?",
      duration: (n: number) => `${n} minuti`,
      approval: "Su conferma dello studio",
    },
    staff: {
      title: "Con chi e come?",
      who: "Professionista",
      any: "Primo disponibile",
      anyHint: "Ti proponiamo gli orari di tutti i professionisti abilitati.",
      mode: "Modalità",
    },
    slot: {
      title: "Scegli giorno e orario",
      month: "Mese",
      previousMonth: "Mese precedente",
      nextMonth: "Mese successivo",
      available: "disponibile",
      unavailable: "non disponibile",
      times: (date: string) => `Orari di ${date}`,
      pickDay: "Seleziona un giorno evidenziato nel calendario.",
      none: "Nessun orario libero in questo giorno.",
      with: (name: string) => `con ${name}`,
    },
    details: {
      title: "I tuoi dati",
      name: "Nome e cognome",
      email: "Email",
      emailHint: "Ti inviamo conferma e promemoria.",
      phone: "Telefono",
      notes: "Note per lo studio",
      notesHint: "Non inserire dati sanitari o informazioni non necessarie.",
      privacy:
        "Ho letto l'informativa privacy e acconsento al trattamento dei dati per gestire l'appuntamento.",
      marketing: "Desidero ricevere comunicazioni e novità dello studio (facoltativo).",
      terms: (hours: number) =>
        `Puoi spostare o cancellare gratuitamente fino a ${hours} ore prima dall'apposita pagina. Il prezzo indicato è indicativo e viene confermato prima della prestazione.`,
    },
    summary: "Riepilogo",
    summaryService: "Servizio",
    summaryWith: "Con",
    summaryWhen: "Quando",
    summaryMode: "Modalità",
    summaryPrice: "Prezzo",
    submit: "Conferma prenotazione",
    submitRequest: "Invia richiesta",
    slotTaken: "Questo orario è appena stato preso: scegline un altro.",
    confirmedTitle: "Prenotazione confermata",
    requestedTitle: "Richiesta inviata",
    confirmedText: (name: string) => `Grazie ${name}! Ti abbiamo inviato una email di conferma.`,
    requestedText: (name: string) =>
      `Grazie ${name}! Lo studio confermerà l'appuntamento entro un giorno lavorativo.`,
    code: "Codice prenotazione",
    codeHint: "Usalo per spostare o cancellare l'appuntamento.",
    manage: "Gestisci la prenotazione",
    another: "Nuova prenotazione",
  },

  manage: {
    findTitle: "La mia prenotazione",
    findText: "Inserisci il codice che trovi nella email di conferma (es. AG-7KQ2MZ).",
    code: "Codice prenotazione",
    find: "Cerca",
    notFound: "Nessuna prenotazione con questo codice.",
    notFoundHint:
      "Controlla il codice; in demo le prenotazioni restano solo nel browser in cui sono state fatte.",
    title: (code: string) => `Prenotazione ${code}`,
    status: "Stato",
    reschedule: "Sposta",
    rescheduleTitle: "Scegli un nuovo orario",
    rescheduled: "Appuntamento spostato",
    cancel: "Cancella appuntamento",
    cancelTitle: "Cancellare l'appuntamento?",
    cancelText: "L'orario tornerà disponibile per altri clienti.",
    cancelled: "Appuntamento cancellato",
    tooLate: (hours: number, phone: string) =>
      `Mancano meno di ${hours} ore: per modifiche chiama lo studio al ${phone}.`,
    closed: "Questo appuntamento non è più modificabile.",
    history: "Cronologia",
    events: {
      created: "Prenotato",
      confirmed: "Confermato dallo studio",
      rescheduled: "Spostato",
      cancelled: "Cancellato",
    },
    by: { customer: "da te", business: "dallo studio" },
    bookAgain: "Prenota di nuovo",
  },

  widget: {
    title: "Prenota",
    poweredBy: "Prenotazione sicura",
  },

  privacy: {
    title: "Informativa privacy",
  },

  // --------------------------------------------------------------------------
  // Pannello
  // --------------------------------------------------------------------------
  panel: {
    nav: {
      agenda: "Agenda",
      availability: "Disponibilità",
      services: "Servizi",
      settings: "Impostazioni",
      site: "Vedi la pagina pubblica",
      more: "Altro",
    },
    area: "Area gestione",
  },

  agenda: {
    title: "Agenda",
    description: "Appuntamenti del giorno per professionista.",
    allStaff: "Tutti i professionisti",
    pending: "Da confermare",
    pendingEmpty: "Nessuna richiesta da confermare",
    empty: "Nessun appuntamento",
    emptyHint: "Nessun appuntamento per questo giorno e professionista.",
    kpi: {
      today: "Appuntamenti oggi",
      week: "Questa settimana",
      pending: "Da confermare",
      occupancy: "Occupazione agenda",
      occupancyHint: "prossimi 7 giorni",
    },
    actions: {
      confirm: "Conferma",
      decline: "Rifiuta",
      cancel: "Cancella",
      complete: "Segna come concluso",
      noShow: "Non presentato",
    },
    confirmed: "Appuntamento confermato",
    declined: "Richiesta rifiutata",
    cancelled: "Appuntamento cancellato",
    updated: (label: string) => `Stato aggiornato: ${label}`,
    contact: "Contatta",
    details: "Dettagli",
    notes: "Note del cliente",
  },

  availability: {
    title: "Disponibilità",
    description: "Orari settimanali, pause e assenze di ogni professionista.",
    weekly: "Orario settimanale",
    weeklyHint: "Aggiungi più fasce nello stesso giorno per indicare le pause.",
    addRange: "Aggiungi fascia",
    removeRange: "Rimuovi fascia",
    closed: "Non riceve",
    from: "dalle",
    to: "alle",
    saved: "Orari salvati",
    invalid: "Ogni fascia deve finire dopo l'inizio e non sovrapporsi alle altre.",
    timeOff: "Assenze e chiusure",
    timeOffHint: "Ferie, formazione o chiusure dello studio: in quei giorni non si può prenotare.",
    timeOffEmpty: "Nessuna assenza programmata",
    addTimeOff: "Aggiungi assenza",
    timeOffFrom: "Dal",
    timeOffTo: "Al",
    timeOffReason: "Motivo",
    timeOffWho: "Chi",
    wholeStudio: "Tutto lo studio",
    timeOffAdded: "Assenza aggiunta",
    timeOffRemoved: "Assenza rimossa",
    timeOffInvalid: "La data di fine deve essere uguale o successiva all'inizio.",
    conflicts: (n: number) =>
      `${n} ${plural(n, "appuntamento attivo cade", "appuntamenti attivi cadono")} in questo periodo: ricordati di avvisare i clienti.`,
  },

  services: {
    title: "Servizi",
    description: "Cosa si può prenotare online, con durata, prezzo e professionisti.",
    newService: "Nuovo servizio",
    active: "Prenotabile",
    inactive: "Non prenotabile",
    toggle: (name: string) => `Prenotabile online: ${name}`,
    form: {
      createTitle: "Nuovo servizio",
      editTitle: "Modifica servizio",
      name: "Nome",
      description: "Descrizione",
      category: "Categoria",
      duration: "Durata (minuti)",
      buffer: "Pausa dopo (minuti)",
      bufferHint: "Tempo libero dopo l'appuntamento, non prenotabile.",
      price: "Prezzo (€)",
      priceHint: "Lascia vuoto se gratuito.",
      modes: "Modalità",
      staff: "Professionisti",
      approval: "Richiede conferma dello studio",
      created: "Servizio creato",
      updated: "Servizio aggiornato",
    },
  },

  settings: {
    title: "Impostazioni",
    description: "Dati dello studio, regole di prenotazione e widget.",
    sections: {
      info: "Studio",
      booking: "Regole di prenotazione",
      widget: "Widget da incorporare",
      data: "Dati demo",
    },
    info: {
      name: "Nome",
      tagline: "Frase di presentazione",
      address: "Indirizzo",
      postalCode: "CAP",
      city: "Città",
      phone: "Telefono",
      email: "Email",
      vat: "Partita IVA",
      saved: "Dati dello studio salvati",
    },
    booking: {
      step: "Passo degli orari",
      step15: "Ogni 15 minuti",
      step30: "Ogni 30 minuti",
      step60: "Ogni ora",
      lead: "Anticipo minimo (ore)",
      horizon: "Prenotabile fino a (giorni)",
      cancel: "Spostamenti e cancellazioni online fino a (ore prima)",
      anyStaff: 'Consenti "primo disponibile"',
      anyStaffHint: "Il cliente può non scegliere il professionista: lo assegna il sistema.",
      saved: "Regole salvate",
    },
    widget: {
      intro:
        "Copia questo codice nel tuo sito per mostrare la prenotazione in una finestra integrata.",
      snippet: "Codice da incorporare",
      origins:
        "Per motivi di sicurezza il widget è incorporabile solo dai domini indicati nella variabile WIDGET_FRAME_ANCESTORS (vedi la documentazione).",
      preview: "Apri il widget",
    },
    data: {
      intro:
        "In demo tutti i dati restano nel browser e sono condivisi tra pagina pubblica, widget e pannello.",
      reset: "Ripristina dati demo",
      resetHint: "Rigenera servizi, orari e appuntamenti di esempio.",
      resetTitle: "Ripristinare i dati demo?",
      resetText: "Le modifiche fatte finora verranno perse.",
    },
  },

  validation: {
    required: "Campo obbligatorio",
    email: "Inserisci un indirizzo email valido",
    phone: "Inserisci un numero di telefono valido",
    amount: "Inserisci un importo valido, es. 80,00",
    postalCode: "Inserisci un CAP di 5 cifre",
    consent: "Per continuare è necessario il consenso",
    tooLong: (max: number) => `Massimo ${max} caratteri`,
    number: "Inserisci un numero valido",
    atLeastOne: "Seleziona almeno un'opzione",
    code: "Inserisci un codice nel formato AG-XXXXXX",
  },

  errors: {
    notFoundTitle: "Pagina non trovata",
    notFoundBody: "La pagina che cerchi non esiste o è stata spostata.",
    goHome: "Torna alla home",
    genericTitle: "Qualcosa non ha funzionato",
    genericBody: "Si è verificato un errore imprevisto. Riprova tra un istante.",
    retry: "Riprova",
    storage:
      "Il browser non consente di salvare i dati: le modifiche valgono solo per questa sessione.",
  },
} as const;

export type Copy = typeof copy;
