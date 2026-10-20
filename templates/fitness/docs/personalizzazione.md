# Guida alla personalizzazione — Forma

Dopo ogni modifica esegui `npm run check`; se tocchi colori o pagine anche `npm run build && npm run test:e2e`.

## Il tuo club

| Cosa                                          | Dove                                                                                   |
| --------------------------------------------- | -------------------------------------------------------------------------------------- |
| Nome, frase, descrizione, indirizzo, contatti | `DEMO_SETTINGS` in [`src/lib/demo/seed.ts`](../src/lib/demo/seed.ts) o _Impostazioni_  |
| Orari di apertura                             | `DEMO_SETTINGS.hours` o _Impostazioni → Orari_                                         |
| Regole di prenotazione, certificato, scadenze | `DEMO_SETTINGS.booking` e regole o _Impostazioni_                                      |
| Logo (segno grafico)                          | [`src/components/site/logo.tsx`](../src/components/site/logo.tsx) e `src/app/icon.svg` |
| Testi della home, FAQ dei prezzi              | `copy.home` e `copy.pricing.faq` in [`src/content/it.ts`](../src/content/it.ts)        |
| Informativa privacy                           | [`src/app/(sito)/privacy/page.tsx`](<../src/app/(sito)/privacy/page.tsx>)              |

## Corsi, istruttori e palinsesto

In `seed.ts`:

- `COURSES`: nome, categoria (`forza`, `cardio`, `mente_corpo`, `ritmo`), intensità 1–3, durata, descrizione, adatto ai principianti;
- `INSTRUCTORS`: nome, ruolo, breve biografia;
- `SCHEDULE`: una riga per lezione ricorrente, nel formato `[giorno 1–7, "HH:mm", corso, istruttore, sala]`;
- `CAPACITY`: posti per sala.

Le lezioni in calendario vengono generate dal palinsesto. Le sale disponibili sono in `Room` (`types.ts`) e `copy.rooms`.

Per **aggiungere una categoria** (es. "acqua"):

1. Estendi `COURSE_CATEGORIES` in `types.ts`.
2. Aggiungi le etichette in `copy.categories` e `copy.interests`.
3. Il colore sarà `--series-5`, con nome sempre visibile.

## Piani e prezzi

`PLANS` in `seed.ts` o _Gestione → Piani_. Ogni piano ha:

- tipo: `monthly` (abbonamento) o `pack` (carnet);
- prezzo;
- ingressi e validità, per i carnet;
- cosa include: sala attrezzi e/o lezioni;
- vantaggi e messa in evidenza.

Lo sconto annuale è `ANNUAL_MONTHS_CHARGED` in [`src/lib/domain/membership.ts`](../src/lib/domain/membership.ts): 10 significa "12 mesi al prezzo di 10". Aggiorna anche il badge `copy.pricing.annualBadge`.

## Colori e tipografia

1. In [`src/app/globals.css`](../src/app/globals.css) modifica `--accent`, `--accent-hover`, `--accent-text`, `--accent-soft`, `--accent-soft-fg`, `--focus` in entrambi i temi.
2. Verifica i contrasti: bianco su `--accent` ≥ 4,5:1 e `--accent-text` su `--canvas` ≥ 4,5:1 ([tabella](design-system.md#contrasti-verificati-wcag-22-aa)).
3. Aggiorna `brand.themeColor` e `icon.svg`, poi esegui i test di accessibilità.

Accenti per altri stili:

| Stile    | Colore    |
| -------- | --------- |
| Boutique | `#7A4FD6` |
| Crossfit | `#C2410C` |
| Spa      | `#2B6CB0` |

Con un accento verde diverso da quello di partenza, controlla che resti distinguibile da `success`.

Il font dei titoli è **Archivo** (`layout.tsx`, variabile `--font-archivo`). Per un tono più morbido sostituiscilo, ad esempio con `Manrope`.

## Adattare il template

| Attività                       | Cosa cambiare                                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| **Studio yoga / pilates**      | Una o due sale, categorie "mente e corpo"; carnet come piano principale, `maxDailyBookings = 1`, certificato facoltativo |
| **Box crossfit**               | Lezioni ogni ora e capienza 12; `cancelHours = 2`; piano "Open box" che include solo la sala                             |
| **Piscina o centro acquatico** | Categoria "acqua" e sale = corsie; aggiungi la capienza per corsia in `CAPACITY`                                         |
| **Personal trainer**           | Capienza 1 per lezione; disattiva la lista d'attesa; i piani diventano pacchetti di sedute (`pack`)                      |

## Testi e lingua

Tutti i testi sono in [`src/content/it.ts`](../src/content/it.ts), divisi per area: sito, area socio e pannello. Anche i motivi di blocco (`bookingBlocks`) e gli esiti del check-in sono lì. Per tradurre, duplica il file mantenendo le chiavi.

## Dati demo

- Il socio dell'area demo è `DEMO_MEMBER_ID` (`m_1`), con abbonamento Completo e certificato in scadenza, per mostrare gli avvisi.
- Distribuzione degli stati e dei certificati: `makeMember` in `seed.ts`.
- Cambiando `SEED` cambiano nomi e numeri, sempre in modo ripetibile.
- Se cambi la forma dei dati incrementa `DATA_VERSION` in `store/data-store.ts`.
