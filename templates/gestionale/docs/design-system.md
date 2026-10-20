# Design system — Nucleo

Linguaggio visivo ispirato a semplicità, precisione e gerarchia: molto spazio, pochi colori, profondità discreta. Nessun asset o elemento proprietario di terzi.

Tutti i valori sono **token CSS** definiti in [`src/app/globals.css`](../src/app/globals.css) e mappati sulle utility Tailwind (`bg-surface`, `text-fg-muted`, `border-line`…). I componenti usano solo token: per cambiare aspetto basta modificare quel file.

## Principi

1. **Un solo accento.** Il blu cobalto indica azione e selezione; tutto il resto è neutro.
2. **Gerarchia con tipografia e spazio, non con colori.** Titoli in semibold, testo secondario in `fg-muted`.
3. **Stato = colore + icona + testo.** Mai il solo colore (daltonismo, stampa, contrasto forzato).
4. **Movimento funzionale.** Le animazioni spiegano un cambiamento, durano al massimo 260 ms e si spengono con "Riduci movimento".
5. **Densità calibrata.** Tabelle e agenda compatte su desktop; target di almeno 40–44 px e campi a 16 px su mobile (niente zoom automatico su iOS).

## Colori

### Superfici e testo

| Token         | Chiaro    | Scuro     | Uso                                         |
| ------------- | --------- | --------- | ------------------------------------------- |
| `canvas`      | `#F7F7F5` | `#0D0D0F` | Sfondo pagina (bianco caldo / nero morbido) |
| `surface`     | `#FFFFFF` | `#161618` | Card, modali, menu                          |
| `surface-2`   | `#F2F2EF` | `#1E1E21` | Hover, riempimenti tenui, scheletri         |
| `surface-3`   | `#E9E9E5` | `#28282C` | Stato premuto, avatar                       |
| `line`        | `#E5E4DF` | `#2B2B30` | Bordi decorativi                            |
| `line-strong` | `#8E8E95` | `#6B6B73` | Bordi dei controlli (≥ 3:1)                 |
| `fg`          | `#1A1A1C` | `#F2F2F3` | Testo principale                            |
| `fg-muted`    | `#5C5C63` | `#A3A3AA` | Testo secondario                            |
| `fg-subtle`   | `#6E6E75` | `#8E8E96` | Segnaposto, metadati                        |

### Accento e stati

| Token                 | Chiaro                | Scuro                 | Note                          |
| --------------------- | --------------------- | --------------------- | ----------------------------- |
| `accent`              | `#2856D6`             | `#3563E9`             | Pulsanti primari, selezione   |
| `accent-text`         | `#2451CC`             | `#86A6FF`             | Link e testo d'accento        |
| `accent-soft` / `-fg` | `#EBF0FC` / `#1F45AF` | `#1A2340` / `#A9C0FF` | Voce attiva, badge            |
| `success` / `-soft`   | `#17713E` / `#E6F4EC` | `#5BC98A` / `#132A1D` | Pagato, completato            |
| `warning` / `-soft`   | `#94500A` / `#FCF1E1` | `#EBAA4E` / `#2E2311` | Da confermare, avvisi         |
| `danger` / `-soft`    | `#BB3127` / `#FBEAE8` | `#FF8A80` / `#361A1C` | Errori, scaduto, eliminazione |
| `info` / `-soft`      | `#0A6580` / `#E3F2F6` | `#5CC2DF` / `#10282F` | Informazioni, in attesa       |

### Contrasti verificati (WCAG 2.2 AA)

| Coppia                          | Chiaro  | Scuro   |
| ------------------------------- | ------- | ------- |
| `fg` su `surface`               | 17,4:1  | 16,2:1  |
| `fg-muted` su `surface`         | 6,6:1   | 7,2:1   |
| `fg-subtle` su `canvas`         | 4,7:1   | 6,0:1   |
| Testo bianco su `accent`        | 6,2:1   | 5,1:1   |
| Stati su fondo `-soft`          | ≥ 5,0:1 | ≥ 6,9:1 |
| `line-strong` (bordi controlli) | 3,3:1   | 3,4:1   |

### Colori identità e grafici

Otto colori in **ordine fisso** (`--series-1 … --series-8`: blu, arancione, acqua, ambra, magenta, verde, viola, rosso), validati per la distinguibilità con daltonismo tra colori adiacenti. Sono usati per gli operatori in agenda e per le serie dei grafici. Accanto al colore c'è sempre il nome, quindi i tre colori più chiari, sotto 3:1 sul bianco, restano leggibili. Un nuovo operatore riceve il primo colore libero, senza generarne di nuovi.

## Tipografia

- **Font:** Inter (variabile, self-hosted da `next/font`), fallback di sistema.
- **Base interfaccia:** 14 px, interlinea 1,5; campi a 16 px sotto i 640 px.
- **Scala:** 11 (assi, etichette) · 12 · 13 (secondario) · 14 (corpo) · 15 (titoli di card) · 18 · 24/28 (titoli di pagina) · 26 (valori KPI).
- **Numeri:** `tabular-nums` in tabelle, orari e assi; cifre proporzionali per i valori grandi.
- **Titoli:** `text-wrap: balance`, tracking leggermente negativo.

## Spaziature, raggi, profondità

- **Griglia di 4 px.** Padding card 20–24 px, gap tra sezioni 24 px, gutter di pagina 16 px su mobile e 32 px su desktop.
- **Raggi:** 6 (controlli piccoli) · 8 (pulsanti, campi) · 12 (card) · 16–20 (modali, pannelli mobile).
- **Ombre:** `shadow-xs` sulle card, `shadow-md` su menu e popover, `shadow-lg` su modali e toast; più profonde in tema scuro.
- **Larghezza massima** del contenuto: 1400 px (calendario fino a 1600 px).

## Movimento

| Token                       | Durata        | Uso                                                                                 |
| --------------------------- | ------------- | ----------------------------------------------------------------------------------- |
| `animate-page-in`           | 220 ms        | Ingresso pagina (opacità + 6 px), riparte anche al ritorno su una pagina conservata |
| `animate-pop-in/out`        | 180 / 120 ms  | Menu, popover                                                                       |
| `animate-dialog-in/out`     | 220 / 140 ms  | Modali centrate                                                                     |
| `animate-sheet-up-in/out`   | 260 / 180 ms  | Modali su mobile (pannello dal basso)                                               |
| `animate-sheet-left-in/out` | 240 / 160 ms  | Menu laterale mobile                                                                |
| `animate-toast-in`          | 220 ms        | Notifiche temporanee                                                                |
| `animate-shimmer`           | 1,4 s ciclico | Scheletri di caricamento                                                            |
| Pressione pulsanti          | 150 ms        | `scale(0.98)`                                                                       |

Easing: `--ease-out` (cubic-bezier(0.22, 1, 0.36, 1)) in entrata, `--ease-in` in uscita. Con `prefers-reduced-motion: reduce` tutte le durate scendono a 0,01 ms (regola globale, verificata da un test e2e).

## Componenti

| Componente                                               | File                                        | Note                                                                                            |
| -------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Button                                                   | `components/ui/button.tsx`                  | primary, secondary, ghost, danger, danger-ghost; sm/md/lg/icon; `loading`; `asChild` per i link |
| Input, Textarea, Select, Checkbox                        | `components/ui/input.tsx`                   | Controlli nativi stilizzati, stato `aria-invalid`                                               |
| Field, ToggleRow                                         | `components/ui/field.tsx`                   | Etichetta, suggerimento ed errore collegati con `aria-describedby`                              |
| Switch                                                   | `components/ui/switch.tsx`                  | Impostazioni con effetto immediato                                                              |
| SegmentedControl                                         | `components/ui/segmented-control.tsx`       | Filtri e viste mutuamente esclusivi                                                             |
| SearchInput                                              | `components/ui/search-input.tsx`            | Con pulsante per svuotare                                                                       |
| Dialog, SheetContent                                     | `components/ui/dialog.tsx`                  | Centrata su desktop, pannello dal basso su mobile                                               |
| ConfirmDialog                                            | `components/ui/confirm-dialog.tsx`          | `alertdialog` per azioni distruttive                                                            |
| DropdownMenu, Popover, Tooltip, Tabs                     | `components/ui/*`                           | Primitive Radix accessibili                                                                     |
| Toast                                                    | `components/ui/toast.tsx`                   | `toast.success(…)`, azione di annullamento facoltativa                                          |
| Card, StatCard, Badge, Avatar, EmptyState, Skeleton, Kbd | `components/ui/*`                           |                                                                                                 |
| Table, SortableTH, Pagination                            | `components/ui/table.tsx`, `pagination.tsx` | `aria-sort`, conteggio annunciato                                                               |
| Page, PageHeader, Toolbar                                | `components/ui/page.tsx`                    | Struttura coerente di ogni pagina                                                               |
| ColumnChart, BarList, Meter, StackedBar                  | `components/charts/*`                       | Vedi sotto                                                                                      |
| Status badge                                             | `components/status-badges.tsx`              | Stati di cliente, appuntamento, pagamento                                                       |

## Stati e feedback

| Situazione           | Pattern                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| Caricamento          | Scheletri con la stessa forma del contenuto e `aria-busy`                                              |
| Vuoto                | `EmptyState` con icona, spiegazione e azione principale                                                |
| Nessun risultato     | Messaggio dedicato e "Azzera filtri"                                                                   |
| Validazione          | Errori sotto il campo all'invio, focus sul primo campo errato, rimozione mentre si corregge            |
| Successo             | Toast in basso a destra (sopra la tab bar su mobile), 4 s, con "Annulla" quando l'azione è reversibile |
| Azione distruttiva   | Conferma in `alertdialog` con conseguenze spiegate                                                     |
| Avviso non bloccante | Riquadro `role="alert"` nel modulo e pulsante che diventa "Salva comunque"                             |
| Errore imprevisto    | Error boundary con "Riprova"; pagina 404 dedicata                                                      |

## Grafici

- **Istogramma** per gli andamenti nel tempo: barre di massimo 24 px con estremità arrotondata di 4 px, griglia sottile, assi in `fg-muted`, tooltip al passaggio del mouse e al focus, frecce ← → per spostarsi tra le barre.
- **Classifiche** (BarList): etichetta e valore sempre visibili, quindi leggibili senza tooltip.
- **Barra a segmenti** con legenda testuale (etichetta, valore, percentuale) e 2 px di spazio tra i segmenti.
- **Misuratori** con `role="meter"`; la traccia è una tinta più chiara dello stesso colore e diventa di avviso oltre il 90%.
- Mai due assi Y, mai colori generati oltre gli otto previsti: le voci in eccesso confluiscono in "Altro".

## Icone

[Lucide](https://lucide.dev), tratto 1,9 (2,2 per la voce attiva), 16–18 px nell'interfaccia e 22 px nella tab bar. Le icone decorative hanno `aria-hidden`; i pulsanti con sola icona hanno sempre un'etichetta accessibile.
