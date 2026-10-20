# Standard di design e UX della libreria

Regole valide per tutti i template. Ogni template ha un'identità visiva propria (accento, tipografia, tono) ma segue gli stessi standard di esperienza.

## Linguaggio visivo

- **Semplicità e precisione:** ogni elemento ha uno scopo; niente decorazioni gratuite, gradienti casuali o effetti vistosi.
- **Palette:** bianchi caldi, grigi profondi e neri morbidi, più **un solo accento** coerente con il settore. Gli stati (successo, avviso, errore, info) usano colori dedicati e sono sempre accompagnati da icona e testo.
- **Gerarchia:** dimensioni e peso del testo prima del colore; un solo `h1` per pagina.
- **Spazio:** griglia di 4 px, layout ariosi, larghezza massima del contenuto 1200–1400 px.
- **Forme:** angoli morbidi (8 px per i controlli, 12 px per le card, 16–20 px per le modali), ombre leggere, più profonde solo sugli elementi sovrapposti.
- **Tema scuro selezionato, non invertito:** ogni colore ha il suo valore scuro, verificato a parte.
- **Nessun asset proprietario:** ispirazione alle migliori interfacce senza copiare loghi, icone, font o schermate di terzi.

## Accessibilità (obbligatoria)

- WCAG 2.2 AA: contrasto ≥ 4,5:1 per il testo e ≥ 3:1 per i controlli; focus sempre visibile; target touch di almeno 40–44 px.
- Uso completo da tastiera, landmark semantici, etichette sui controlli, errori annunciati.
- `prefers-reduced-motion` e `forced-colors` supportati.
- Test automatici axe in CI su ogni pagina, in tema chiaro e scuro, più la verifica manuale prima del rilascio.

## Movimento

| Tipo | Durata | Easing |
| --- | --- | --- |
| Feedback (hover, pressione) | 120–150 ms | ease-out |
| Menu, popover, toast | 180–220 ms | ease-out in entrata, ease-in in uscita |
| Modali e pannelli | 220–260 ms | ease-out |
| Ingresso pagina | ≤ 220 ms, spostamento ≤ 8 px | ease-out |

Le animazioni spiegano un cambiamento (da dove arriva un pannello, cosa è stato aggiornato) e non bloccano mai l'interazione.

## Pattern di interazione

- **Azione primaria** in alto a destra di ogni pagina; azioni secondarie a sinistra di essa o in un menu "…".
- **Moduli:** etichette sopra i campi, campi facoltativi marcati "(facoltativo)", validazione all'invio con focus sul primo errore, valori predefiniti intelligenti.
- **Azioni distruttive:** conferma con le conseguenze spiegate; per i cambi di stato, toast con "Annulla".
- **Liste:** ricerca, filtri in una sola riga sopra il contenuto, stato vuoto e "nessun risultato" distinti, paginazione o caricamento progressivo.
- **Caricamento:** scheletri con la forma del contenuto; nessuno spostamento del layout.
- **Mobile:** navigazione inferiore per le 4–5 sezioni principali, modali come pannelli dal basso, campi a 16 px.

## Testi

- Italiano chiaro e professionale, seconda persona ("Aggiungi il primo cliente…").
- Verbi d'azione sui pulsanti ("Registra pagamento", non "OK").
- Messaggi d'errore che spiegano come risolvere ("Inserisci un importo valido, es. 38,50").
- Tutti i testi in un unico file per template (`src/content/it.ts`), pronti per la traduzione.

## Grafici e dati

- Una forma per ogni scopo: istogramma per gli andamenti, classifiche a barre per i confronti, KPI per i numeri singoli.
- Un solo asse Y; colori in ordine fisso, validati per il daltonismo; legenda testuale quando ci sono 2 o più serie.
- Tooltip accessibili da tastiera; valori sempre raggiungibili senza passare il mouse.
- Numeri tabulari nelle colonne, formati locali (`1.234,50 €`, `20 ott 2026`).

## Struttura del codice

```text
src/app/          rotte e metadati
src/features/     viste per area (moduli, azioni)
src/components/   ui · charts · layout (riutilizzabili)
src/lib/domain/   tipi, schemi Zod, logica pura testata
src/store/        stato (dati, UI, preferenze)
src/content/      testi
src/config/       brand, navigazione, env
tests/            unit (Vitest) · e2e + accessibilità (Playwright + axe)
docs/             brief, design system, architettura, personalizzazione, sicurezza
```
