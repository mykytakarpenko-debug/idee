# Brief — Forma

## Obiettivo

1. **Acquisire iscritti dal sito:** informazioni chiare (corsi, orari, prezzi) e una prova gratuita senza attriti.
2. **Fidelizzarli:** prenotazioni semplici, posti garantiti, trasparenza su abbonamento e rinnovo.
3. **Alleggerire la reception:** controlli automatici all'ingresso, liste d'attesa che si gestiscono da sole, scadenze sempre in vista.

## Pubblico

| Profilo                 | Contesto                       | Bisogni principali                                                            |
| ----------------------- | ------------------------------ | ----------------------------------------------------------------------------- |
| Chi cerca una palestra  | Smartphone, confronta più club | Prezzi senza sorprese, orari compatibili, provare prima di pagare             |
| Socio                   | Smartphone, poco tempo         | Prenotare in due tocchi, sapere se c'è posto, cancellare senza telefonare     |
| Reception               | PC o tablet al bancone         | Riconoscere il socio, sapere subito se può entrare, registrare presenze       |
| Titolare / responsabile | PC                             | Iscritti attivi, frequenza, lezioni piene o vuote, rinnovi e prove da seguire |

## Pagine

### Sito pubblico

| Pagina         | Rotta             | Contenuto                                                                           |
| -------------- | ----------------- | ----------------------------------------------------------------------------------- |
| Home           | `/`               | Stato di apertura, lezioni di oggi, categorie, piani, istruttori, prova, dove siamo |
| Corsi          | `/corsi`          | Corsi per categoria con intensità, durata, livello, istruttori                      |
| Orari          | `/orari`          | Palinsesto settimanale filtrabile                                                   |
| Prezzi         | `/prezzi`         | Piani mensili/annuali e carnet, confronto, FAQ, note legali                         |
| Prova gratuita | `/prova-gratuita` | Richiesta con scelta della lezione                                                  |
| Accesso        | `/accedi`         | Login all'area socio                                                                |
| Privacy        | `/privacy`        | Modello di informativa                                                              |

### Area socio e pannello

| Area       | Pagine                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------- |
| Area socio | Panoramica · Prenota · Abbonamento · Profilo                                                            |
| Pannello   | Panoramica · Iscritti (scheda in modale) · Lezioni (scheda in modale) · Check-in · Piani · Impostazioni |

## Flussi principali

### 1. Dalla prova all'iscrizione

1. Il visitatore sceglie cosa provare e, se vuole, una lezione dei prossimi 5 giorni con posti liberi: il posto viene **riservato**.
2. Dichiara di essere maggiorenne, accetta l'informativa, sceglie se ricevere promozioni.
3. La richiesta compare nella **Panoramica** del pannello con stato "Nuova"; la reception chiama e la segna come contattata.
4. In reception si crea l'iscritto (**Nuovo iscritto**): piano, fatturazione, data di inizio, scadenza del certificato.

### 2. Prenotazione di una lezione

1. Il socio sceglie il giorno (fino a 7 giorni avanti) e la categoria.
2. Per ogni lezione vede i posti liberi e un'azione chiara: **Prenota**, **Lista d'attesa (n)** oppure il motivo per cui non può. I motivi possibili sono:
   - lezione già iniziata o annullata;
   - abbonamento non attivo, oppure piano che non include i corsi;
   - carnet esaurito;
   - certificato da rinnovare;
   - limite giornaliero raggiunto.
3. Dopo la prenotazione può aggiungere la lezione al calendario.
4. Se cancella, il posto va al primo in lista d'attesa. Entro il termine (6 ore) la cancellazione è **tardiva**: si avvisa prima di confermare e, per i carnet, l'ingresso non viene restituito.

### 3. Ingresso in reception

1. Si cerca il socio per nome o codice (es. `RC-1007`).
2. L'esito è immediato:
   - **consentito** o **non consentito**;
   - con i motivi: abbonamento scaduto o sospeso, carnet esaurito, certificato scaduto o mancante;
   - con gli avvisi: scadenza vicina, ultimo ingresso del carnet, già entrato oggi.
3. "Registra ingresso" aggiorna i contatori e scala un ingresso dal carnet.

### 4. Disdetta del rinnovo

1. Nell'area socio, _Abbonamento_ mostra data e importo del prossimo addebito.
2. Disattivando il rinnovo una conferma spiega che l'abbonamento resta valido fino alla fine del periodo pagato, senza altri addebiti.

## Regole di business

| Regola                      | Valore demo                                       | Dove si cambia                             |
| --------------------------- | ------------------------------------------------- | ------------------------------------------ |
| Finestra di prenotazione    | 7 giorni                                          | Impostazioni → Prenotazioni                |
| Cancellazione senza penale  | Fino a 6 ore prima                                | Impostazioni → Prenotazioni                |
| Lezioni al giorno per socio | 2 (prenotate o in attesa)                         | Impostazioni → Prenotazioni                |
| Lista d'attesa              | Attiva, promozione automatica in ordine di arrivo | Impostazioni → Prenotazioni                |
| Certificato medico          | Obbligatorio; avviso 30 giorni prima              | Impostazioni → Regole                      |
| Preavviso scadenze          | 14 giorni                                         | Impostazioni → Regole                      |
| Abbonamento annuale         | 12 mesi al prezzo di 10                           | `ANNUAL_MONTHS_CHARGED` in `membership.ts` |
| Carnet                      | "In scadenza" con 2 ingressi rimasti              | `membershipStatus` in `membership.ts`      |

## Criteri di successo

- Prova gratuita richiesta in meno di un minuto da smartphone.
- Il socio capisce sempre **perché** non può prenotare, senza chiedere in reception.
- In reception l'esito del check-in è leggibile in un secondo (colore, icona e testo).
- Tutte le pagine superano i controlli WCAG 2.2 AA in tema chiaro e scuro.
