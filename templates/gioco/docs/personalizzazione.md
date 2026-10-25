# Personalizzazione — Arena

## In 10 minuti

| Cosa                                                                                 | Dove                                                                                |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Nome, società, concessione, contatti                                                 | `DEMO_SETTINGS` in `src/lib/demo/seed.ts`                                           |
| Importo minimo/massimo, vincita massima, eventi per schedina, attesa per gli aumenti | `DEMO_SETTINGS` (`minStake`, `maxStake`, `maxWin`, `maxLines`, `limitIncreaseDays`) |
| Colore d'accento                                                                     | token `--accent*` in `src/app/globals.css` (chiaro e scuro)                         |
| Logo e icona                                                                         | `src/components/site/logo.tsx`, `src/app/icon.svg`, `src/app/apple-icon.png`        |
| Testi                                                                                | `src/content/it.ts` (numero di aiuto in `HELPLINE`)                                 |
| Testi legali                                                                         | `src/app/(sito)/termini`, `privacy`, `regole`                                       |

## Mercati e sport

- Sport e nomi delle competizioni: `Sport` in `types.ts`, `copy.sports`, `COMPETITIONS` nel seed.
- Nuovo mercato: aggiungi il tipo a `MarketKind`, la regola di esito in `selectionOutcome` (`betting.ts`), il testo in `copy.markets` e `copy.sport.marketsShort`, poi un test.
- Margine delle quote demo: `MARGIN` nel seed.

## Giochi

Le slot sono definite in `GAMES` (`src/lib/domain/slots.ts`): strisce dei rulli, tabella dei pagamenti, premi delle ciliegie, puntate. L'RTP **non si scrive a mano**: è calcolato da `slotStats` su tutte le combinazioni. Dopo ogni modifica:

1. esegui `npm test` (il test controlla che l'RTP resti tra il 90% e il 97%);
2. verifica che la vincita massima sia coerente con le regole del gioco.

In produzione i giochi sono forniti e certificati da un fornitore omologato: sostituisci `SlotView` con il suo client e mostra i dati certificati.

## Gioco responsabile

| Cosa                             | Dove                                                                    |
| -------------------------------- | ----------------------------------------------------------------------- |
| Durate di pausa e autoesclusione | `PAUSE_DAYS`, `SELF_EXCLUSION_DAYS` in `responsible.ts`                 |
| Pausa dopo il limite di sessione | `SESSION_COOLDOWN_MINUTES`                                              |
| Opzioni di durata e promemoria   | `limitsSchema` in `schemas.ts` e `copy.responsible.session` / `reality` |
| Soglie dei segnali di rischio    | `riskSignals` in `responsible.ts`                                       |
| Durata minima della giocata      | `MIN_SPIN_MS` in `slots.ts`                                             |

Non rimuovere i limiti obbligatori né la barra delle avvertenze: sono requisiti del gioco pubblico.

## Solo scommesse o solo giochi

- **Solo scommesse:** rimuovi `src/app/(sito)/giochi`, `features/games` e la voce di menu; lascia `slots.ts` se vuoi riusarlo più avanti.
- **Solo giochi:** rimuovi `src/app/(sito)/sport`, `features/sport` e la pagina Eventi del pannello.
