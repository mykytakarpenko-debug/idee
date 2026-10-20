# Roadmap della libreria

Si sviluppa un template alla volta. Prima di ciascuno viene presentata una sintesi completa: obiettivo, pagine, funzionalità, stile, stack, test e deploy, aspetti legali. Qui trovi quelle preliminari. Tutti i template riusano lo stack e gli standard di **Nucleo** (Next.js 16, React 19, TypeScript, Tailwind CSS 4, Radix, Zod, Vitest, Playwright + axe, CI e Vercel).

---

## 1. Nucleo — gestionale e CRM ✅

Template base, completo: vedi [`templates/gestionale`](../templates/gestionale).

---

## 2. Tavola — ristoranti, bar, delivery e prenotazioni ✅

Template completo: vedi [`templates/ristorante`](../templates/ristorante). Sintesi iniziale:


- **Obiettivo:** sito pubblico con menu e prenotazione del tavolo, ordini da asporto/delivery e un pannello per sala e cucina.
- **Pagine:** home, menu (filtri per allergeni e diete), prenota un tavolo, ordina online (carrello, ritiro/consegna, orario), conferma ordine; pannello con prenotazioni, mappa della sala, ordini in tempo reale (stile kanban: nuovo → in preparazione → pronto → consegnato), gestione del menu, orari e chiusure.
- **Stile:** caldo e appetitoso ma sobrio; accento terracotta e titoli serif. Il template funziona senza fotografie (menu testuale, leggibile e indicizzabile); le foto si aggiungono con `next/image`.
- **Note legali:** indicazione dei 14 allergeni (Reg. UE 1169/2011); prezzi IVA inclusa; condizioni di vendita e recesso per gli ordini online (con le esclusioni per i prodotti deperibili); privacy per le prenotazioni.

## 3. Forma — palestre, centri fitness e wellness

- **Obiettivo:** acquisizione di nuovi iscritti dal sito e gestione di abbonamenti, corsi e ingressi.
- **Pagine:** sito con corsi, orari, istruttori, prezzi e prova gratuita; area socio (prenotazione corsi, abbonamento, pagamenti, progressi); pannello con iscritti, abbonamenti in scadenza, calendario dei corsi con capienza e lista d'attesa, check-in, report di retention.
- **Stile:** energico ma pulito; accento verde salvia, tipografia più decisa.
- **Note legali:** il certificato medico è un dato sanitario (art. 9 GDPR) e richiede misure dedicate; contratti di abbonamento con rinnovo e disdetta chiari (Codice del Consumo); consenso per le immagini nelle gallerie.

## 4. Agenda — aziende di servizi e prenotazioni online

- **Obiettivo:** il "lato cliente" di Nucleo: prenotazione self-service in 3 passi per studi, consulenti e professionisti.
- **Pagine:** pagina pubblica dell'attività, scelta del servizio, dell'operatore e dello slot disponibile, dati e conferma, gestione della prenotazione (sposta/annulla tramite link), pagamento di un acconto facoltativo; widget incorporabile.
- **Stile:** fiducia e semplicità; accento petrolio.
- **Note legali:** informativa e consensi al momento della prenotazione; politiche di cancellazione e acconti trasparenti; promemoria solo per i servizi richiesti.

## 5. Bottega — e-commerce e marketplace

- **Obiettivo:** negozio online orientato alla conversione, estendibile a marketplace multi-venditore.
- **Pagine:** home, catalogo con filtri, scheda prodotto (varianti, disponibilità, recensioni), carrello, checkout in un'unica pagina, area cliente (ordini, resi, indirizzi); pannello con prodotti, ordini, clienti, venditori e commissioni (versione marketplace).
- **Stile:** il prodotto in primo piano; neutri con accento ambra, schede prodotto molto curate.
- **Note legali:** Codice del Consumo (informazioni precontrattuali, recesso di 14 giorni, garanzia legale), prezzi con IVA e indicazione del prezzo precedente negli sconti (direttiva Omnibus), European Accessibility Act per l'e-commerce, PSP conforme a PCI-DSS, cookie banner per gli strumenti di marketing.

## 6. Portale — dashboard amministrative e portali clienti

- **Obiettivo:** area riservata B2B in cui i clienti consultano documenti, ticket, fatture e stato dei progetti; dashboard per gli amministratori.
- **Pagine:** accesso con MFA, panoramica cliente, documenti e firma, ticket di assistenza con conversazioni, fatture e pagamenti, impostazioni del team e dei permessi; lato amministrazione: account, ruoli, registro delle attività, analytics.
- **Stile:** professionale e denso di informazioni; accento indaco.
- **Note legali:** ruoli e permessi granulari, registro delle attività, conservazione dei documenti, accordi di nomina a responsabile del trattamento con i clienti business.

## 7. Arena — scommesse, slot e giochi (con gioco responsabile)

- **Obiettivo:** interfaccia moderna per una piattaforma di gioco che mette al centro **tutela del giocatore e conformità**.
- **Pagine:** lobby dei giochi, scheda evento con quote, schedina, conto di gioco (depositi e prelievi), storico, area "Gioco responsabile" (limiti di deposito, di tempo e di perdita, pause, autoesclusione), verifica dell'identità.
- **Stile:** sobrio e non aggressivo, senza leve di urgenza o colori "da casinò"; accento smeraldo.
- **Note legali e di prodotto (Italia):**
  - offrire gioco con vincite in denaro richiede la **concessione ADM** (Agenzia delle Dogane e dei Monopoli) e l'integrazione con i suoi sistemi;
  - divieto di pubblicità del gioco con vincite in denaro (art. 9 del "Decreto Dignità", D.L. 87/2018);
  - solo maggiorenni, con verifica dell'età e dell'identità (KYC) prima del gioco;
  - strumenti obbligatori di autolimitazione, autoesclusione (anche tramite il registro nazionale ADM), avvisi sui rischi e probabilità di vincita, riferimenti ai servizi di aiuto;
  - antiriciclaggio (D.Lgs. 231/2007).
  La demo userà **solo crediti virtuali senza valore** e mostrerà i flussi di tutela come parte integrante dell'esperienza.

## 8. Vetrina — landing page, siti vetrina e SaaS

- **Obiettivo:** pagine veloci e curate per presentare un'attività o lanciare un prodotto SaaS.
- **Pagine:** landing modulare (hero, vantaggi, funzionalità, testimonianze, prezzi, FAQ, call to action), chi siamo, contatti con modulo antispam, blog/novità, prezzi SaaS con confronto dei piani, pagine legali.
- **Stile:** accento configurabile da un solo token; sezioni componibili; prestazioni massime (Lighthouse 100).
- **Note legali:** privacy e cookie policy, cookie banner conforme alle linee guida del Garante quando sono presenti strumenti non tecnici, dati societari nel footer (P. IVA), accessibilità.
