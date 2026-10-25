# Design system — Vetrina

Base comune della libreria (neutri caldi, profondità discreta, tema chiaro e scuro) con **un solo accento configurabile**.

## Accenti

Imposta `accent` in `src/config/brand.ts`; i valori sono in `src/app/globals.css` (sezione 2). Il layout lo applica come `data-accent` sull'elemento `<html>`.

| Preset         | Accento chiaro | Accento scuro | Bianco su accento (chiaro/scuro) | Testo d'accento su sfondo (chiaro/scuro) |
| -------------- | -------------- | ------------- | -------------------------------- | ---------------------------------------- |
| `viola` (base) | `#6d28d9`      | `#6d28d9`     | 7,10 / 7,10                      | 6,58 / 10,51                             |
| `blu`          | `#1d4ed8`      | `#1d4ed8`     | 6,70 / 6,70                      | 6,21 / 9,41                              |
| `verde`        | `#0f766e`      | `#0f766e`     | 5,47 / 5,47                      | 5,07 / 13,11                             |
| `rosso`        | `#be123c`      | `#be123c`     | 6,29 / 6,29                      | 5,82 / 10,26                             |

Tutti superano WCAG 2.2 AA. Con `rosso` gli errori restano riconoscibili perché accompagnati da testo e icone.

Per un accento nuovo: definisci `--accent`, `--accent-hover`, `--accent-text`, `--accent-soft`, `--accent-soft-fg`, `--focus` per i due temi, verifica i contrasti (≥ 4,5:1) ed esegui i test di accessibilità.

## Tipografia

- **Inter** per tutto; titoli in semibold con `tracking-tight` e `text-balance`.
- Scala: titolo della home 60 px (36 su mobile), titoli di pagina 48 px, sezioni 36 px, testo 16–18 px.
- Articoli del blog a 17 px con interlinea ampia e larghezza massima di circa 70 caratteri.

## Sezioni

Alternanza di sfondo `canvas` e `surface` con bordi sottili per separare le sezioni senza ombre pesanti; spaziatura verticale 64–96 px.

## Componenti di marketing

| Componente          | Note                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------- |
| `ProductMockup`     | Anteprima in HTML/CSS: leggera, nitida, con descrizione per i lettori di schermo          |
| `PricingPlans`      | Selettore mensile/annuale (radio), piano consigliato con bordo e etichetta                |
| `ComparisonTable`   | Tabella con intestazioni di riga, "Incluso/Non incluso" testuali, scorrimento da tastiera |
| `PricingCalculator` | Cursore con valore `output` e risultato annunciato (`aria-live`)                          |
| `FaqList`           | `<details>` nativi: funzionano senza JavaScript                                           |
| `CookieConsent`     | Banner non bloccante, pulsanti "Rifiuta"/"Accetta tutti" con lo stesso stile              |
| `CtaSection`        | Blocco con sfondo d'accento e un solo invito                                              |

## Movimento

Solo transizioni brevi (apertura di menu, FAQ, modali); rispettato `prefers-reduced-motion`.
