# Personalizzazione — Portale

## In 10 minuti

| Cosa                          | Dove                                                                             |
| ----------------------------- | -------------------------------------------------------------------------------- |
| Nome del fornitore e supporto | `DEMO_SETTINGS` in `src/lib/demo/seed.ts` (modificabili anche da _Impostazioni_) |
| Nome del prodotto e metadati  | `src/config/brand.ts`                                                            |
| Colore d'accento              | token `--color-accent*` in `src/app/globals.css` (chiaro e scuro)                |
| Icona                         | `src/app/icon.svg`, `src/app/apple-icon.png`                                     |
| Testi                         | `src/content/it.ts`                                                              |
| Informativa privacy           | `src/app/(accesso)/privacy/page.tsx`                                             |

## Colori

Cambia insieme `--color-accent`, `--color-accent-hover`, `--color-accent-text`, `--color-accent-soft` e `--color-accent-soft-fg`, nei due temi. Verifica:

- testo bianco su `accent` ≥ 4,5:1;
- `accent-text` su `canvas` e `surface` ≥ 4,5:1;
- poi esegui i test di accessibilità (`npm run test:e2e`).

Evita accenti rossi, arancioni o verdi: si confonderebbero con errore, avviso e successo.

## Ruoli e permessi

Tutto in `src/lib/domain/rbac.ts`:

- **aggiungere un permesso:** aggiungilo a `PERMISSIONS`, assegnalo ai ruoli in `MATRIX`, dagli un testo in `copy.permissions`; usalo in navigazione, pagina (`RequirePermission`) e azione dello store;
- **aggiungere un ruolo:** estendi il tipo `Role` in `types.ts`, la matrice, `copy.roles` e `copy.roleDescriptions`; decidi se è staff (`isStaff`) e chi può assegnarlo (`assignableRoles`);
- la pagina _Ruoli_ e i test si aggiornano da soli dalla matrice.

## Assistenza

- **Tempi di risposta:** _Impostazioni → Tempi di prima risposta_ o `slaHours` in `DEMO_SETTINGS`.
- **Tipi di ticket:** `TicketCategory` in `types.ts`, `copy.ticketCategory`, schema `ticketSchema`.
- **Stati e transizioni:** `TRANSITIONS` e `nextStatuses()` in `lib/domain/tickets.ts`.
- **Soglia "a rischio":** in `slaState()` (ultimo quarto del tempo).

## Documenti

Cartelle in `Folder` (`types.ts`), `copy.folders` e `uploadSchema`. Per tipi di file e icone vedi `DocumentKind` e `ICONS` in `features/portal/documents-view.tsx`.

## Sicurezza

Da _Impostazioni_ o in `DEMO_SETTINGS`: verifica in due passaggi obbligatoria, minuti di inattività, giorni di conservazione del registro. Tentativi e durata del blocco: `MAX_ATTEMPTS` e `LOCK_MINUTES` in `lib/domain/auth.ts`.

## Navigazione

`src/config/navigation.ts`: rotte, voci del portale e dell'area admin con icona e permesso. Su mobile le prime 4 voci consentite vanno nella barra inferiore, le altre in "Altro".

## Dati demo

`src/lib/demo/seed.ts` genera aziende, utenti, progetti, documenti, ticket, fatture e registro in modo deterministico rispetto a oggi. Cambia nomi, settori e testi dei ticket mantenendo gli `id` usati dai test (`u_giulia`, `u_marco`, `u_anna`, `s_luca`, `s_elisa`, `o_ferri`).

## Usarlo solo come portale o solo come pannello

- **Solo portale clienti:** rimuovi `src/app/admin`, `features/admin` e le voci admin; tieni i ruoli staff solo se gestisci i ticket altrove.
- **Solo pannello interno:** rimuovi `src/app/portale` e i ruoli cliente dalla matrice.
