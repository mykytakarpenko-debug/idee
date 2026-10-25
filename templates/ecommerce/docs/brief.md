# Brief — Bottega

## Obiettivo

Vendere online prodotti fisici con un percorso d'acquisto breve e trasparente. Il modello è estendibile a marketplace con più venditori. Ogni prezzo, spesa e condizione è chiaro **prima** del pagamento; dopo l'acquisto il cliente segue l'ordine e restituisce senza contattare l'assistenza.

## Pubblico

| Chi                       | Bisogno                                           | Come lo soddisfa il template                                                                                                   |
| ------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Visitatore                | Trovare in fretta, capire prezzo e disponibilità  | Ricerca senza accenti, filtri, disponibilità per variante, prezzo IVA inclusa e spedizione gratuita evidenziata                |
| Cliente                   | Comprare senza sorprese                           | Spese visibili nel carrello, un solo modulo di checkout, riepilogo sempre visibile, pulsante "Ordine con obbligo di pagamento" |
| Cliente dopo l'acquisto   | Sapere dov'è il pacco, restituire                 | Pagina dell'ordine con tracciamento, reso dall'area personale entro il termine, rimborso stimato                               |
| Gestore                   | Evadere gli ordini, gestire catalogo e promozioni | Coda degli ordini da spedire, scorte basse, anteprima Omnibus, codici sconto, esportazione CSV                                 |
| Venditori del marketplace | Visibilità e liquidazioni chiare                  | Pagina pubblica con dati identificativi, venduto e commissioni calcolati per periodo                                           |

## Flussi principali

### Acquisto

1. Il cliente arriva alla **scheda prodotto** dal catalogo, dalla home o dalla ricerca.
2. Sceglie la **variante** (quelle esaurite restano visibili ma non acquistabili) e la **quantità**, che non può superare la disponibilità.
3. "Aggiungi al carrello" apre il **carrello laterale**, con il messaggio sulla spedizione gratuita.
4. Al **checkout** compila:
   - contatti e indirizzo;
   - spedizione (standard, espressa, ritiro) con il costo accanto;
   - pagamento (carta, PayPal o bonifico);
   - codice sconto, se ce l'ha;
   - accettazione di condizioni e recesso; il consenso marketing è separato e facoltativo.
5. Con "Ordine con obbligo di pagamento" il sistema **ricontrolla prezzi, codice e scorte**, crea l'ordine, scala le scorte e mostra la **conferma**. Con il bonifico mostra anche le istruzioni di pagamento.

### Ordine

| Stato                  | Quando                       | Azione nel pannello                   |
| ---------------------- | ---------------------------- | ------------------------------------- |
| In attesa di pagamento | Bonifico non ancora ricevuto | Segna come pagato                     |
| Pagato                 | Pagamento riuscito           | Inizia la preparazione                |
| In preparazione        | Pacco in lavorazione         | Inserisci corriere e codice → Spedito |
| Spedito                | In viaggio                   | Segna come consegnato                 |
| Consegnato             | Ricevuto                     | Da qui parte il termine di recesso    |
| Annullato              | Prima della spedizione       | Le scorte tornano disponibili         |

### Reso (diritto di recesso)

1. Dall'area personale, entro 14 giorni dalla consegna (configurabile in aumento), il cliente sceglie articoli e quantità. Il motivo è facoltativo.
2. Vede il **rimborso stimato**, calcolato così:
   - prezzo pagato per gli articoli restituiti, al netto della quota di sconto;
   - più la spedizione, se restituisce tutto, fino al costo della spedizione standard.
3. Lo staff approva o rifiuta, poi segna come rimborsato: in quel momento gli articoli tornano a magazzino.

## Regole di prezzo

- **Prezzi IVA inclusa**, IVA indicata nel totale.
- **Promozioni con regola Omnibus:**
  - accanto al prezzo scontato compare il **prezzo più basso applicato nei 30 giorni precedenti** l'inizio della promozione;
  - lo sconto percentuale si calcola su quel prezzo;
  - se nei 30 giorni il prodotto è già stato venduto a un prezzo pari o inferiore, la promozione non viene presentata come sconto (nella demo: le tazzine).
- Lo **storico dei prezzi** si aggiorna da solo quando il gestore cambia prezzo o promozione.
- **Codici sconto:**
  - tipi: percentuale, importo fisso o spedizione gratuita;
  - possono avere un ordine minimo e una scadenza;
  - si applicano al carrello e non sono annunci di riduzione di prezzo.
- **Spedizione:** standard gratuita oltre la soglia, calcolata sulla merce già scontata; espressa sempre a pagamento; ritiro gratuito.

## Marketplace

Ogni prodotto appartiene a un venditore professionale con:

- pagina pubblica e dati identificativi (ragione sociale, partita IVA, indirizzo, contatto);
- una commissione.

Il gestore incassa e spedisce per conto dei venditori. Il pannello calcola per periodo:

- venduto al netto dei resi rimborsati;
- commissione;
- importo da liquidare.

Per un **negozio singolo** basta un solo venditore: vedi [personalizzazione.md](personalizzazione.md#negozio-singolo-o-marketplace).

## Fuori dallo scopo della demo

Pagamenti reali, invio di email, fatturazione elettronica, magazzino multi-sede, spedizioni internazionali, recensioni inviate dai clienti, programmi fedeltà: indicati in [architettura.md](architettura.md#collegare-un-backend).
