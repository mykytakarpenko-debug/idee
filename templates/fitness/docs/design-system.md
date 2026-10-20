# Design system — Forma

Forma usa la base comune della libreria: token CSS, componenti, regole di stato e movimento. Questo documento descrive **cosa cambia per il fitness**. Per i componenti condivisi vedi il [design system di Nucleo](../../gestionale/docs/design-system.md#componenti).

Tutti i valori sono token in [`src/app/globals.css`](../src/app/globals.css), mappati sulle utility Tailwind.

## Principi

1. **Energia con misura.** Titoli in Archivo extra-bold e leggermente espansi, molto spazio e un solo accento verde salvia. Niente gradienti e niente foto obbligatorie.
2. **Disponibilità sempre visibile.** Posti liberi, lista d'attesa e stato dell'abbonamento compaiono dove si prende una decisione.
3. **Dire perché.** Quando un'azione non è possibile, al posto del pulsante c'è il motivo in chiaro (es. "Certificato medico da rinnovare").
4. **Stato = colore + icona + testo.** Vale per abbonamento, certificato, prenotazione, pagamento, prova e check-in.
5. **Identità ≠ stato.** I colori delle categorie di corso sono colori di identità (con nome sempre accanto) e non si confondono con i colori di stato.

## Colori

### Superfici e testo

| Token         | Chiaro    | Scuro     | Uso                           |
| ------------- | --------- | --------- | ----------------------------- |
| `canvas`      | `#F6F7F3` | `#0D0F0E` | Sfondo pagina (bianco salvia) |
| `surface`     | `#FFFFFF` | `#151816` | Card, modali                  |
| `surface-2`   | `#EEF0EA` | `#1D211F` | Hover, segmenti, riempimenti  |
| `surface-3`   | `#E4E7DF` | `#262B28` | Avatar, stato premuto         |
| `line`        | `#E3E6DE` | `#272C29` | Bordi decorativi              |
| `line-strong` | `#8A8E88` | `#676C66` | Bordi dei controlli (≥ 3:1)   |
| `fg`          | `#191C1A` | `#F1F3F0` | Testo principale              |
| `fg-muted`    | `#5A5E59` | `#A2A7A1` | Testo secondario              |
| `fg-subtle`   | `#6B6F6A` | `#8D928C` | Segnaposto, metadati          |

### Accento e stati

| Token                 | Chiaro                | Scuro                 | Note                                       |
| --------------------- | --------------------- | --------------------- | ------------------------------------------ |
| `accent`              | `#2F7D5B`             | `#2F7A57`             | Verde salvia: azioni, selezione, posti     |
| `accent-text`         | `#2A6B4E`             | `#7FCAA2`             | Link, sovratitoli                          |
| `accent-soft` / `-fg` | `#E8F2EC` / `#1F5A3F` | `#16281F` / `#9FDCBB` | Voce attiva, piano in evidenza, prenotata  |
| `success`             | `#17713E`             | `#5BC98A`             | Attivo, presente, pagato, consentito       |
| `warning`             | `#94500A`             | `#EBAA4E`             | In scadenza, lista d'attesa, lezione piena |
| `danger`              | `#BB3127`             | `#FF8A80`             | Scaduto, certificato non valido, negato    |
| `info`                | `#0A6580`             | `#5CC2DF`             | Note informative, richiesta contattata     |

L'accento e `success` sono entrambi verdi, ma l'accento indica **azioni e selezione** (pulsanti, voce attiva) mentre `success` compare solo nei badge di stato, sempre con icona e testo.

### Contrasti verificati (WCAG 2.2 AA)

| Coppia                            | Chiaro | Scuro  |
| --------------------------------- | ------ | ------ |
| `fg` su `surface`                 | 17,2:1 | 16,0:1 |
| `fg-muted` su `surface`           | 6,6:1  | 7,3:1  |
| `fg-subtle` su `canvas`           | 4,8:1  | 6,1:1  |
| Testo bianco su `accent`          | 5,0:1  | 5,2:1  |
| `accent-text` su `canvas`         | 5,9:1  | 10,0:1 |
| `accent-soft-fg` su `accent-soft` | 7,1:1  | 9,9:1  |
| `line-strong` (bordi controlli)   | 3,1:1  | 3,3:1  |

### Categorie dei corsi

Le quattro categorie usano i primi quattro colori della palette categoriale condivisa, in ordine fisso:

| Ordine | Categoria     | Token        |
| ------ | ------------- | ------------ |
| 1      | Forza         | `--series-1` |
| 2      | Cardio        | `--series-2` |
| 3      | Mente e corpo | `--series-3` |
| 4      | Ritmo e danza | `--series-4` |

Il colore compare come pallino o bordo sinistro della scheda, **sempre con il nome della categoria**. Aggiungendo una quinta categoria si usa `--series-5`: non si generano nuovi colori.

## Tipografia

| Ruolo       | Font                                 | Uso                                                                |
| ----------- | ------------------------------------ | ------------------------------------------------------------------ |
| Display     | **Archivo** (variabile, asse `wdth`) | Titoli del sito (800, larghezza 110%), orari delle lezioni, prezzi |
| Interfaccia | **Inter** (variabile)                | Testo, moduli, area socio e pannello                               |

- Orari, posti e prezzi con `tabular-nums`.
- Codice socio in carattere monospaziato con spaziatura ampia, leggibile anche da lontano in reception.

## Componenti specifici

| Componente           | File                                | Note                                                                                     |
| -------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------- |
| `CategoryLabel`      | `components/course-badges.tsx`      | Pallino di categoria + nome                                                              |
| `IntensityMeter`     | `components/course-badges.tsx`      | Tre barre crescenti + testo ("Intensità alta")                                           |
| Badge di stato       | `components/status-badges.tsx`      | Abbonamento, certificato, prenotazione, pagamento, prova                                 |
| Selettore del giorno | `features/member/book-view.tsx`     | `radiogroup` con giorno della settimana e numero, nome completo per i lettori di schermo |
| Riga lezione         | `features/member/book-view.tsx`     | Orario, corso, categoria, intensità, posti, azione o motivo                              |
| Esito check-in       | `features/panel/checkin-view.tsx`   | Icona grande, titolo colorato, motivi e avvisi elencati, `aria-live`                     |
| Riempimento lezione  | `features/panel/dashboard-view.tsx` | Barra `role="meter"` che diventa `warning` quando la lezione è piena                     |
| Presenze             | `features/panel/session-dialog.tsx` | Pulsanti "Presente" / "Assente" con `aria-pressed`                                       |

## Stati e feedback

| Situazione               | Pattern                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------- |
| Non prenotabile          | Testo del motivo al posto del pulsante (nessun pulsante disabilitato senza spiegazione) |
| Lezione piena            | "Al completo" in `warning` e pulsante "Lista d'attesa (n)"                              |
| Cancellazione tardiva    | `alertdialog` che spiega la conseguenza prima di confermare                             |
| Certificato in scadenza  | Avviso `role="status"` nella panoramica del socio; `role="alert"` se scaduto            |
| Disdetta                 | Conferma che ricorda fino a quando resta valido l'abbonamento                           |
| Area socio senza accesso | Rimando automatico alla pagina di accesso                                               |

## Movimento

Token comuni della libreria (120–260 ms, `--ease-out`). Con `prefers-reduced-motion: reduce` tutte le durate scendono a 0,01 ms (verificato da un test e2e).

## Grafici

**Ingressi negli ultimi 14 giorni:** istogramma a una serie con barre ≤ 24 px, estremità arrotondate di 4 px, tooltip al passaggio e al focus e frecce ← →. Le altre misure (occupazione, scadenze) sono numeri nelle card KPI, non grafici.
