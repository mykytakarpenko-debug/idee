# Design system — Arena

Stessa base della libreria (neutri caldi, un solo accento, componenti condivisi). L'accento **smeraldo** è sobrio e lontano dai colori "da casinò": niente oro, niente luci, niente animazioni insistenti.

## Colori

| Token         | Chiaro    | Scuro     | Uso                                       |
| ------------- | --------- | --------- | ----------------------------------------- |
| `accent`      | `#047857` | `#06805c` | Pulsanti primari, quota selezionata       |
| `accent-text` | `#04694b` | `#4fd1a1` | Link, durata della sessione               |
| `accent-soft` | `#e2f3eb` | `#0f2a20` | Riga di pagamento della slot, voce attiva |
| `reel`        | `#fbfaf7` | `#1d1b17` | Sfondo dei rulli                          |

### Contrasti verificati (WCAG 2.2 AA)

| Coppia                            | Chiaro | Scuro |
| --------------------------------- | -----: | ----: |
| Testo bianco su `accent`          |   5,48 |  4,94 |
| `accent-text` su `canvas`         |   6,26 | 10,05 |
| `accent-soft-fg` su `accent-soft` |   8,45 | 10,15 |

Gli stati di vincita usano `success` con testo ("Vincente"), mai solo il colore.

## Tipografia

- **Inter** per i testi; **Space Grotesk** per titoli, quote e importi (cifre tabellari).
- Quote sempre con due decimali e virgola ("1,85").

## Avvertenze

- Barra sotto l'intestazione su ogni pagina del sito: contrassegno **18+**, frase sul rischio di dipendenza, numero del Telefono Verde (link `tel:`), durata della sessione per chi ha effettuato l'accesso.
- Ripetute nel piè di pagina con il segnaposto della concessione.
- Testo neutro: nessun "Vinci!", nessun conto alla rovescia, nessun importo vinto in evidenza.

## Componenti di gioco

| Componente       | Note                                                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Pulsante quota   | Esito + quota visibili; nome accessibile completo (evento, mercato, esito, quota); `aria-pressed`                                           |
| Schedina         | Laterale su desktop, pannello dal basso su mobile; errori in un'area `role="alert"`                                                         |
| Rulli            | 3×3, riga di pagamento evidenziata, righe esterne attenuate; leggero movimento durante la giocata, disattivato con `prefers-reduced-motion` |
| Simboli          | SVG decorativi; il nome del simbolo è sempre nel testo vicino o nell'annuncio                                                               |
| Promemoria       | Modale con minuti, giocato, vinto e saldo della sessione; "Continua" ed "Esci dal conto"                                                    |
| Avviso di blocco | Pausa, autoesclusione o pausa dopo la sessione, con la data di fine                                                                         |

## Grafici del pannello

Istogramma a serie singola della raccolta giornaliera (sempre positiva). Il margine (raccolta meno vincite) può essere negativo in un giorno: è mostrato come totale nei KPI, non come barre.
