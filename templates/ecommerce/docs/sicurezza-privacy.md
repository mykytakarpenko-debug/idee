# Sicurezza, privacy, norme e accessibilità — Bottega

> Indicazioni tecniche e organizzative, non consulenza legale. Fai verificare condizioni di vendita, informative e processi da un legale e dal commercialista prima della pubblicazione.

## Sicurezza

### Già presente nel template

| Misura                    | Dettaglio                                                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Header di sicurezza e CSP | `next.config.ts`: CSP senza `eval` in produzione, HSTS, `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` |
| Nessun dato di pagamento  | Il checkout non raccoglie dati di carta: il pagamento avviene sul PSP                                                                |
| Totali ricalcolati        | `placeOrder` ignora i prezzi del browser e ricalcola righe, codice, spedizione e scorte; lo stesso va fatto sul server               |
| Validazione               | Schemi Zod per checkout, area personale, prodotti, codici, spedizioni e dati legali                                                  |
| Indicizzazione            | Carrello, checkout, ordini, area personale e pannello mai indicizzati                                                                |
| Rendering sicuro          | JSON-LD con `<` neutralizzato; nessun HTML da dati utente                                                                            |

### Da fare in produzione

- **PSP conforme PCI-DSS** con 3-D Secure (SCA, direttiva PSD2). Conferma l'ordine solo dal **webhook** del PSP, verificandone la firma, mai dal ritorno del browser.
- **Prezzi e scorte sul server**, in una transazione che impedisca di vendere più pezzi di quelli disponibili.
- **Autenticazione e ruoli** per clienti e staff, MFA per lo staff, sessioni in cookie `HttpOnly`, `Secure`, `SameSite=Lax`.
- **Link agli ordini** con token non indovinabile (in demo basta il numero).
- **Anti-frode e abusi:**
  - limiti di frequenza su accesso, checkout e codici sconto;
  - CAPTCHA rispettoso della privacy solo se necessario.

## Privacy (GDPR)

- **Dati trattati:** contatti e indirizzo, ordini, resi, consenso marketing, recensioni (con nome abbreviato).
- **Minimizzazione:**
  - acquisto possibile come ospite;
  - nessun campo superfluo nel checkout;
  - note di consegna facoltative.
- **Consensi:**
  - accettazione di condizioni e recesso obbligatoria (è parte del contratto);
  - marketing separato, facoltativo, non preselezionato e revocabile dall'area personale.
- **Diritti:** l'area personale permette di scaricare i propri dati (JSON) e chiedere la cancellazione. Gli ordini si conservano per gli obblighi fiscali (10 anni).
- **Cookie:** il template usa solo archiviazione tecnica (carrello, accesso, tema), quindi non serve il banner. Se aggiungi analisi o pixel di marketing, serve un banner conforme alle linee guida del Garante (giugno 2021): rifiuto con la stessa evidenza dell'accettazione, nessun cookie prima del consenso, scelte granulari.
- **Responsabili del trattamento** (art. 28): hosting, PSP, corrieri, email, venditori del marketplace per i soli dati necessari.

## Tutela del consumatore

| Obbligo                                                                                                                     | Riferimento                                                    | Nel template                                                            |
| --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Informazioni precontrattuali: identità del venditore, prezzo totale con IVA e spese, pagamento, consegna, recesso, garanzia | Codice del Consumo, artt. 49 e 51                              | Scheda prodotto, carrello, checkout e pagine legali                     |
| Pulsante finale che indica l'obbligo di pagare                                                                              | Art. 51, c. 2                                                  | "Ordine con obbligo di pagamento"                                       |
| Recesso di 14 giorni dalla consegna con modulo tipo                                                                         | Artt. 52–59                                                    | Pagina "Diritto di recesso", reso dall'area personale                   |
| Rimborso entro 14 giorni, spedizione standard compresa                                                                      | Art. 56                                                        | `refundAmount` in `lib/domain/orders.ts`                                |
| Garanzia legale di conformità di 24 mesi                                                                                    | Artt. 128 e seguenti                                           | Condizioni di vendita, scheda prodotto                                  |
| Prezzo più basso dei 30 giorni precedenti negli annunci di sconto                                                           | Art. 17-bis, introdotto dal D.Lgs. 26/2023 (direttiva Omnibus) | `priceInfo` in `lib/domain/pricing.ts`, prezzo e anteprima nel pannello |
| Trasparenza sulle recensioni: se e come si verifica che provengano da acquirenti                                            | Omnibus, pratiche commerciali                                  | "Acquisto verificato" e nota sotto le recensioni                        |
| Indicare se il venditore di un marketplace è un professionista                                                              | Omnibus, art. 49-bis                                           | Nota "Venditore professionale" su scheda e pagina del venditore         |

- **Risoluzione delle controversie:** indica gli organismi ADR a cui aderisci. La piattaforma europea ODR è stata dismessa nel luglio 2025: verifica quali indicazioni sono richieste oggi prima di pubblicare.
- **Marketplace e Digital Services Act:**
  - raccogli e verifica i dati dei venditori (tracciabilità, art. 30) e mostrali ai clienti;
  - prevedi un modo per segnalare prodotti o contenuti illeciti.
- **Sicurezza dei prodotti:** il regolamento europeo GPSR (2023/988) richiede, per i prodotti venduti online, le informazioni sul fabbricante e sulla sicurezza. Aggiungile ai dettagli delle schede.

## Accessibilità

**Obiettivo:** WCAG 2.2 AA. L'**European Accessibility Act** (D.Lgs. 82/2022, in vigore dal 28 giugno 2025) si applica all'e-commerce verso i consumatori. Pubblica una **dichiarazione di accessibilità**; le microimprese possono essere esentate.

### Implementato

- **Catalogo:** schede con un solo link e anello di focus attorno alla card; filtri con etichette visibili; numero di risultati annunciato.
- **Prezzi:** riferimento a 30 giorni scritto per esteso, non solo barrato; stelle con valore nel testo; disponibilità con icona e testo.
- **Varianti e galleria:** varianti come veri `radio`; miniature con `aria-pressed`; testo alternativo per ogni vista.
- **Carrello:** quantità con pulsanti etichettati e campo numerico; carrello laterale come `dialog` con titolo.
- **Checkout:**
  - campi con `autocomplete` corretto;
  - errori collegati ai campi e focus sul primo errore;
  - scelte di spedizione e pagamento come gruppi di `radio`;
  - link che si aprono in una nuova scheda annunciati come tali.
- **Pannello:** elenchi al posto delle tabelle su mobile; schede scorrevoli raggiungibili da tastiera.
- **Verifiche automatiche:** axe-core su tutte le pagine, sul carrello aperto, sul checkout con errori e sulle schede del pannello, in chiaro e scuro; `prefers-reduced-motion` verificato.

### Verifica manuale prima di ogni rilascio

- [ ] Acquisto completo, reso e gestione dell'ordine solo da tastiera e con VoiceOver/TalkBack.
- [ ] Zoom al 200%, larghezza di 320 px, modalità a contrasto elevato di Windows.
- [ ] Pagine del PSP (fuori dal template): verifica che siano accessibili anch'esse.

## Prestazioni

| Scelta                                                    | Effetto                                     |
| --------------------------------------------------------- | ------------------------------------------- |
| Schede prodotto e catalogo prerenderizzati (ISR ogni ora) | HTML immediato e indicizzabile, costi bassi |
| Illustrazioni SVG inline, due font self-hosted            | Nessuna richiesta di immagini; LCP basso    |
| Calcoli puri memoizzati, selettori senza array derivati   | Filtri e carrello reattivi                  |
| Salvataggio locale differito                              | Nessun blocco dell'interfaccia              |

**Obiettivi Core Web Vitals:** LCP < 2,5 s, INP < 200 ms, CLS < 0,1. Con le foto reali usa `next/image` con dimensioni e `sizes` corretti e `priority` solo sull'immagine principale.
