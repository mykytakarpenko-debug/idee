# Design system — Tavola

Tavola condivide con gli altri template della libreria la stessa base: token CSS, componenti, regole di stato e movimento. Questo documento descrive **cosa cambia per la ristorazione**. Per i componenti comuni (Button, Field, Dialog, Toast…) vedi anche il [design system di Nucleo](../../gestionale/docs/design-system.md#componenti).

Tutti i valori sono **token CSS** in [`src/app/globals.css`](../src/app/globals.css), mappati sulle utility Tailwind (`bg-surface`, `text-fg-muted`, `border-line`…).

## Principi

1. **Calore senza eccessi.** Neutri avorio e un solo accento terracotta, come una tovaglia e un piatto in ceramica. Niente fotografie obbligatorie: il template funziona anche senza immagini.
2. **Il menu è testo.** Nomi, prezzi e allergeni sono leggibili, selezionabili e indicizzabili. Le foto si possono aggiungere, ma non portano informazioni essenziali.
3. **Un'azione principale per pagina.** "Prenota un tavolo" sul sito, "Inizia preparazione" in cucina.
4. **Stato = colore + icona + testo.** Prenotazioni, ordini e tavoli non si distinguono mai solo per colore.
5. **Pensato per il servizio.** Nel pannello target ampi, contatori in vista e azioni che si annullano dal toast.

## Colori

### Superfici e testo

| Token         | Chiaro    | Scuro     | Uso                                  |
| ------------- | --------- | --------- | ------------------------------------ |
| `canvas`      | `#FAF7F2` | `#0F0C09` | Sfondo pagina (avorio / bruno scuro) |
| `surface`     | `#FFFFFF` | `#18140F` | Card, carrello, modali               |
| `surface-2`   | `#F3EEE6` | `#221D18` | Hover, colonne della bacheca ordini  |
| `surface-3`   | `#EAE3D8` | `#2C2620` | Stato premuto                        |
| `line`        | `#E8E1D6` | `#2E2822` | Bordi decorativi                     |
| `line-strong` | `#8F8982` | `#6E6760` | Bordi dei controlli (≥ 3:1)          |
| `fg`          | `#1C1915` | `#F5F1EB` | Testo principale                     |
| `fg-muted`    | `#5F5A54` | `#A8A199` | Descrizioni dei piatti, metadati     |
| `fg-subtle`   | `#716B64` | `#928B83` | Segnaposto, codici                   |

### Accento e stati

| Token                 | Chiaro                | Scuro                 | Note                                           |
| --------------------- | --------------------- | --------------------- | ---------------------------------------------- |
| `accent`              | `#B4532A`             | `#B9542A`             | Terracotta: pulsanti primari, tavolo prenotato |
| `accent-text`         | `#A3471F`             | `#EE9A72`             | Link, sovratitoli, numeri della home           |
| `accent-soft` / `-fg` | `#FBEDE5` / `#8A3A18` | `#3A2116` / `#F2B394` | Voce attiva, filtri attivi                     |
| `success`             | `#17713E`             | `#5BC98A`             | Confermata, completato, diete                  |
| `warning`             | `#94500A`             | `#EBAA4E`             | Da confermare, esaurito, ordine in ritardo     |
| `danger`              | `#BB3127`             | `#FF8A80`             | Errori, annullamenti, piccante                 |
| `info`                | `#0A6580`             | `#5CC2DF`             | Tavolo occupato, in preparazione               |

### Contrasti verificati (WCAG 2.2 AA)

Calcolati con la formula WCAG sui valori dei token e verificati da axe-core in CI.

| Coppia                            | Chiaro  | Scuro   |
| --------------------------------- | ------- | ------- |
| `fg` su `surface`                 | 17,5:1  | 16,3:1  |
| `fg-muted` su `surface`           | 6,8:1   | 7,2:1   |
| `fg-subtle` su `canvas`           | 4,9:1   | 5,8:1   |
| Testo bianco su `accent`          | 5,0:1   | 4,8:1   |
| `accent-text` su `canvas`         | 5,7:1   | 8,8:1   |
| `accent-soft-fg` su `accent-soft` | 6,8:1   | 8,3:1   |
| Stati su fondo `-soft`            | ≥ 5,0:1 | ≥ 7,0:1 |
| `line-strong` (bordi controlli)   | 3,2:1   | 3,3:1   |

## Tipografia

| Ruolo       | Font                                       | Uso                                                                           |
| ----------- | ------------------------------------------ | ----------------------------------------------------------------------------- |
| Display     | **Fraunces** (variabile, assi opsz e SOFT) | Nome del locale, titoli del sito, nomi dei piatti nel menu, numeri dei tavoli |
| Interfaccia | **Inter** (variabile)                      | Testo, moduli, pannello                                                       |

- Entrambi self-hosted con `next/font` (nessuna richiesta a Google dal browser).
- Titoli del sito 40–64 px con tracking negativo; nel pannello titoli in Inter semibold 24–28 px.
- Prezzi, orari e quantità con `tabular-nums`, allineati a destra.
- Nel menu una riga puntinata collega nome e prezzo, come in un menu stampato (`aria-hidden`).

## Componenti specifici

| Componente            | File                              | Note                                                                                                             |
| --------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Stato di apertura     | `features/site/open-status.tsx`   | Pallino + testo ("Aperto ora · fino alle 23:00" / "Chiuso ora · Apre alle 19:00")                                |
| Filtri del menu       | `features/site/menu-filters.tsx`  | Chip con `aria-pressed`, popover allergeni, conteggio annunciato; container query                                |
| Badge dieta/allergeni | `features/site/dish-badges.tsx`   | Icona + testo; allergeni come testo "Contiene: …"                                                                |
| Scelta orario         | `features/site/booking-view.tsx`  | `radiogroup` per servizio; orari pieni barrati e disabilitati, con etichetta "non disponibile"                   |
| Carrello              | `features/site/cart-panel.tsx`    | Quantità con pulsanti etichettati, soglie di consegna in chiaro; modale su mobile                                |
| Stepper ordine        | `features/site/tracking-view.tsx` | Lista ordinata con `aria-current="step"` e `aria-live`                                                           |
| Mappa sala            | `features/panel/floor-view.tsx`   | Tavoli come pulsanti; forma tonda/quadrata/rettangolare; libero tratteggiato, prenotato terracotta, occupato blu |
| Bacheca ordini        | `features/panel/orders-view.tsx`  | Colonne per stato (segmenti su mobile), card con orario, tipo, totale e ritardo                                  |
| Badge di stato        | `components/status-badges.tsx`    | Prenotazioni e ordini: colore + icona + testo                                                                    |

## Stati e feedback

| Situazione                | Pattern                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| Caricamento               | Il sito mostra subito il menu statico (SSR); il pannello usa scheletri con `aria-busy`     |
| Nessun orario disponibile | Messaggio in linea e invito a scegliere un altro giorno; giorno di chiusura dichiarato     |
| Fuori zona di consegna    | Errore sul campo CAP appena il codice è completo, con l'elenco delle zone nel suggerimento |
| Ordine minimo             | Importo mancante nel carrello; pulsante di pagamento disabilitato (`aria-disabled`)        |
| Successo                  | Toast; nel pannello con "Annulla" per i cambi di stato                                     |
| Azione distruttiva        | Conferma in `alertdialog` (annullare un ordine, eliminare un piatto, ripristinare la demo) |
| Errore imprevisto         | Error boundary separati per sito e pannello; 404 con link a home e menu                    |

## Movimento

Stessi token della libreria (`animate-page-in`, `dialog`, `sheet`, `toast`, 120–260 ms, easing `--ease-out`). In più:

- i tavoli e le card degli ordini hanno un leggero feedback alla pressione (`scale(0.99)`, 150 ms);
- lo stepper del tracking anima il cambio di colore in 300 ms.

Con `prefers-reduced-motion: reduce` tutte le durate scendono a 0,01 ms (regola globale verificata da un test e2e).

## Grafici

Un solo grafico: **coperti negli ultimi 14 giorni** (istogramma a una serie, barre ≤ 24 px con estremità arrotondata di 4 px, tooltip al passaggio e al focus, frecce ← →). Nessun secondo asse; i coperti per servizio sono mostrati come testo nella card KPI.
