# Personalizzazione — Vetrina

## In 10 minuti

| Cosa                                   | Dove                                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------------------- |
| Nome, descrizione, dati societari      | `site` in `src/content/site.ts`                                                       |
| Titolo, sottotitolo, inviti all'azione | `hero` in `src/content/site.ts`                                                       |
| Numeri, funzioni, passi, testimonianze | `stats`, `features`, `steps`, `testimonials`                                          |
| Piani e prezzi                         | `plans`, `ANNUAL_DISCOUNT`, `comparison`                                              |
| Domande frequenti                      | `faq` (finiscono anche nei dati strutturati)                                          |
| Chi siamo                              | `about`                                                                               |
| Articoli                               | `src/content/posts.ts`                                                                |
| Accento                                | `accent` in `src/config/brand.ts`                                                     |
| Logo e icone                           | `src/components/site/logo.tsx`, `src/app/icon.svg`, `apple-icon.png`, `public/og.png` |
| Testi dell'interfaccia                 | `src/content/it.ts`                                                                   |

## Prezzi

- `monthly` è il prezzo mensile per persona in centesimi, IVA esclusa; `0` = gratuito, `null` = su misura.
- Lo sconto annuale è unico (`ANNUAL_DISCOUNT`); il calcolatore usa il piano `team`.
- Per prezzi a pacchetto (non per persona) modifica `pricePerPerson` e `yearlyTotal` in `lib/pricing.ts` e i testi `copy.pricing`.
- Se vendi anche a privati, mostra i prezzi IVA inclusa (`withVat`): è obbligatorio verso i consumatori.

## Anteprima del prodotto

`components/marketing/product-mockup.tsx` disegna un'anteprima in HTML. Puoi sostituirla con uno screenshot reale usando `next/image` (formato AVIF/WebP, `priority` sopra la piega, testo alternativo descrittivo).

## Blog

Ogni articolo ha slug unico, data `YYYY-MM-DD`, autore, categoria, minuti di lettura e blocchi di contenuto. Sitemap, dati strutturati e articoli correlati si aggiornano da soli. Per un CMS vedi [architettura.md](architettura.md#collegare-un-cms).

## Modulo contatti

- Campi e messaggi: `lib/contact.ts` (schema condiviso) e `copy.contact`.
- Invio reale: completa il `TODO(integrazione)` in `src/app/api/contatti/route.ts`.
- Antispam: `MIN_FILL_MS` e limite in `createRateLimiter(5, 10 * 60_000)`.

## Cookie e strumenti di terze parti

Nessuno strumento non tecnico è incluso. Per aggiungerne uno (es. statistiche):

1. caricalo solo se `document.documentElement.dataset.consentStatistics === "granted"` (o leggendo `useConsent` in un componente client) e rimuovilo/disattivalo alla revoca;
2. aggiungilo alla tabella della cookie policy (`app/(sito)/cookie/page.tsx`) con fornitore, finalità e durata;
3. se cambiano strumenti o finalità, incrementa `CONSENT_VERSION` in `lib/consent.ts`: il banner verrà mostrato di nuovo.

Strumenti di statistica configurati per non identificare i visitatori (IP anonimizzato, nessun incrocio di dati) possono essere assimilati ai tecnici secondo il Garante: valuta con il consulente privacy.

## Pagine e menu

Rotte in `src/config/navigation.ts` (`routes`, `siteNavigation`); colonne del piè di pagina in `components/site/site-footer.tsx`.
