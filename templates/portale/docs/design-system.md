# Design system — Portale

Stessa base dei template della libreria (neutri caldi, un solo colore d'accento, componenti condivisi); qui l'accento è **indaco**, il colore della fiducia e del lavoro "da ufficio", distinto dai colori di stato.

## Colori

Token in `src/app/globals.css`; il tema scuro ridefinisce gli stessi token sotto `[data-theme="dark"]`.

| Token         | Chiaro    | Scuro     | Uso                                  |
| ------------- | --------- | --------- | ------------------------------------ |
| `canvas`      | `#f7f7f5` | `#0e0e11` | Sfondo della pagina                  |
| `surface`     | `#ffffff` | `#16161a` | Card, modali, tabelle                |
| `accent`      | `#4f46e5` | `#5a52e0` | Pulsanti primari, barre, voce attiva |
| `accent-text` | `#4338ca` | `#a9a4ff` | Link e testo d'accento               |
| `accent-soft` | `#ecebfb` | `#1f1d3a` | Sfondo della voce di menu attiva     |
| `fg-muted`    | `#5d5d63` | `#a6a6ad` | Testo secondario                     |
| `line-strong` | `#88888e` | `#6a6a71` | Bordo dei campi (contrasto ≥ 3:1)    |

### Contrasti verificati (WCAG 2.2 AA)

| Coppia                            | Chiaro | Scuro |
| --------------------------------- | -----: | ----: |
| Testo bianco su `accent`          |   6,29 |  5,65 |
| `accent-text` su `canvas`         |   7,37 |  8,66 |
| `fg-muted` su `canvas`            |   6,10 |  7,97 |
| `accent-soft-fg` su `accent-soft` |   8,44 |  9,52 |

I test axe controllano tutte le pagine in entrambi i temi.

## Stati: colore + icona + testo

Ogni stato usa un badge con icona e parola, mai solo il colore (`src/components/badges.tsx`):

| Famiglia | Valori e tono                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------------ |
| Ticket   | Aperto (info), In lavorazione (accento), In attesa del cliente (avviso), Risolto (successo), Chiuso (neutro) |
| Priorità | Bassa, Normale (neutro), Alta (avviso), Urgente (errore)                                                     |
| SLA      | Nei tempi (neutro), A rischio (avviso), Superato (errore), Risposta nei tempi (successo)                     |
| Progetto | In pianificazione, In corso, In pausa, Completato; salute: Nei tempi, A rischio, In ritardo                  |
| Fatture  | Pagata, Da pagare, Scaduta                                                                                   |
| Utenti   | Attivo, Invitato, Disattivato                                                                                |

Le note interne hanno sfondo giallo tenue e il badge "Nota interna" con lucchetto.

## Tipografia e spaziatura

- **Inter** per tutto (titoli in semibold, `tracking-tight`); numeri tabellari negli importi e nei KPI.
- Titolo di pagina 28 px (24 su mobile), testo 14 px, testo secondario 13 px.
- Card con raggio 12 px, bordo sottile, ombra minima; spaziatura tra sezioni 24 px.

## Grafici

- **Istogramma** a serie singola per i ticket settimanali, con selettore "Aperti / Risolti" al posto di due serie sovrapposte: una scala, una serie, nessuna legenda necessaria.
- Barre ≤ 24 px con estremità arrotondata, griglia leggera, tooltip al passaggio e al focus, frecce ← → per spostarsi tra le barre; ogni barra annuncia etichetta e valore.
- **Barra di avanzamento** dei progetti con `role="meter"` e valore testuale ("Avanzamento 60%").

## Componenti principali

| Componente              | Dove                      | Note                                                                   |
| ----------------------- | ------------------------- | ---------------------------------------------------------------------- |
| `PanelShell`            | `components/panel/`       | Sidebar filtrata per permesso, barra inferiore su mobile, menu account |
| `RequirePermission`     | `components/panel/`       | Mostra "Accesso non consentito" se manca il permesso                   |
| `Table` (`scrollLabel`) | `components/ui/table.tsx` | Tabelle larghe scorrevoli e raggiungibili da tastiera                  |
| `ToggleRow` + `Switch`  | `components/ui/`          | Impostazioni con effetto immediato, etichetta e descrizione collegate  |
| `ConfirmDialog`         | `components/ui/`          | Conferma per disattivazioni e ripristino della demo                    |
| `SegmentedControl`      | `components/ui/`          | Filtri rapidi (cartelle, stato dei ticket, serie del grafico)          |

## Movimento

Animazioni brevi (150–250 ms) per pagine, modali e menu; con `prefers-reduced-motion` restano solo le dissolvenze minime.
