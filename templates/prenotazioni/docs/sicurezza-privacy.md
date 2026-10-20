# Sicurezza, privacy, accessibilità e prestazioni — Agenda

> Indicazioni tecniche e organizzative, non consulenza legale. Verifica gli obblighi con il consulente privacy e, per le professioni regolamentate, con il tuo ordine professionale.

## Sicurezza

### Già presente nel template

| Misura                      | Dettaglio                                                                                                                                             |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header di sicurezza e CSP   | `next.config.ts`: CSP senza `eval` in produzione, HSTS, `nosniff`, `Referrer-Policy`, `Permissions-Policy`                                            |
| Protezione dal clickjacking | Tutte le pagine con `frame-ancestors 'none'` e `X-Frame-Options: DENY`; solo `/widget` è incorporabile, e solo dai domini in `WIDGET_FRAME_ANCESTORS` |
| Nessun segreto              | Solo variabili non sensibili; `.env.example` documentato                                                                                              |
| Validazione                 | Schemi Zod per dati del cliente, codice, servizi, dati dello studio e regole                                                                          |
| Disponibilità ricontrollata | `book` e `reschedule` ricalcolano gli orari liberi prima di salvare: lo stesso controllo va fatto sul server                                          |
| Codici leggibili            | Alfabeto senza caratteri ambigui (0/O, 1/I)                                                                                                           |
| Indicizzazione              | Pannello, widget e pagine delle prenotazioni mai indicizzati; pagina pubblica solo su richiesta                                                       |
| Rendering sicuro            | JSON-LD con `<` neutralizzato; testi del file `.ics` protetti; nessun HTML da dati utente                                                             |

### Da fare in produzione

- **Il codice da solo non basta:** 6 caratteri sono comodi al telefono ma indovinabili per tentativi. Il link nell'email deve contenere un token lungo e casuale; la ricerca per codice va limitata (rate limiting) e, se possibile, abbinata all'email del cliente.
- **Pannello protetto** con autenticazione, MFA per lo staff e ruoli separati; sessioni in cookie `HttpOnly`, `Secure`, `SameSite=Lax`.
- **Anti-spam** sulla prenotazione: rate limiting per IP, eventuale CAPTCHA rispettoso della privacy, verifica dell'email per le richieste gratuite.
- **Widget:** indica solo i domini che controlli in `WIDGET_FRAME_ANCESTORS`; non usare `*`.

## Privacy (GDPR)

### Dati trattati

Nome, email, telefono, servizio, professionista, data e ora, note facoltative, consenso marketing, origine della prenotazione, cronologia delle modifiche.

### Principi applicati

- **Minimizzazione:** solo i campi necessari a fissare e ricordare l'appuntamento. Le note sono facoltative e avvisano di **non inserire dati sanitari** o informazioni non necessarie.
- **Consensi separati:** il consenso al trattamento per gestire l'appuntamento è distinto da quello, facoltativo, per comunicazioni e novità. Nessuna casella è preselezionata.
- **Trasparenza:** link all'informativa accanto al consenso; condizioni di spostamento e cancellazione scritte prima dell'invio.
- **Nessun tracciamento:** il template non usa cookie di profilazione né strumenti di analisi; il salvataggio nel browser è solo funzionale alla demo.

### Dati sanitari e segreto professionale

- Per **studi medici, dentisti, psicologi, fisioterapisti** anche il solo fatto di prenotare una certa visita può rivelare informazioni sulla salute (art. 9 GDPR). Usa nomi di servizio neutri dove possibile, cifra il database, limita gli accessi per ruolo e non inviare dettagli clinici via email o SMS.
- Per **avvocati e commercialisti** vale il segreto professionale: le note del cliente vanno trattate come riservate e mai incluse nei promemoria.

### Prima della produzione

- [ ] Informativa completa (`/privacy`) con titolare, finalità, basi giuridiche, tempi di conservazione (es. 24 mesi dopo l'ultimo appuntamento, 10 anni per i dati fiscali) e diritti.
- [ ] Registro dei trattamenti (art. 30) e nomina dei fornitori come responsabili (art. 28): hosting, database, email/SMS, videochiamate, calendari esterni.
- [ ] Procedura per accesso, rettifica e cancellazione dei dati su richiesta del cliente.
- [ ] Se usi videochiamate, scegli fornitori con dati in UE o adeguate garanzie per il trasferimento.

## Tutela del consumatore

- **Prezzi chiari:** il prezzo mostrato è indicativo e IVA inclusa; se cambia dopo il preventivo, dillo prima della prestazione (già scritto nel modulo).
- **Cancellazione:** le condizioni devono essere note prima della conferma e coerenti con il limite impostato nelle regole. Se chiedi caparre o penali, indicale in modo chiaro e proporzionato.
- **Contratti a distanza** (Codice del Consumo, artt. 49 e seguenti): per servizi pagati online valuta il diritto di recesso e l'eventuale richiesta espressa di iniziare la prestazione prima della scadenza del termine.

## Accessibilità

**Obiettivo:** WCAG 2.2 AA. L'**European Accessibility Act** (D.Lgs. 82/2022, in vigore dal 28 giugno 2025) si applica ai servizi prestati online ai consumatori, come la prenotazione e il pagamento di servizi. Prevedi una **dichiarazione di accessibilità**; le microimprese possono essere esentate.

### Implementato

- Calendario con giorni come pulsanti dal nome completo e stato (`aria-pressed`, "disponibile"/"non disponibile"); orari come `radiogroup` con pulsanti da 44 px.
- Prenotazione a passi con `aria-current="step"`, focus sul titolo a ogni passo, riepilogo in un riquadro con etichetta.
- Scelte con veri `input type="radio"`: frecce, spazio e lettori di schermo funzionano in modo nativo.
- Errori collegati ai campi, annunci di conferma in `aria-live`, azioni distruttive con `alertdialog`.
- Stati con icona, colore e testo; nessuna informazione affidata al solo colore.
- Campi orari e date nativi del browser (tastiera e lettori di schermo già supportati, formato della lingua dell'utente).
- axe-core su tutte le pagine, sui passi della prenotazione con errori, sulla scheda appuntamento e sul modulo servizio, in chiaro e scuro; navigazione da tastiera e `prefers-reduced-motion` verificati nei test.

### Verifica manuale prima di ogni rilascio

- [ ] Prenotazione completa, spostamento e cancellazione solo da tastiera e con VoiceOver/TalkBack.
- [ ] Widget dentro un `iframe` nel sito ospite: titolo dell'`iframe`, focus visibile, nessuna doppia barra di scorrimento.
- [ ] Zoom al 200% e larghezza di 320 px.

## Prestazioni

| Scelta                                                        | Effetto                                           |
| ------------------------------------------------------------- | ------------------------------------------------- |
| Pagina pubblica prerenderizzata con dati statici di fallback  | Contenuti immediati e indicizzabili               |
| Nessuna immagine obbligatoria, un solo font self-hosted       | LCP basso anche su rete mobile                    |
| Calcolo degli orari memoizzato per servizio, persona e giorno | Calendario reattivo con centinaia di appuntamenti |
| Salvataggio locale differito                                  | Nessun blocco dell'interfaccia                    |

**Obiettivi Core Web Vitals:** LCP < 2,5 s, INP < 200 ms, CLS < 0,1.
