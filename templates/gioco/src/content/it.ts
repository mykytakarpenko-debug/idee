/**
 * Testi dell'interfaccia di Arena (italiano).
 * Modifica qui i testi senza toccare i componenti; per tradurre duplica il file
 * mantenendo le stesse chiavi. Linguaggio neutro: niente inviti a giocare,
 * niente promesse di vincita, niente bonus (D.L. 87/2018, "Decreto Dignità").
 */
import type {
  BetStatus,
  DocumentType,
  KycStatus,
  LineOutcome,
  MarketKind,
  RgEventKind,
  Sport,
  TransactionKind,
} from "@/lib/domain/types";
import type { RiskSignal } from "@/lib/domain/responsible";

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export const HELPLINE = {
  name: "Telefono Verde Nazionale per le problematiche legate al gioco d'azzardo",
  short: "Telefono Verde 800 558 822",
  number: "800558822",
  display: "800 558 822",
  owner: "Istituto Superiore di Sanità",
  hours: "dal lunedì al venerdì, 10–16, anonimo e gratuito",
} as const;

export const copy = {
  common: {
    save: "Salva",
    cancel: "Annulla",
    close: "Chiudi",
    confirm: "Conferma",
    all: "Tutti",
    optional: "facoltativo",
    previous: "Precedente",
    next: "Successivo",
    viewAll: "Vedi tutto",
    resetFilters: "Azzera filtri",
    none: "Nessuno",
    noLimit: "Nessun limite",
    yes: "Sì",
    no: "No",
    back: "Indietro",
    page: (current: number, total: number) => `Pagina ${current} di ${total}`,
    showing: (from: number, to: number, total: number) => `${from}–${to} di ${total}`,
    minutes: (n: number) => `${n} ${plural(n, "minuto", "minuti")}`,
    days: (n: number) => `${n} ${plural(n, "giorno", "giorni")}`,
  },

  a11y: {
    skipToContent: "Vai al contenuto principale",
    mainNavigation: "Navigazione principale",
    panelNavigation: "Navigazione del pannello",
    mobileNavigation: "Navigazione rapida",
    openMenu: "Apri il menu",
    pagination: "Paginazione",
    sortBy: (label: string) => `Ordina per ${label}`,
    notifications: "Notifiche",
  },

  theme: {
    label: "Tema",
    light: "Chiaro",
    dark: "Scuro",
    system: "Sistema",
    toggle: "Cambia tema",
  },

  demo: {
    banner:
      "Demo: crediti senza valore, nessun pagamento reale. Dati salvati solo in questo browser.",
    panel: "Pannello operatore",
    reset: "Ripristina dati demo",
    resetDone: "Dati demo ripristinati",
  },

  site: {
    nav: {
      sport: "Scommesse",
      games: "Giochi",
      responsible: "Gioco responsabile",
      rules: "Regole e probabilità",
    },
    account: "Il mio conto",
    login: "Accedi",
    register: "Registrati",
    balance: "Saldo",
    balanceLabel: (amount: string) => `Saldo: ${amount}`,
    warning: "Il gioco è vietato ai minori e può causare dipendenza patologica.",
    adult: "18+",
    probability: "Probabilità di vincita",
    footer: {
      legal: "Informazioni legali",
      terms: "Termini e condizioni",
      privacy: "Privacy",
      rules: "Regole e probabilità di vincita",
      responsible: "Gioco responsabile",
      help: "Serve aiuto?",
      helpText: "Se il gioco non è più un divertimento, parlane con qualcuno.",
      licenseNote:
        "Gioco pubblico regolamentato da ADM (Agenzia delle Dogane e dei Monopoli). Nella versione pubblicata qui vanno logo e numero di concessione reali.",
      company: (company: string, vat: string) => `${company} · P. IVA ${vat}`,
      panel: "Pannello operatore (demo)",
    },
  },

  ageGate: {
    title: "Hai almeno 18 anni?",
    text: "Il gioco con vincita in denaro è vietato ai minori di 18 anni. L'età viene verificata con un documento al momento della registrazione.",
    yes: "Sì, ho almeno 18 anni",
    no: "No",
  },

  minors: {
    title: "Questo sito non è per te",
    text: "Il gioco con vincita in denaro è vietato ai minori di 18 anni (art. 24, D.L. 98/2011).",
    help: "Se qualcuno vicino a te gioca troppo, puoi chiedere un consiglio, anche in forma anonima, al",
    exit: "Torna alla pagina iniziale",
  },

  home: {
    eyebrow: "Scommesse sportive e giochi",
    title: "Gioca solo se ti diverte. Con limiti che decidi tu.",
    text: "Quote chiare, ritorno teorico al giocatore indicato su ogni gioco, limiti di ricarica e di perdita, pause e autoesclusione sempre a portata di mano.",
    toSport: "Vedi le scommesse",
    toGames: "Vedi i giochi",
    upcoming: "Prossimi eventi",
    games: "Giochi",
    protections: "Come proteggiamo chi gioca",
    protectionsList: [
      {
        title: "Solo maggiorenni, identità verificata",
        text: "Codice fiscale e documento controllati prima di poter prelevare.",
      },
      {
        title: "Limiti obbligatori",
        text: "Ogni conto ha un limite di ricarica; gli aumenti hanno effetto dopo 7 giorni.",
      },
      {
        title: "Nessuna promozione",
        text: "Niente bonus né pubblicità, come previsto dal Decreto Dignità.",
      },
      {
        title: "Aiuto gratuito",
        text: "Telefono Verde dell'Istituto Superiore di Sanità, anonimo e gratuito.",
      },
    ],
    rgCta: "Strumenti di gioco responsabile",
  },

  sports: {
    calcio: "Calcio",
    tennis: "Tennis",
    basket: "Basket",
  } satisfies Record<Sport, string>,

  markets: {
    "1X2": "Esito finale 1X2",
    OU25: "Under/Over 2,5",
    GGNG: "Goal/No goal",
    "12": "Testa a testa",
  } satisfies Record<MarketKind, string>,

  sport: {
    title: "Scommesse sportive",
    description:
      "Quote fisse sui prossimi eventi. Le quote sono quelle mostrate al momento della giocata.",
    filter: "Sport",
    empty: "Nessun evento in programma",
    today: "Oggi",
    tomorrow: "Domani",
    oddsWord: "quota",
    marketsShort: { "1X2": "1X2", OU25: "U/O 2,5", GGNG: "GG/NG", "12": "1-2" } satisfies Record<
      MarketKind,
      string
    >,
  },

  slip: {
    title: "Schedina",
    empty: "Seleziona una o più quote per comporre la schedina.",
    single: "Singola",
    multiple: (n: number) => `Multipla (${n})`,
    remove: (label: string) => `Rimuovi ${label}`,
    clear: "Svuota",
    stake: "Importo",
    stakeHint: (min: string, max: string) => `Da ${min} a ${max}`,
    totalOdds: "Quota totale",
    potentialWin: "Vincita potenziale",
    capped: (max: string) => `Ridotta alla vincita massima di ${max}`,
    place: "Conferma la giocata",
    placed: (code: string) => `Scommessa ${code} registrata`,
    loginToBet: "Accedi per giocare",
    open: (n: number) => `Apri la schedina (${n})`,
    issues: {
      empty: "La schedina è vuota.",
      too_many: (max: number) => `Massimo ${max} eventi per schedina.`,
      same_event: "Non puoi combinare due esiti dello stesso evento.",
      unavailable: "Un evento non è più disponibile: rimuovilo.",
      stake_min: (min: string) => `Importo minimo ${min}.`,
      stake_max: (max: string) => `Importo massimo ${max}.`,
      balance: "Saldo insufficiente.",
      loss_limit: (left: string) =>
        `Supereresti il tuo limite di perdita giornaliero (restano ${left}).`,
      blocked: "Il gioco è sospeso sul tuo conto.",
    },
  },

  games: {
    title: "Giochi",
    description:
      "Slot a tre rulli. Ritorno teorico e frequenza di vincita sono calcolati su tutte le combinazioni possibili.",
    rtp: "Ritorno teorico al giocatore (RTP)",
    rtpShort: "RTP",
    hitRate: "Combinazioni vincenti",
    maxWin: "Vincita massima",
    volatility: "Volatilità",
    volatilityValue: { bassa: "Bassa", alta: "Alta" },
    bets: (min: string, max: string) => `Puntata da ${min} a ${max}`,
    open: (name: string) => `Apri ${name}`,
    rtpNote:
      "L'RTP è una media su un numero molto alto di giocate: nel breve periodo il risultato può essere molto diverso e, in media, si perde.",
  },

  slot: {
    bet: "Puntata",
    play: "Gioca",
    playing: "Rulli in movimento…",
    lastWin: "Ultima vincita",
    noWin: "Nessuna vincita",
    win: (amount: string) => `Vincita: ${amount}`,
    result: (symbols: string, outcome: string) => `Risultato: ${symbols}. ${outcome}`,
    reel: (n: number) => `Rullo ${n}`,
    paytable: "Tabella dei pagamenti",
    combination: "Combinazione",
    pays: "Paga",
    times: (n: number) => `${n}× la puntata`,
    threeOf: (symbol: string) => `Tre ${symbol}`,
    cherryTwo: "Due ciliegie (rulli 1 e 2)",
    cherryOne: "Una ciliegia (rullo 1)",
    loginToPlay: "Accedi per giocare con i crediti demo",
    noAutoplay: "Nessuna giocata automatica né rapida: ogni giocata dura almeno 2,5 secondi.",
    rngNote:
      "In demo il risultato è generato nel browser. In produzione lo genera il server, con un generatore certificato da un laboratorio accreditato ADM.",
  },

  realityCheck: {
    title: "Promemoria del tempo di gioco",
    text: (minutes: number) =>
      `Stai giocando da ${minutes} ${plural(minutes, "minuto", "minuti")}.`,
    staked: "Giocato in questa sessione",
    returned: "Vinto in questa sessione",
    net: "Saldo della sessione",
    continue: "Continua",
    stop: "Esci dal conto",
    history: "Vedi i movimenti",
  },

  session: {
    timer: (minutes: number) => `Sessione: ${minutes} min`,
    limitReached:
      "Hai raggiunto la durata massima della sessione che hai scelto. Fai una pausa: potrai accedere di nuovo tra 30 minuti.",
  },

  block: {
    self_exclusion: (until: string | null) =>
      until
        ? `Autoesclusione attiva fino al ${until}. Puoi solo prelevare il saldo.`
        : "Autoesclusione a tempo indeterminato attiva. Puoi solo prelevare il saldo.",
    pause: (until: string) => `Pausa attiva fino al ${until}. Gioco e ricariche sono sospesi.`,
    cooldown: (until: string) => `Pausa dopo il limite di sessione fino alle ${until}.`,
  },

  auth: {
    title: "Accedi",
    text: "Accedi al tuo conto di gioco.",
    email: "Email",
    password: "Password",
    submit: "Accedi",
    demo: "Account demo: credenziali già inserite.",
    noAccount: "Non hai un conto?",
    register: "Registrati",
    invalid: "Email o password non corrette.",
    cooldown: (time: string) =>
      `Hai raggiunto il limite di sessione: puoi accedere di nuovo dalle ${time}.`,
    signedOut: "Sei uscito dal conto.",
    sessionLimit: "Sessione chiusa: hai raggiunto la durata massima che hai scelto.",
    required: "Accedi per continuare",
  },

  register: {
    title: "Apri un conto di gioco",
    text: "Servono dati veri: verifichiamo età e identità prima del primo prelievo.",
    personal: "Dati personali",
    firstName: "Nome",
    lastName: "Cognome",
    birthDate: "Data di nascita",
    fiscalCode: "Codice fiscale",
    city: "Comune di residenza",
    email: "Email",
    password: "Password",
    passwordHint: "Almeno 10 caratteri.",
    document: "Documento d'identità",
    documentType: "Tipo di documento",
    documentNumber: "Numero",
    documentExpiresOn: "Scadenza",
    documentNote:
      "In produzione carichi una foto del documento; la verifica avviene entro 30 giorni.",
    limits: "Limite di ricarica settimanale",
    limitsText:
      "È obbligatorio sceglierlo ora. Potrai ridurlo subito o aumentarlo con 7 giorni di attesa.",
    depositWeek: "Ricarica massima in 7 giorni (€)",
    consents: "Consensi",
    terms: "Ho letto e accetto i termini e condizioni del conto di gioco",
    privacy: "Ho letto l'informativa privacy",
    adultNote:
      "Dichiari di avere almeno 18 anni e di aprire un solo conto presso questo operatore.",
    submit: "Apri il conto",
    created: "Conto aperto: documento in verifica",
    duplicate: "Esiste già un conto con questa email o questo codice fiscale.",
    demoFill: "Compila con dati demo",
  },

  documentTypes: {
    carta_identita: "Carta d'identità",
    patente: "Patente",
    passaporto: "Passaporto",
  } satisfies Record<DocumentType, string>,

  kyc: {
    pending: "Documento in verifica",
    verified: "Identità verificata",
    rejected: "Verifica non superata",
  } satisfies Record<KycStatus, string>,

  account: {
    title: "Il mio conto",
    greeting: (name: string) => `Ciao, ${name}`,
    balance: "Saldo disponibile",
    demoCredits: "Crediti demo, senza valore.",
    deposit: "Ricarica",
    depositTitle: "Ricarica crediti demo",
    depositText:
      "In produzione la ricarica avviene con un metodo di pagamento intestato al titolare del conto.",
    depositAmount: "Importo (€)",
    depositRoom: (amount: string, window: string) => `Puoi ricaricare ancora ${amount} ${window}.`,
    deposited: (amount: string) => `Ricarica di ${amount} completata`,
    depositLimit: (amount: string, window: string) =>
      `Supera il tuo limite: puoi ricaricare ancora ${amount} ${window}.`,
    withdraw: "Preleva",
    withdrawTitle: "Preleva",
    withdrawText:
      "Il prelievo è possibile solo con identità verificata, sul conto intestato al titolare.",
    withdrawn: (amount: string) => `Prelievo di ${amount} richiesto`,
    withdrawKyc: "Per prelevare serve l'identità verificata.",
    withdrawBalance: "Importo superiore al saldo.",
    tabs: { movements: "Movimenti", bets: "Scommesse", sessions: "Sessioni" },
    columns: {
      at: "Data",
      kind: "Movimento",
      ref: "Riferimento",
      amount: "Importo",
      balance: "Saldo",
    },
    betColumns: {
      code: "Scommessa",
      placed: "Giocata",
      stake: "Importo",
      odds: "Quota",
      win: "Vincita",
      status: "Stato",
    },
    sessionColumns: { start: "Inizio", duration: "Durata", net: "Saldo" },
    noMovements: "Nessun movimento",
    noBets: "Nessuna scommessa",
    windows: {
      day: "nelle prossime 24 ore",
      week: "in questi 7 giorni",
      month: "in questi 30 giorni",
    },
    logout: "Esci",
    limitsLink: "Limiti e pause",
    profile: "Dati del conto",
  },

  transactionKinds: {
    deposit: "Ricarica",
    withdrawal: "Prelievo",
    bet: "Scommessa",
    bet_win: "Vincita scommessa",
    bet_refund: "Rimborso scommessa",
    spin: "Giocata slot",
    spin_win: "Vincita slot",
  } satisfies Record<TransactionKind, string>,

  betStatus: {
    open: "In corso",
    won: "Vincente",
    lost: "Perdente",
    void: "Rimborsata",
  } satisfies Record<BetStatus, string>,

  lineOutcome: {
    pending: "In attesa",
    won: "Vinto",
    lost: "Perso",
    void: "Annullato",
  } satisfies Record<LineOutcome, string>,

  responsible: {
    title: "Gioco responsabile",
    description:
      "Il gioco deve restare un passatempo. Questi strumenti ti aiutano a tenerlo sotto controllo.",
    loginForTools: "Accedi per impostare limiti, promemoria, pause e autoesclusione.",
    tips: "Qualche regola semplice",
    tipsList: [
      "Decidi prima quanto puoi permetterti di perdere e quanto tempo dedicare.",
      "Non giocare per recuperare le perdite né per risolvere problemi economici.",
      "Fai pause regolari e non giocare se sei stanco, triste o hai bevuto.",
      "Il gioco non è un modo per guadagnare: in media si perde.",
    ],
    limits: "Limiti",
    limitsText: "Riduzioni subito; aumenti e rimozioni dopo 7 giorni.",
    depositDay: "Ricarica massima in 24 ore (€)",
    depositWeek: "Ricarica massima in 7 giorni (€)",
    depositMonth: "Ricarica massima in 30 giorni (€)",
    lossDay: "Perdita massima in 24 ore (€)",
    sessionMinutes: "Durata massima della sessione",
    realityCheck: "Promemoria del tempo di gioco ogni",
    emptyHint: "Lascia vuoto per nessun limite.",
    current: (value: string) => `In vigore: ${value}`,
    pending: (date: string) => `Modifica meno restrittiva in attesa: valida dal ${date}`,
    saved: "Limiti aggiornati",
    savedPending: (date: string) => `Riduzioni attive subito; aumenti dal ${date}`,
    session: {
      "": "Nessun limite",
      "30": "30 minuti",
      "60": "1 ora",
      "120": "2 ore",
      "240": "4 ore",
    },
    reality: { "15": "15 minuti", "30": "30 minuti", "60": "60 minuti" },
    pause: "Pausa",
    pauseText:
      "Sospendi gioco e ricariche per un periodo. Non si può annullare prima della scadenza.",
    pauseFor: (days: number) => `Pausa di ${days} ${plural(days, "giorno", "giorni")}`,
    pauseTitle: (days: number) =>
      `Confermi una pausa di ${days} ${plural(days, "giorno", "giorni")}?`,
    pauseConfirm: "Fino alla scadenza non potrai giocare né ricaricare. Potrai prelevare il saldo.",
    paused: (until: string) => `Pausa attiva fino al ${until}`,
    exclusion: "Autoesclusione",
    duration: "Durata",
    exclusionText:
      "Ti escludi dal gioco per un periodo o a tempo indeterminato. In produzione l'autoesclusione è comunicata al Registro unico delle autoesclusioni di ADM e vale presso tutti gli operatori.",
    exclusionFor: (days: number | null) =>
      days === null ? "A tempo indeterminato" : `${days} giorni`,
    exclusionTitle: "Confermi l'autoesclusione?",
    exclusionConfirm: (label: string) =>
      `Durata: ${label}. Non potrai giocare né ricaricare; quella a tempo indeterminato si può revocare solo dopo 6 mesi. Potrai prelevare il saldo.`,
    excluded: "Autoesclusione attiva",
    selfTest: "Test di autovalutazione",
    selfTestText: "Due domande (test Lie/Bet). Le risposte restano anonime e non sono salvate.",
    questions: [
      "Hai mai sentito il bisogno di giocare somme di denaro sempre maggiori?",
      "Hai mai dovuto mentire a persone importanti per te su quanto giochi?",
    ],
    selfTestSubmit: "Vedi il risultato",
    selfTestOk:
      "Dalle risposte non emergono segnali di rischio. Tieni comunque attivi i tuoi limiti.",
    selfTestAttention:
      "Almeno una risposta positiva: è consigliabile parlarne con un professionista. Puoi chiamare il Telefono Verde, anonimo e gratuito.",
    help: "Chiedi aiuto",
    helpText:
      "Se il gioco ti crea problemi, o li crea a una persona vicina, puoi chiedere aiuto in modo anonimo e gratuito.",
    call: (display: string) => `Chiama il ${display}`,
  },

  rgEvents: {
    limit_set: "Limiti impostati",
    limit_hit: "Limite raggiunto",
    reality_check: "Promemoria del tempo di gioco",
    session_limit: "Limite di sessione",
    pause: "Pausa",
    self_exclusion: "Autoesclusione",
    self_test: "Test di autovalutazione",
  } satisfies Record<RgEventKind, string>,

  signals: {
    limit_hits: "Limiti raggiunti spesso",
    night_play: "Gioco notturno ricorrente",
    long_sessions: "Sessioni oltre 3 ore",
    deposit_growth: "Ricariche in forte aumento",
    limit_increase: "Aumento dei limiti in attesa",
  } satisfies Record<RiskSignal, string>,

  rules: {
    title: "Regole e probabilità di vincita",
    description: "Come funzionano quote, liquidazione e giochi, e quanto si può vincere.",
  },

  legal: {
    templateNote:
      "Testo di esempio da adattare con un legale: dati della società, concessione ADM e regolamenti reali vanno inseriti prima della pubblicazione.",
    terms: "Termini e condizioni del conto di gioco",
    privacy: "Informativa privacy",
  },

  panel: {
    area: "Pannello operatore",
    nav: {
      dashboard: "Panoramica",
      players: "Giocatori",
      events: "Eventi",
      site: "Vai al sito",
      more: "Altro",
    },
    dashboard: {
      title: "Panoramica",
      description: "Attività degli ultimi 30 giorni (crediti demo).",
      active: "Giocatori attivi (7 giorni)",
      staked: "Raccolta",
      ggr: "Raccolta meno vincite",
      exposure: "Scommesse aperte",
      exposureHint: (amount: string) => `Vincite potenziali ${amount}`,
      chart: "Raccolta per giorno",
      chartLabel: "Raccolta giornaliera degli ultimi 30 giorni",
      attention: "Giocatori da seguire",
      attentionText:
        "Segnali di gioco a rischio negli ultimi 7 giorni. Non sono diagnosi: indicano chi contattare.",
      attentionEmpty: "Nessun segnale negli ultimi 7 giorni",
      kyc: "Documenti da verificare",
      kycEmpty: "Nessun documento in attesa",
    },
    players: {
      title: "Giocatori",
      description: "Verifica dell'identità, limiti, pause e segnali di rischio.",
      search: "Cerca per nome, email o codice fiscale",
      filters: {
        all: "Tutti",
        kyc: "Da verificare",
        signals: "Con segnali",
        blocked: "In pausa o esclusi",
      },
      columns: {
        player: "Giocatore",
        kyc: "Identità",
        balance: "Saldo",
        limits: "Ricarica 7 gg",
        state: "Stato",
        signals: "Segnali",
      },
      active: "Attivo",
      empty: "Nessun giocatore con questi filtri",
      approve: "Approva documento",
      reject: "Rifiuta",
      approved: "Identità verificata",
      rejected: "Verifica respinta",
      note: "Nota interna",
      noteHint: "Visibile solo agli operatori. Annota contatti e interventi di gioco responsabile.",
      noteSaved: "Nota salvata",
      history: "Gioco responsabile",
      exclusionLocked: "Pause e autoesclusioni non si possono revocare dal pannello.",
      age: (n: number) => `${n} anni`,
      details: (name: string) => `Scheda di ${name}`,
    },
    events: {
      title: "Eventi",
      description: "Inserisci il risultato per liquidare le scommesse aperte.",
      filters: { open: "Da refertare", upcoming: "In programma", finished: "Conclusi" },
      result: "Risultato",
      home: "Casa",
      away: "Ospite",
      settle: "Conferma risultato",
      cancel: "Annulla evento",
      settled: (n: number) =>
        `Risultato registrato: ${n} ${plural(n, "scommessa liquidata", "scommesse liquidate")}`,
      cancelled: "Evento annullato: scommesse rimborsate",
      cancelTitle: "Annullare l'evento?",
      cancelText: "Gli esiti di questo evento valgono quota 1; le singole vengono rimborsate.",
      openBets: (n: number) => `${n} ${plural(n, "scommessa aperta", "scommesse aperte")}`,
      empty: "Nessun evento",
      notStarted: "Non ancora iniziato",
    },
    settings: {
      reset: "Ripristina dati demo",
      resetTitle: "Ripristinare i dati demo?",
      resetText: "Le modifiche fatte finora verranno perse.",
    },
  },

  validation: {
    required: "Campo obbligatorio",
    email: "Inserisci un indirizzo email valido",
    tooLong: (max: number) => `Massimo ${max} caratteri`,
    date: "Inserisci una data valida",
    adult: "Devi avere almeno 18 anni",
    fiscalCode: "Codice fiscale non valido",
    fiscalCodeBirth: "Il codice fiscale non corrisponde alla data di nascita",
    password: "Almeno 10 caratteri",
    document: "Da 5 a 12 lettere o cifre",
    documentExpired: "Documento scaduto",
    amount: (min: number, max: number) => `Inserisci un importo tra ${min} e ${max} €`,
    terms: "Devi accettare i termini per aprire il conto",
    privacy: "Conferma di aver letto l'informativa",
  },

  errors: {
    genericTitle: "Qualcosa è andato storto",
    genericBody:
      "Si è verificato un errore imprevisto. Riprova; se il problema continua, contatta l'assistenza.",
    retry: "Riprova",
    notFoundTitle: "Pagina non trovata",
    notFoundBody: "La pagina che cerchi non esiste o è stata spostata.",
    goHome: "Torna alla pagina iniziale",
    storage:
      "Il browser non consente di salvare i dati: le modifiche demo andranno perse alla chiusura.",
  },
};

export { plural };
