# Architettura — Vetrina

## Panoramica

```text
Build (Next.js)
 ├─ Pagine statiche: home, funzionalità, prezzi, chi siamo, blog e articoli, legali
 ├─ sitemap.xml, robots.txt, manifest, icone, og.png
 └─ Route handler dinamico: POST /api/contatti
Browser
 ├─ Componenti interattivi: menu, selettore dei prezzi, calcolatore, FAQ, modulo
 └─ Consenso ai cookie: banner, preferenze, attributi data-consent-* sull'html
```

Nessun database: i contenuti stanno in `src/content/` e sono compilati nelle pagine. La logica (prezzi, consenso, contatti, dati strutturati) è in `src/lib/` come funzioni pure testate.

## Modulo contatti

1. Il browser valida con `contactSchema` (`lib/contact.ts`) e mostra gli errori accanto ai campi.
2. Invia JSON a `/api/contatti` con il campo trappola (`website`) e il tempo di compilazione.
3. Il server:
   - applica un limite di 5 richieste ogni 10 minuti per IP (in memoria: indicativo su serverless; in produzione usa un archivio condiviso come Upstash Redis o il firewall di Vercel);
   - scarta in silenzio gli invii sospetti (risponde `ok` per non insegnare ai bot come aggirarlo);
   - rivalida con lo stesso schema e restituisce gli errori per campo;
   - **da collegare:** invio email o CRM; per la newsletter, double opt-in con email di conferma.

Non registra dati personali nei log.

## Consenso ai cookie

- `lib/consent.ts`: modello (categorie, versione, data), lettura con scadenza a 180 giorni e invalidazione al cambio di versione.
- `components/site/cookie-consent.tsx`: stato condiviso (Zustand), banner, preferenze, pulsante nel piè di pagina.
- Il consenso è esposto come `data-consent-statistics` / `data-consent-marketing` su `<html>` (`granted` / `denied`): gli script di terze parti vanno caricati solo quando l'attributo è `granted` (vedi [personalizzazione](personalizzazione.md#cookie-e-strumenti-di-terze-parti)).

## SEO

- `metadata` per pagina con `alternates.canonical`; Open Graph e Twitter dal layout; `og.png` 1200×630 in `public/`.
- `sitemap.ts` con pagine e articoli (`lastModified` = data dell'articolo); `robots.ts` blocca `/api/` e, con `NEXT_PUBLIC_ALLOW_INDEXING=false`, tutto il sito.
- `lib/seo.ts`: JSON-LD per Organization/WebSite, SoftwareApplication con le offerte (IVA esclusa), FAQPage, BlogPosting, BreadcrumbList; serializzazione con `<` neutralizzato.

## Collegare un CMS

`content/posts.ts` esporta oggetti `Post` con blocchi (`p`, `h2`, `ul`, `note`). Per un CMS headless (Sanity, Contentful, Strapi) o file MDX:

1. crea una funzione `getPosts()` che restituisce `Post[]` (con `"use cache"` e `cacheLife`);
2. usala in `blog/page.tsx`, `blog/[slug]/page.tsx` (`generateStaticParams`) e `sitemap.ts`;
3. per l'aggiornamento immediato, invalida la cache con un webhook del CMS (`revalidateTag`).
