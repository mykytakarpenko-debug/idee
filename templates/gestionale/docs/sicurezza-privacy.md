# Sicurezza, privacy, accessibilità e prestazioni — Nucleo

> Queste indicazioni sono tecniche e organizzative, non consulenza legale. Prima della messa in produzione verifica gli obblighi specifici con il tuo consulente privacy e con il commercialista.

## Sicurezza

### Già presente nel template

| Misura                    | Dettaglio                                                                                                                                                                                       |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header di sicurezza       | `next.config.ts`: Content-Security-Policy, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` restrittiva, header `X-Powered-By` rimosso |
| CSP                       | `default-src 'self'`, niente `eval` in produzione, `frame-ancestors 'none'`, `object-src 'none'`. I domini della toolbar Vercel sono ammessi **solo** sulle preview                             |
| Nessun segreto nel codice | Solo variabili `NEXT_PUBLIC_*` non sensibili; `.env*` ignorati da git tranne `.env.example`                                                                                                     |
| Validazione               | Schemi Zod per ogni modulo, con controllo di lunghezze, formati e importi                                                                                                                       |
| Export sicuri             | CSV con neutralizzazione delle formule (prevenzione CSV injection) e BOM UTF-8                                                                                                                  |
| Rendering sicuro          | Nessun `dangerouslySetInnerHTML` con dati utente; l'unico script in linea è quello statico del tema                                                                                             |
| Recupero password         | Messaggio identico che l'account esista o no (niente enumerazione delle email)                                                                                                                  |
| Indicizzazione            | `robots` disattivo e `noindex` per impostazione predefinita                                                                                                                                     |

### Da fare con il backend

- **Autenticazione** con un provider affidabile; sessioni in cookie `HttpOnly`, `Secure`, `SameSite=Lax`; MFA per il titolare.
- **Autorizzazione lato server** in ogni Server Action o API: non fidarti mai dei controlli fatti solo nell'interfaccia.
- **Rivalidazione** dell'input lato server con gli stessi schemi Zod.
- **Rate limiting** su accesso, recupero password e API pubbliche (es. Upstash Ratelimit o Vercel Firewall).
- **Audit log** delle operazioni su pagamenti, dati dei clienti ed esportazioni.
- **Backup** automatici del database con test di ripristino periodici.
- **Dipendenze:** Dependabot è configurato nel repository; esegui `npm audit` in CI e aggiorna regolarmente.
- **CSP più rigorosa:** per eliminare `'unsafe-inline'` usa i nonce tramite `proxy.ts` (vedi la guida "Content Security Policy" di Next.js). Le pagine diventeranno dinamiche: valuta il compromesso con le prestazioni.

## Privacy (GDPR) e obblighi fiscali

### Dati trattati

Anagrafica e contatti dei clienti, storico di appuntamenti e pagamenti, note interne, consenso marketing; dati dello staff.

### Principi applicati nel template

- **Minimizzazione:** l'email del cliente è facoltativa e non ci sono campi per dati sensibili. La nota interna avvisa di non inserire dati sanitari.
- **Consenso separato e facoltativo** per le comunicazioni promozionali (art. 7), mostrato nella scheda cliente.
- **Diritto di accesso e portabilità** (artt. 15 e 20): "Esporta dati (GDPR)" nella scheda cliente genera un JSON leggibile.
- **Diritto alla cancellazione** (art. 17): eliminando un cliente si cancellano anagrafica e appuntamenti futuri. I **pagamenti restano registrati** perché la normativa fiscale impone di conservare le scritture contabili (in Italia di norma 10 anni, art. 2220 c.c.).
- **Privacy by default:** in demo nessun dato lascia il browser; non ci sono cookie di profilazione né tracciamenti di terze parti.

### Prima della produzione

- [ ] Informativa privacy per clienti e staff (artt. 13–14) e base giuridica di ogni trattamento (contratto, obbligo legale, consenso).
- [ ] Registro delle attività di trattamento (art. 30).
- [ ] Nomina dei fornitori come responsabili del trattamento (art. 28): hosting, database, email/SMS, pagamenti.
- [ ] Dati ospitati nell'UE: la regione `fra1` è impostata in `vercel.json`; scegli anche il database in UE.
- [ ] Tempi di conservazione definiti, ad esempio la cancellazione dei clienti inattivi dopo N anni (eccetto i dati fiscali).
- [ ] Procedura di gestione delle violazioni (data breach, notifica entro 72 ore, art. 33).
- [ ] Cookie banner solo se aggiungi strumenti non tecnici (analytics, marketing).
- [ ] **Fiscale:** la ricevuta del template è un documento di cortesia **non fiscale**. Per i corrispettivi (registratore telematico) e la fattura elettronica tramite SDI usa un provider certificato e fai verificare il flusso dal commercialista.
- [ ] **Pagamenti online:** affidati a un PSP conforme a PCI-DSS (es. Stripe) e non memorizzare mai i dati delle carte.

## Accessibilità

**Obiettivo:** conformità **WCAG 2.2 livello AA**.

### Implementato

- Contrasti verificati per tutti i token, in tema chiaro e scuro (vedi [design system](design-system.md#contrasti-verificati-wcag-22-aa)).
- Link "Vai al contenuto principale", landmark (`header`, `nav`, `main`, `aside`) e un solo `h1` per pagina.
- Navigazione completa da tastiera: focus visibile, modali con focus intrappolato e chiusura con Esc, menu con le frecce, ⌘K/Ctrl+K, frecce ← → nei grafici.
- Moduli con etichette collegate, errori annunciati tramite `aria-describedby`, focus sul primo errore, `autocomplete` e `inputmode` corretti.
- Stati espressi con colore, icona e testo; badge con testo; legende testuali nei grafici.
- Annunci con `aria-live` per i risultati dei filtri e i toast; `aria-sort` sulle tabelle; `aria-current` sulla navigazione.
- `prefers-reduced-motion` rispettato; supporto a `forced-colors`; target touch di almeno 40 px su mobile.
- Test automatici con axe-core su tutte le pagine (chiaro e scuro) in CI.

### Verifica manuale prima di ogni rilascio

- [ ] Percorso completo solo da tastiera: creare un cliente, un appuntamento e registrare un pagamento.
- [ ] Screen reader: VoiceOver su macOS/iOS e NVDA su Windows sulle pagine principali.
- [ ] Zoom al 200% e testo al 200% senza perdita di contenuti; larghezza di 320 px senza scroll orizzontale.
- [ ] Contrasto forzato di Windows e modalità scura del sistema.

Nota normativa: l'European Accessibility Act (in vigore dal 28 giugno 2025) riguarda soprattutto i servizi rivolti ai consumatori, come e-commerce e prenotazioni online. Un gestionale interno potrebbe non rientrarvi, ma resta buona pratica rispettare le WCAG.

## Prestazioni

| Scelta                                                                     | Effetto                                                                    |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Pagine prerenderizzate staticamente (Cache Components)                     | Primo caricamento servito dalla CDN                                        |
| Nessuna libreria di grafici, solo primitive Radix importate per componente | Bundle contenuto                                                           |
| Font self-hosted con `display: swap`                                       | Nessuna richiesta a terzi e niente testo invisibile durante il caricamento |
| Scheletri con le stesse dimensioni del contenuto                           | Layout stabile (CLS ≈ 0)                                                   |
| Calcoli con `useMemo`, calendario limitato all'intervallo visibile         | Interazioni rapide anche con ~5.000 appuntamenti                           |
| Salvataggio locale differito                                               | Nessun blocco dell'interfaccia durante le modifiche                        |
| Activity di Next.js 16                                                     | Le pagine visitate da poco si riaprono all'istante con lo stato conservato |

**Obiettivi Core Web Vitals:** LCP < 2,5 s, INP < 200 ms, CLS < 0,1. Per misurarli in produzione attiva Vercel Speed Insights oppure usa Lighthouse sulle preview.
