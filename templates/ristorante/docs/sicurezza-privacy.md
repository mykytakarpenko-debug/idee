# Sicurezza, privacy, accessibilità e prestazioni — Tavola

> Indicazioni tecniche e organizzative, non consulenza legale. Prima della messa in produzione verifica gli obblighi con il tuo consulente privacy, con il commercialista e, per gli allergeni, con il responsabile HACCP.

## Sicurezza

### Già presente nel template

| Misura                    | Dettaglio                                                                                                                                |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Header di sicurezza       | `next.config.ts`: Content-Security-Policy, HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` restrittiva |
| CSP                       | `default-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`; domini della toolbar Vercel ammessi solo sulle preview              |
| Nessun segreto nel codice | Solo variabili `NEXT_PUBLIC_*` non sensibili; `.env*` ignorati da git tranne `.env.example`                                              |
| Validazione               | Schemi Zod per prenotazione, checkout e moduli del pannello (lunghezze, formati, importi, CAP, orari)                                    |
| Rendering sicuro          | Nessun HTML da dati utente; JSON-LD serializzato con `<` neutralizzato; `.ics` con testo protetto (virgole, punti e virgola, a capo)     |
| Indicizzazione            | Pannello, checkout e tracking sempre esclusi; sito indicizzabile solo su richiesta                                                       |
| Pannello                  | `noindex` e avviso in `app/gestione/layout.tsx`: **in demo non è protetto**, va messo dietro autenticazione prima della produzione       |

### Da fare con il backend

- **Autenticazione e ruoli** per `/gestione` (titolare, sala, cucina) con controllo dei permessi lato server in ogni azione.
- **Ricalcolo lato server** di disponibilità, totali, costi di consegna e zone servite: mai fidarsi di prezzi o totali inviati dal browser.
- **Vincolo di non sovrapposizione** delle prenotazioni nel database (vedi [architettura](architettura.md#collegare-un-backend)).
- **Anti-abuso** su prenotazioni e ordini: rate limiting per IP e telefono, CAPTCHA rispettoso della privacy solo in caso di abuso, conferma via SMS/email per i gruppi numerosi.
- **Tracking con token** non indovinabile invece del solo numero d'ordine.
- **Pagamenti** tramite PSP conforme PCI-DSS (es. Stripe Checkout); l'ordine diventa definitivo solo dopo il webhook di pagamento.
- **Dipendenze** aggiornate (Dependabot è configurato) e `npm audit` in CI.

## Privacy (GDPR)

### Dati trattati

Nome, telefono, email, numero di persone, data e ora, note (possono contenere **allergie o intolleranze**), indirizzo di consegna, storico degli ordini, consenso marketing.

### Principi applicati nel template

- **Consensi separati:** l'accettazione dell'informativa per gestire prenotazione/ordine è distinta dal consenso **facoltativo** alle comunicazioni promozionali, non preselezionato (art. 7 GDPR).
- **Minimizzazione:** solo i dati necessari; l'indirizzo è richiesto solo per la consegna.
- **Dati relativi alla salute:** le note su allergie possono essere dati particolari (art. 9). Usali solo per servire il cliente, limita l'accesso allo staff interessato e cancellali dopo il servizio.
- **Privacy by default:** in demo nessun dato lascia il browser; nessun cookie di profilazione o tracciamento di terze parti.

### Prima della produzione

- [ ] Completa l'informativa in `/privacy` (titolare, finalità, basi giuridiche, tempi di conservazione, diritti, contatti).
- [ ] Registro dei trattamenti (art. 30) e nomina dei fornitori come responsabili (art. 28): hosting, database, email/SMS, pagamenti, eventuali rider esterni.
- [ ] Tempi di conservazione: ad esempio prenotazioni cancellate dopo 12 mesi, note sulle allergie subito dopo il servizio, dati fiscali per 10 anni.
- [ ] Cookie banner solo se aggiungi strumenti non tecnici (analytics, pixel, mappe incorporate).
- [ ] Il link "Indicazioni stradali" apre il servizio di mappe in una nuova scheda: non incorporare mappe di terzi senza consenso.

## Allergeni e vendita di alimenti

- **Reg. UE 1169/2011, art. 9 e allegato II:** i 14 allergeni devono essere indicati per ogni piatto, anche per la vendita a distanza **prima dell'acquisto** e alla consegna. Il template li mostra nel menu, nella pagina Ordina e nel modulo del piatto. Mantienili aggiornati a ogni cambio di ricetta e segnala il rischio di contaminazione crociata (avviso già presente nel menu).
- **Codice del Consumo:** nel checkout sono mostrati prezzi IVA inclusa, costi di consegna e totale prima dell'invio. Per i beni deperibili il diritto di recesso è escluso (art. 59, lett. d), come indicato nel riepilogo. Pubblica anche le **condizioni di vendita** e i dati dell'esercente (ragione sociale, P. IVA, sede).
- **Bevande alcoliche:** se le vendi a domicilio, verifica l'età alla consegna (divieto di vendita ai minori di 18 anni) e le eventuali licenze; nel template le bevande alcoliche sono "solo in sala" (`orderable: false`).
- **Fiscale:** l'ordine online non sostituisce scontrino o fattura. Collega il registratore telematico o un provider certificato.

## Accessibilità

**Obiettivo:** WCAG 2.2 livello AA. L'**European Accessibility Act** (D.Lgs. 82/2022, in vigore dal 28 giugno 2025) si applica ai servizi di commercio elettronico verso i consumatori: un sito che vende online cibo o servizi di prenotazione rientra tipicamente nel perimetro (con esenzione per le microimprese). Prevedi una **dichiarazione di accessibilità**.

### Implementato

- Contrasti verificati per tutti i token in tema chiaro e scuro ([design system](design-system.md#contrasti-verificati-wcag-22-aa)).
- Link "Vai al contenuto principale", landmark corretti, un solo `h1` per pagina, titoli dei piatti come `h3` sotto le categorie.
- Scelta di persone e orari come `radiogroup` navigabili; orari pieni annunciati come "non disponibile".
- Filtri con `aria-pressed` e conteggio dei risultati in `aria-live`; stepper del tracking con `aria-current="step"`.
- Moduli con etichette collegate, errori annunciati, focus sul primo errore, `autocomplete` e `inputmode` corretti.
- Pulsanti di quantità con etichette esplicite ("Aumenta quantità di …"); tavoli della mappa come pulsanti con nome, posti e stato.
- Stati sempre con testo; `prefers-reduced-motion` rispettato; target di almeno 40 px su mobile.
- axe-core su tutte le pagine (chiaro e scuro) in CI.

### Verifica manuale prima di ogni rilascio

- [ ] Prenotazione e ordine completi solo da tastiera e con VoiceOver (iOS) / TalkBack (Android).
- [ ] Zoom al 200% e larghezza di 320 px senza scroll orizzontale.
- [ ] Pannello usabile su tablet in orizzontale e verticale, anche con i guanti (target ampi).

## Prestazioni

| Scelta                                            | Effetto                                                                |
| ------------------------------------------------- | ---------------------------------------------------------------------- |
| Sito prerenderizzato con menu nell'HTML           | Primo caricamento dalla CDN, contenuto subito visibile e indicizzabile |
| Nessuna immagine obbligatoria                     | LCP basso anche su rete mobile; aggiungi foto con `next/image`         |
| Font self-hosted (`display: swap`)                | Nessuna richiesta a terzi, niente testo invisibile                     |
| Tracking con rendering parziale                   | Guscio statico immediato, dati dell'ordine in streaming                |
| Calcoli puri con `useMemo`, salvataggio differito | Interazioni rapide anche con centinaia di prenotazioni                 |

**Obiettivi Core Web Vitals:** LCP < 2,5 s, INP < 200 ms, CLS < 0,1. Misurali in produzione con Vercel Speed Insights o Lighthouse sulle preview.
