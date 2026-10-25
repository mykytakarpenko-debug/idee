# Design system — Bottega

Stessa base di tutti i template della libreria (token in `src/app/globals.css`, componenti in `src/components/ui/`). Qui solo ciò che è specifico di Bottega.

## Carattere

Il prodotto in primo piano: superfici neutre e calde, molto spazio, immagini grandi e quadrate. Un solo accento **ambra** per azioni, prezzi in offerta e selezioni. I titoli in serif (Newsreader) danno un tono artigianale ed editoriale; testi e numeri restano in Inter.

## Colore

| Token                   | Chiaro                | Scuro                 | Uso                                                                    |
| ----------------------- | --------------------- | --------------------- | ---------------------------------------------------------------------- |
| `--canvas`              | `#f8f6f2`             | `#0f0d0b`             | Sfondo della pagina                                                    |
| `--surface`             | `#ffffff`             | `#171512`             | Card, pannelli, modali                                                 |
| `--accent`              | `#a5520b`             | `#a35a0c`             | Pulsante principale, badge "Offerta", variante selezionata             |
| `--accent-text`         | `#8f4c06`             | `#f0b062`             | Link e prezzo in offerta                                               |
| `--accent-soft` / `-fg` | `#fbefdc` / `#6b3a04` | `#2e2010` / `#f3c88a` | Percentuale di sconto, voce di menu attiva                             |
| `--art-base`            | `#f3efe7`             | `#d9d2c5`             | Sfondo delle illustrazioni (chiaro anche in tema scuro, come una foto) |
| `--fg-muted`            | `#5f5a52`             | `#aaa49a`             | Testo secondario                                                       |
| `--line-strong`         | `#8a857c`             | `#6e685f`             | Bordi dei campi                                                        |

L'avviso (`--warning`, "ultimi pezzi") è vicino all'ambra: per questo è sempre accompagnato da icona e testo.

### Contrasti verificati (WCAG 2.2)

| Coppia                     | Chiaro | Scuro   | Minimo |
| -------------------------- | ------ | ------- | ------ |
| Testo bianco su accento    | 5,51:1 | 5,22:1  | 4,5:1  |
| Testo in accento su sfondo | 6,07:1 | 10,24:1 | 4,5:1  |
| Percentuale di sconto      | 8,28:1 | 10,10:1 | 4,5:1  |
| Testo secondario su card   | 6,84:1 | 7,36:1  | 4,5:1  |
| Testo attenuato su sfondo  | 4,97:1 | 5,61:1  | 4,5:1  |
| Bordo dei campi su card    | 3,67:1 | 3,30:1  | 3:1    |

axe-core verifica i contrasti reali su ogni pagina in entrambi i temi.

## Tipografia

- **Newsreader** (serif) per titoli, nome del negozio e prezzi grandi delle recensioni.
- **Inter** per tutto il resto, con cifre tabellari per prezzi, quantità e totali.
- Il prezzo in offerta è in colore d'accento. Il prezzo di riferimento è barrato e affiancato dal testo esplicito "Prezzo più basso negli ultimi 30 giorni", così l'informazione non dipende dalla barratura.

## Illustrazioni dei prodotti

`components/product/product-art.tsx` disegna 17 oggetti (tazza, piatto, ciotola, vaso, teiera, tessili, taglieri, taccuini, candele…) nel colore della variante, con tre viste:

| Vista          | Uso                                   |
| -------------- | ------------------------------------- |
| 0 — intero     | Scheda nel catalogo, carrello, ordini |
| 1 — dettaglio  | Categorie in home, galleria           |
| 2 — ambientato | Hero, galleria                        |

Nelle schede del catalogo l'immagine è decorativa (il nome è nel link). Nella galleria ha un testo alternativo con nome, variante e vista.

## Componenti specifici

| Componente          | File                                  | Note                                                                                                          |
| ------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Scheda prodotto     | `components/product/product-card.tsx` | Un solo link su tutta la scheda, con anello di focus attorno alla card. Badge "Offerta", "Novità", "Esaurito" |
| Prezzo              | `components/product/price.tsx`        | Prezzo, riferimento a 30 giorni, percentuale; testo per i lettori di schermo                                  |
| Stelle              | `components/product/rating.tsx`       | Icone decorative, valore e numero di recensioni nel testo                                                     |
| Disponibilità       | `components/product/stock-badge.tsx`  | Icona + testo: disponibile, ultimi N pezzi, esaurito                                                          |
| Varianti            | `features/shop/product-view.tsx`      | Veri `radio` con pastiglia di colore e nome; le esaurite restano selezionabili per vederle                    |
| Quantità            | `components/shop/quantity-input.tsx`  | − / campo numerico / +, limitato alla disponibilità                                                           |
| Carrello laterale   | `components/shop/cart-drawer.tsx`     | `dialog` con titolo, avanzamento verso la spedizione gratuita, totali                                         |
| Scelte del checkout | `features/shop/checkout-view.tsx`     | Schede `radio` con icona, descrizione e costo                                                                 |

## Stati e feedback

- **Caricamento:** scheletri con `aria-busy`; il catalogo statico è già visibile prima dei dati del browser.
- **Errori dei moduli:** sotto il campo, collegati con `aria-describedby`; dopo l'invio il focus va al primo errore.
- **Codice sconto:** messaggio specifico e annunciato (sconosciuto, non attivo, scaduto, ordine minimo).
- **Conferme:** notifiche brevi in una regione `aria-live`. Le azioni irreversibili (annullare un ordine, ripristinare la demo, cancellare l'account) passano da un `alertdialog`.

## Movimento

Ingrandimento leggero delle immagini al passaggio del mouse, apertura del carrello laterale, avanzamento della barra della spedizione gratuita (150–300 ms). Con `prefers-reduced-motion` le transizioni si disattivano.
