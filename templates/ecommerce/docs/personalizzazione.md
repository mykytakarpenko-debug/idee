# Personalizzazione — Bottega

## 1. Dati del negozio

| Cosa                                                        | Dove                                                                 |
| ----------------------------------------------------------- | -------------------------------------------------------------------- |
| Nome, frase, ragione sociale, P. IVA, REA, sede, email, PEC | `DEMO_SETTINGS` in `src/lib/demo/seed.ts` (e dal pannello)           |
| Nome e descrizione per metadati e manifest                  | `src/config/brand.ts`                                                |
| Logo                                                        | `src/components/site/logo.tsx`, `src/app/icon.svg`, `apple-icon.png` |
| Testi dell'interfaccia                                      | `src/content/it.ts`                                                  |
| Condizioni di vendita, recesso, spedizioni, privacy         | `src/app/(negozio)/*/page.tsx` (testi di esempio da far rivedere)    |

## 2. Prodotti e categorie

In `src/lib/demo/seed.ts`:

- `CATEGORIES` e `SELLERS`;
- `DEFS`, l'elenco dei prodotti. Per ognuno:
  - nome, venditore, categoria e illustrazione (`art`);
  - descrizioni e dettagli;
  - `price` in centesimi;
  - `history`, le variazioni di prezzo passate in giorni rispetto a oggi;
  - `sale`, la promozione;
  - varianti `[nome, colore, scorte]`.

Dal pannello (_Prodotti_) si creano e modificano prodotti, varianti, scorte e promozioni.

## 3. Foto reali al posto delle illustrazioni

1. Aggiungi al tipo `Product` un campo `images: { src: string; alt: string; variantId?: string }[]`.
2. In `ProductCard`, `ProductView` e nelle righe di carrello e ordine sostituisci `<ProductArt …>` con `next/image`:
   - `fill` con `sizes` adeguati, es. `(min-width: 1024px) 33vw, 50vw`;
   - testo alternativo descrittivo nella galleria, `alt=""` nelle schede dove il nome è già nel link.
3. Se le immagini sono su un CDN esterno, aggiungi il dominio a `images.remotePatterns` in `next.config.ts` e a `img-src` nella CSP.

## 4. Spedizioni, resi e codici sconto

Da _Impostazioni_ nel pannello (o in `DEMO_SETTINGS`):

- costo della spedizione standard ed espressa e soglia per quella gratuita;
- ritiro in negozio e suo indirizzo;
- giorni di recesso (minimo 14);
- codici sconto: percentuale, importo fisso o spedizione gratuita, con ordine minimo e scadenza.

Per tariffe per peso o zona, estendi `shippingCost` in `src/lib/domain/cart.ts` usando `product.weight` e la provincia dell'indirizzo, e aggiorna i test.

## 5. Negozio singolo o marketplace

- **Negozio singolo:**
  - lascia un solo elemento in `SELLERS` con i dati del negozio e commissione `0`;
  - togli la voce "Laboratori" da `siteNavigation` e `panelNavigation` in `src/config/navigation.ts`;
  - nelle condizioni di vendita il venditore diventa il negozio stesso.
- **Marketplace:**
  - ogni venditore ha pagina, dati identificativi e commissione;
  - in produzione aggiungi onboarding, verifica dei dati, contratti e liquidazioni (vedi [architettura.md](architettura.md#collegare-un-backend)).

## 6. Colori e tipografia

In `src/app/globals.css` cambia i token `--accent*` per entrambi i temi, rispettando i contrasti di [design-system.md](design-system.md). Esempi:

| Settore                 | Accento suggerito                     |
| ----------------------- | ------------------------------------- |
| Moda, accessori         | Nero caldo `#2a2622` con testo bianco |
| Alimentari, gastronomia | Verde oliva `#556b2f`                 |
| Cosmetica naturale      | Rosa antico `#9b4a5f`                 |
| Elettronica, tecnologia | Blu `#1f5fa8`                         |

Il font dei titoli si cambia in `src/app/layout.tsx` (`Newsreader`) e in `--font-display`. Dopo ogni modifica lancia `npm run test:e2e`: i test axe controllano i contrasti in entrambi i temi.

## 7. Testi e lingua

Tutti i testi sono in `src/content/it.ts`, raggruppati per area (`product`, `cart`, `checkout`, `account`, `ordersPanel`…). Per un'altra lingua o valuta duplica il file e cambia `LOCALE` e `CURRENCY` in `src/lib/format.ts`. Verifica poi le norme del paese per prezzi, recesso e garanzia.

## 8. Dopo le modifiche

```bash
npm run check      # formattazione, lint, tipi, test unitari, build
npm run test:e2e   # flussi e accessibilità (dopo la build)
```

Se cambi i prodotti demo, aggiorna i test che li nominano (`tests/unit/*`, `tests/e2e/*`).
