# Architettura — Arena

## Panoramica

```text
Browser
 ├─ Pagine informative statiche (home, giochi, regole, legali) e slot prerenderizzate
 ├─ Viste client (scommesse, conto, gioco responsabile, pannello)
 ├─ PlayerGuard: durata della sessione e promemoria
 └─ Store Zustand
     ├─ data-store: eventi, giocatori, scommesse, movimenti, sessioni, giocate, eventi di gioco responsabile
     │   └─ ogni azione ricalcola saldo, limiti e blocchi con le funzioni di lib/domain
     ├─ session-store: giocatore, sessione, ultimo promemoria
     └─ slip-store: esiti scelti e importo (solo riferimenti, mai quote)
```

Le regole stanno in `src/lib/domain/` come **funzioni pure** testate: `betting.ts`, `slots.ts`, `responsible.ts`, `kyc.ts`. Sul server vanno riusate così come sono.

## Cosa deve fare il server

In demo tutto avviene nel browser, quindi **nulla è sicuro**. In produzione il browser invia solo intenzioni; il server decide.

| Operazione           | Controlli sul server, in una transazione                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| Ricarica             | Blocchi (`playBlock`), limiti (`checkDeposit`), titolarità del metodo di pagamento                    |
| Giocata              | Disponibilità e quota attuale (`checkSlip`), saldo, limite di perdita (`checkStake`), vincita massima |
| Slot                 | Estrazione con RNG certificato, calcolo della vincita (`spinOutcome`), addebito e accredito atomici   |
| Limiti               | `changeLimits`: riduzioni subito, aumenti con data di efficacia                                       |
| Pausa/autoesclusione | Registrazione immediata e comunicazione al Registro unico delle autoesclusioni (RUA)                  |
| Sessione             | Inizio e fine sul server; limite di durata e pausa successiva applicati anche alle API                |
| Liquidazione         | Esiti ufficiali, `settleBet` su tutte le scommesse aperte dell'evento, accrediti in batch idempotenti |

## Generatore casuale

`randomStops` usa `crypto.getRandomValues` con campionamento a rifiuto (nessuna distorsione del modulo). In produzione:

- l'estrazione avviene sul server con un RNG **certificato** da un laboratorio accreditato;
- il gioco e la sua tabella dei pagamenti sono **omologati**;
- l'RTP mostrato deve coincidere con quello certificato (qui è calcolato esattamente con `slotStats`).

## Integrazione con i sistemi ADM

Un concessionario online dialoga con i sistemi dell'Agenzia per: apertura e gestione dei conti di gioco, verifica del codice fiscale, palinsesto e accettazione delle scommesse, trasmissione delle giocate e delle vincite, consultazione e aggiornamento del Registro unico delle autoesclusioni. Le specifiche tecniche sono fornite da ADM ai concessionari; questo template prevede i punti di aggancio:

- `store/data-store.ts`: sostituisci il corpo delle azioni con chiamate alle tue API mantenendo le stesse firme;
- `lib/domain/kyc.ts`: oltre al formato, verifica il codice fiscale tramite i servizi previsti;
- `features/panel/*`: collega refertazione e verifiche ai flussi dell'operatore.

## Rendering

- Le pagine informative e le slot sono statiche; i dati del conto arrivano solo nel browser (mai nell'HTML).
- Nessuna chiamata a `new Date()` durante il render: `useNow()` fornisce l'ora dopo l'idratazione.
- La schedina contiene solo riferimenti agli esiti: quote e disponibilità si rileggono sempre dai dati.
