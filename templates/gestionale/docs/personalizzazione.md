# Guida alla personalizzazione — Nucleo

Le personalizzazioni più comuni richiedono di modificare un solo file.

## Branding

| Cosa                                                      | Dove                                                                                 |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Nome, payoff, descrizione, colore della barra del browser | [`src/config/brand.ts`](../src/config/brand.ts)                                      |
| Logo nell'interfaccia                                     | [`src/components/layout/logo.tsx`](../src/components/layout/logo.tsx) (SVG in linea) |
| Favicon e icona app                                       | `src/app/icon.svg`, `src/app/apple-icon.png` (180×180)                               |
| Nome dell'attività demo e titolare                        | `DEMO_SETTINGS` in [`src/lib/demo/seed.ts`](../src/lib/demo/seed.ts)                 |

## Colori

Modifica i token in [`src/app/globals.css`](../src/app/globals.css), nei blocchi `:root` (chiaro) e `[data-theme="dark"]` (scuro).

1. **Accento:** cambia `--accent`, `--accent-hover`, `--accent-text`, `--accent-soft`, `--accent-soft-fg` e `--focus` in entrambi i temi.
2. **Verifica i contrasti:** testo bianco su `--accent` ≥ 4,5:1; `--accent-text` su `--surface` e `--canvas` ≥ 4,5:1. Puoi usare il pannello di accessibilità di Chrome DevTools o un controllo come [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/).
3. **Aggiorna** `brand.themeColor` e il colore in `icon.svg`.
4. **Esegui i test di accessibilità:** `npm run build && npm run test:e2e`. Qualunque contrasto insufficiente fa fallire il test.

Esempi di accento per altri settori: verde salvia `#2F7D5B` (benessere), terracotta `#B4532A` (ristorazione), viola `#6D4AE0` (tecnologia). Ricalcola sempre i toni chiari (`-soft`) e quelli per il tema scuro.

## Tipografia

Il font è caricato in [`src/app/layout.tsx`](../src/app/layout.tsx) con `next/font/google`. Per cambiarlo importa un altro font, ad esempio `import { Manrope } from "next/font/google"`, mantenendo `variable: "--font-inter"` oppure aggiornando `--font-sans` in `globals.css`. I font vengono serviti dal tuo dominio, senza richieste a Google dal browser.

## Testi e lingua

- Tutti i testi dell'interfaccia sono in [`src/content/it.ts`](../src/content/it.ts), raggruppati per pagina. Le funzioni gestiscono plurali e valori: `count: (n) => …`.
- Per tradurre l'app crea `en.ts` con le stesse chiavi: il tipo `Copy` segnala le chiavi mancanti.
- Lingua, valuta e formati di data sono centralizzati in [`src/lib/format.ts`](../src/lib/format.ts) (`LOCALE`, `CURRENCY`, locale di date-fns). Ricorda anche `lang="it"` in `layout.tsx`.

## Dati demo e settore

[`src/lib/demo/seed.ts`](../src/lib/demo/seed.ts) definisce servizi (`SERVICES`), operatori (`STAFF`), nomi, etichette, stagionalità (`dayLoad`) e orari. Per adattare la demo, ad esempio a uno studio di consulenza:

1. Sostituisci `SERVICES` con le prestazioni (nome, categoria, minuti, prezzo, peso, descrizione).
2. Aggiorna `STAFF` e le categorie che ogni persona può svolgere.
3. Modifica `DEMO_SETTINGS.hours` e la funzione `dayLoad` (carico di lavoro e chiusure).
4. Per azzerare i dati salvati: _Impostazioni → Dati e privacy → Ripristina dati demo_. Se cambi la forma dei dati, incrementa anche `DATA_VERSION` in `store/data-store.ts`.

> Attenzione ai dati sanitari: per studi medici o fisioterapici le note cliniche sono dati "particolari" (art. 9 GDPR) e richiedono misure dedicate. Il template non è predisposto per conservarli.

## Animazioni

- Durate ed easing sono token in `globals.css` (`--animate-*`, `--ease-out`, `--ease-in`).
- Per un'interfaccia più statica riduci le durate o rimuovi `animate-page-in` dal componente `Page` (`components/ui/page.tsx`).
- La regola `prefers-reduced-motion` in fondo a `globals.css` va sempre mantenuta.

## Navigazione e nuove funzionalità

### Aggiungere una pagina

1. Crea `src/app/(app)/nome/page.tsx` con `metadata` e una vista in `src/features/nome/`.
2. Aggiungi la voce in [`src/config/navigation.ts`](../src/config/navigation.ts): sidebar, menu mobile e ricerca rapida si aggiornano da soli.
3. Aggiungi i testi in `content/it.ts` e il percorso in `tests/e2e/helpers.ts`: i test di navigazione e accessibilità coprono subito la nuova pagina.

### Aggiungere un campo (esempio: data di nascita del cliente)

1. Aggiungi il campo al tipo `Client` in `lib/domain/types.ts`.
2. Estendi `clientFormSchema` in `lib/domain/schemas.ts`.
3. Aggiungi il `<Field>` in `features/clients/client-form-dialog.tsx` e il valore iniziale in `toValues`.
4. Mostra il dato nella scheda cliente e, se serve, nell'export CSV.
5. Incrementa `DATA_VERSION` e scrivi una migrazione in `persist({ migrate })`, se i dati salvati devono essere aggiornati.

### Rimuovere un modulo

Togli la voce da `config/navigation.ts`, elimina la cartella della rotta e la cartella in `features/`, poi esegui `npm run check`: TypeScript e lint segnalano i riferimenti rimasti.

### Aggiungere una modale globale

Aggiungi un tipo a `DialogRequest` in `store/ui-store.ts`, crea il componente in `features/…` e collegalo in `components/layout/global-dialogs.tsx`. Da quel momento puoi aprirla ovunque con `openDialog({ type: "…" })`.
