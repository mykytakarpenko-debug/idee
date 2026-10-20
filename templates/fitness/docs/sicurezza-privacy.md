# Sicurezza, privacy, accessibilità e prestazioni — Forma

> Indicazioni tecniche e organizzative, non consulenza legale. Verifica gli obblighi con il consulente privacy, il commercialista e, per lo sport dilettantistico, con il tuo ente di promozione sportiva.

## Sicurezza

### Già presente nel template

| Misura                    | Dettaglio                                                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Header di sicurezza e CSP | `next.config.ts`: CSP senza `eval` in produzione, HSTS, `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` |
| Nessun segreto            | Solo variabili `NEXT_PUBLIC_*` non sensibili; `.env.example` documentato                                                             |
| Validazione               | Schemi Zod per prova gratuita, accesso, profilo, iscritto, piano e impostazioni                                                      |
| Regole di dominio pure    | Le stesse funzioni (`checkBooking`, `checkInEligibility`) vanno eseguite lato server                                                 |
| Indicizzazione            | Area socio, accesso e pannello mai indicizzati; sito solo su richiesta                                                               |
| Rendering sicuro          | JSON-LD serializzato con `<` neutralizzato; nessun HTML da dati utente                                                               |

### Importante: la sessione demo non è autenticazione

In demo l'area socio salva nel `localStorage` solo l'ID del socio demo e **non verifica credenziali**. In produzione:

- autenticazione con un provider affidabile;
- sessioni in cookie `HttpOnly`, `Secure`, `SameSite=Lax`, e nessun token nel `localStorage`;
- MFA per lo staff;
- ruoli separati (reception, istruttore, titolare);
- rate limiting su accesso, prova gratuita e prenotazioni.

## Privacy (GDPR)

### Dati trattati

Anagrafica e contatti, piano e pagamenti, prenotazioni, presenze e ingressi, **data di scadenza del certificato medico**, consensi (marketing, immagini), richieste di prova.

### Certificato medico e dati sanitari

- Il certificato attesta l'idoneità fisica: è un **dato relativo alla salute** (art. 9 GDPR).
- Il template applica la **minimizzazione**: conserva **solo la data di scadenza**. Il documento si mostra in reception e non viene caricato né archiviato online. L'interfaccia lo dice al socio e allo staff.
- Le note interne sull'iscritto avvisano di non inserire informazioni sanitarie (infortuni, patologie).
- Valuta con il consulente se il certificato è obbligatorio per legge, regolamento regionale o regolamento della struttura. L'obbligo si attiva o disattiva in _Impostazioni → Regole_.

### Consensi e diritti

- Consensi **separati e facoltativi** per comunicazioni promozionali e uso delle immagini (foto delle lezioni). Il socio li gestisce dal profilo.
- **Accesso e portabilità** (artt. 15 e 20): "Scarica i miei dati" nel profilo del socio ed "Esporta dati (GDPR)" nella scheda iscritto generano un JSON.
- **Minori:** la prova gratuita richiede di dichiarare la maggiore età. Per gli iscritti minorenni servono il consenso e i dati di un genitore o tutore (da aggiungere al modulo se il club accetta minori).
- **Conservazione:** definisci i tempi. Ad esempio:
  - prove non convertite: 6 mesi;
  - ex iscritti: 24 mesi;
  - dati fiscali: 10 anni.

### Prima della produzione

- [ ] Informativa completa (`/privacy`) e registro dei trattamenti (art. 30).
- [ ] Nomina dei fornitori come responsabili (art. 28): hosting, database, email/SMS, pagamenti, tornelli o app di accesso.
- [ ] Videosorveglianza nella struttura: informativa breve e rispetto delle regole del Garante (fuori dallo scopo del template).

## Contratti, rinnovi e pagamenti

- **Informazioni precontrattuali** (Codice del Consumo, artt. 48–49): prezzo totale IVA inclusa, durata, rinnovo, recesso, condizioni di sospensione. La pagina _Prezzi_ ne riassume i punti principali; le condizioni complete vanno fornite prima del pagamento.
- **Recesso** per i contratti a distanza: 14 giorni (art. 52). Se il socio ha iniziato ad allenarsi, si rimborsa la parte non usufruita (art. 57). La regola è riportata nella pagina _Abbonamento_ dell'area socio.
- **Rinnovo automatico e disdetta:** il rinnovo deve essere chiaro prima dell'acquisto, con data e importo del prossimo addebito sempre visibili. La disdetta deve essere semplice quanto l'adesione: nel template basta un interruttore con conferma.
- **Pagamenti ricorrenti:** affidali a un PSP conforme PCI-DSS. Per l'addebito SEPA serve un mandato firmato elettronicamente. Non memorizzare mai i dati della carta.
- **Fiscale e terzo settore:** per ASD/SSD le quote associative e i corrispettivi specifici hanno regimi IVA dedicati e serve la tessera dell'ente di affiliazione. Fai verificare il flusso dal commercialista.

## Accessibilità

**Obiettivo:** WCAG 2.2 AA. L'**European Accessibility Act** (D.Lgs. 82/2022, in vigore dal 28 giugno 2025) si applica ai servizi venduti online ai consumatori, come la sottoscrizione di abbonamenti dal sito. Prevedi una **dichiarazione di accessibilità**; le microimprese possono essere esentate.

### Implementato

- Contrasti verificati in entrambi i temi; categorie con colore + nome; intensità con barre + testo.
- Selettore dei giorni come `radiogroup` con nome completo del giorno; filtri con `aria-pressed`; conteggi in `aria-live`.
- Motivi espliciti al posto dei pulsanti disabilitati; conferme `alertdialog` per cancellazioni tardive, disdetta e annullamento lezioni.
- Esito del check-in annunciato (`aria-live`) con icona, colore e testo; barre di riempimento con `role="meter"`.
- Tabelle sostituite da elenchi su mobile (nessuno scorrimento orizzontale); target dei link di contatto ≥ 24 px.
- axe-core su tutte le pagine e sulle schede iscritto e lezione, in chiaro e scuro; `prefers-reduced-motion` verificato.

### Verifica manuale prima di ogni rilascio

- [ ] Prenotazione, cancellazione e disdetta solo da tastiera e con VoiceOver/TalkBack.
- [ ] Check-in da tastiera (ricerca → selezione → registrazione) con lettore di schermo.
- [ ] Zoom al 200% e larghezza di 320 px.

## Prestazioni

| Scelta                                                  | Effetto                                                      |
| ------------------------------------------------------- | ------------------------------------------------------------ |
| Sito prerenderizzato con dati statici di fallback       | Contenuti immediati e indicizzabili                          |
| Nessuna immagine obbligatoria, font self-hosted         | LCP basso anche su rete mobile                               |
| Calcoli puri memoizzati, selettori senza array derivati | Interazioni rapide con ~2.000 prenotazioni e ~1.000 ingressi |
| Salvataggio locale differito                            | Nessun blocco dell'interfaccia                               |

**Obiettivi Core Web Vitals:** LCP < 2,5 s, INP < 200 ms, CLS < 0,1.
