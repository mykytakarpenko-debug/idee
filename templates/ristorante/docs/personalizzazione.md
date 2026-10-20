# Guida alla personalizzazione — Tavola

Le modifiche più comuni richiedono un solo file. Dopo ogni modifica esegui `npm run check` (e `npm run test:e2e` se tocchi colori o pagine).

## Il tuo locale

| Cosa                                                    | Dove                                                                                                            |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Nome, payoff, descrizione, indirizzo, contatti, P. IVA  | `DEMO_SETTINGS` in [`src/lib/demo/seed.ts`](../src/lib/demo/seed.ts) (o dal pannello)                           |
| Orari di pranzo e cena                                  | `DEMO_SETTINGS.hours` o _Impostazioni → Servizi_                                                                |
| Regole di prenotazione e consegna                       | `DEMO_SETTINGS.booking` / `.delivery` o _Impostazioni_                                                          |
| Nome del prodotto e colore della barra del browser      | [`src/config/brand.ts`](../src/config/brand.ts)                                                                 |
| Favicon e icona app                                     | `src/app/icon.svg`, `src/app/apple-icon.png` (180×180)                                                          |
| Testi della home (valori, consegna, "vieni a trovarci") | `copy.home` in [`src/content/it.ts`](../src/content/it.ts)                                                      |
| Informativa privacy                                     | [`src/app/(sito)/privacy/page.tsx`](<../src/app/(sito)/privacy/page.tsx>) — da completare con il tuo consulente |
| Tipo di cucina e fascia di prezzo per Google            | `servesCuisine` e `priceRange` in [`src/lib/seo.ts`](../src/lib/seo.ts)                                         |

## Menu

Il menu demo è in `CATEGORIES` e `DISHES` dentro `seed.ts`. Ogni piatto è una riga:

```ts
["primi", "Tagliatelle al ragù", "Tagliatelle tirate al mattarello…", 14, ["glutine", "uova", "sedano"], { featured: true }],
//  categoria  nome                  descrizione                         €    allergeni (14 UE)                 opzioni
```

Opzioni: `vegetarian`, `vegan`, `spicy`, `featured` (in home), `orderable: false` (solo in sala, es. vini al calice). Gli allergeni ammessi sono quelli dell'allegato II del Reg. UE 1169/2011, elencati in `ALLERGENS` (`lib/domain/types.ts`): TypeScript segnala nomi sbagliati.

Dal pannello puoi già aggiungere, modificare, eliminare piatti e segnarli come esauriti.

## Tavoli e sala

`TABLES` in `seed.ts`: nome, posti, zona (`sala`, `dehors`, `prive`), forma (`round`, `square`, `rect`). I tavoli rettangolari occupano due colonne nella mappa. Per aggiungere una zona (es. "terrazza") estendi `TableZone` in `types.ts` e aggiungi l'etichetta in `copy.zones`.

L'assegnazione automatica sceglie il tavolo più piccolo che basta. Per unire tavoli o gestire turni fissi modifica `freeTables` e `assignTable` in `lib/domain/booking.ts` (sono coperti da test: aggiornali di conseguenza).

## Colori e tipografia

1. In [`src/app/globals.css`](../src/app/globals.css) modifica `--accent`, `--accent-hover`, `--accent-text`, `--accent-soft`, `--accent-soft-fg` e `--focus` in `:root` e in `[data-theme="dark"]`.
2. Verifica i contrasti: testo bianco su `--accent` ≥ 4,5:1, `--accent-text` su `--canvas` ≥ 4,5:1 (vedi la tabella in [design-system.md](design-system.md#contrasti-verificati-wcag-22-aa)).
3. Aggiorna `brand.themeColor` e il colore di `icon.svg`.
4. Esegui `npm run build && npm run test:e2e`: un contrasto insufficiente fa fallire i test di accessibilità.

Accenti adatti ad altri locali: verde oliva `#5B6B2F` (cucina vegetale), blu profondo `#24508F` (pesce), bordeaux `#8E2C3A` (enoteca). Ricalcola sempre i toni `-soft` e quelli per il tema scuro.

Il font dei titoli è **Fraunces**, caricato in [`src/app/layout.tsx`](../src/app/layout.tsx) e usato tramite `font-display`. Per un tono più moderno sostituiscilo con un sans (es. `Manrope`) mantenendo `variable: "--font-fraunces"` o aggiornando `--font-display` in `globals.css`.

## Adattare il template

| Locale                           | Cosa cambiare                                                                                                                                  |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pizzeria**                     | Categorie (pizze rosse/bianche, fritti), solo cena, durata tavolo 75', consegna più ampia, tempi di preparazione 15'                           |
| **Bar / caffetteria**            | Disattiva le prenotazioni (`booking.enabled = false`) e la consegna; tieni menu e asporto con orari continui (un solo servizio "pranzo" lungo) |
| **Solo delivery / dark kitchen** | Rimuovi `/prenota`, `/gestione/sala` e `/gestione/prenotazioni` da rotte e navigazione; lascia ordini e menu                                   |
| **Ristorante con turni**         | Imposta `slotMinutes` a 15 e usa orari fissi (es. 19:30 e 21:30) limitando i servizi in `bookingSlots`                                         |

Per rimuovere una pagina: elimina la cartella della rotta e la vista in `features/`, togli la voce da [`src/config/navigation.ts`](../src/config/navigation.ts) e il percorso in `tests/e2e/helpers.ts`, poi esegui `npm run check`.

## Testi e lingua

Tutti i testi sono in [`src/content/it.ts`](../src/content/it.ts), raggruppati per pagina (sito e pannello). Per una versione inglese duplica il file come `en.ts` mantenendo le chiavi: il tipo `Copy` segnala quelle mancanti. Lingua, valuta e formati sono in [`src/lib/format.ts`](../src/lib/format.ts).

## Dati demo

- `createDemoData(now)` genera prenotazioni da 3 settimane fa a 2 settimane avanti e ordini "vivi" per il servizio in corso o il prossimo; il riempimento si regola con `load` (più alto a cena e nel weekend).
- Cambiando il seme `SEED` cambiano nomi e distribuzione, sempre in modo ripetibile.
- Se modifichi la forma dei dati incrementa `DATA_VERSION` in `store/data-store.ts`: i browser con dati vecchi verranno rigenerati.
