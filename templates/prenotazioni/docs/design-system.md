# Design system — Agenda

Stessa base di tutti i template della libreria (token in `src/app/globals.css`, componenti in `src/components/ui/`). Qui solo ciò che è specifico di Agenda.

## Carattere

Sobrio, affidabile, da studio professionale: superfici chiare e calde, un solo colore d'accento **petrolio** che comunica competenza e calma, nessuna immagine obbligatoria. L'attenzione va al calendario e agli orari, che sono l'azione principale.

## Colore

Un solo accento. Gli stati usano la palette comune (successo, avviso, errore, informazione) sempre accompagnata da icona e testo.

| Token              | Chiaro    | Scuro     | Uso                                                    |
| ------------------ | --------- | --------- | ------------------------------------------------------ |
| `--canvas`         | `#f7f7f4` | `#0c0e0f` | Sfondo della pagina                                    |
| `--surface`        | `#ffffff` | `#141718` | Card, pannelli, modali                                 |
| `--accent`         | `#0f6674` | `#137080` | Pulsante principale, giorno selezionato, orario scelto |
| `--accent-text`    | `#0e5f6c` | `#6fc6d4` | Link e testo in accento                                |
| `--accent-soft`    | `#e4f1f3` | `#132a2e` | Giorni disponibili nel calendario, voce di menu attiva |
| `--accent-soft-fg` | `#0b4e59` | `#93d6e1` | Testo sui giorni disponibili                           |
| `--fg-muted`       | `#5c5e60` | `#a3a7a9` | Testo secondario                                       |
| `--line-strong`    | `#878a8c` | `#686c6e` | Bordi dei campi                                        |

### Contrasti verificati (WCAG 2.2)

| Coppia                       | Chiaro | Scuro  | Minimo |
| ---------------------------- | ------ | ------ | ------ |
| Testo bianco su accento      | 6,62:1 | 5,74:1 | 4,5:1  |
| Testo in accento su sfondo   | 6,81:1 | 9,86:1 | 4,5:1  |
| Testo dei giorni disponibili | 8,08:1 | 9,26:1 | 4,5:1  |
| Testo secondario su card     | 6,51:1 | 7,43:1 | 4,5:1  |
| Testo attenuato su card      | 5,06:1 | 5,74:1 | 4,5:1  |
| Bordo dei campi su card      | 3,47:1 | 3,40:1 | 3:1    |

axe-core verifica i contrasti reali su ogni pagina in entrambi i temi.

## Tipografia

**Inter** per tutto (titoli con `tracking-tight`), cifre tabellari per orari, prezzi e conteggi. Il codice di prenotazione usa il carattere monospazio con spaziatura ampia per essere dettato al telefono senza errori.

## Componenti specifici

| Componente               | File                                   | Note                                                                                                                                                         |
| ------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Calendario degli orari   | `features/site/slot-picker.tsx`        | Mese da lunedì; giorni come pulsanti con `aria-pressed` e nome completo ("Giovedì 22 ottobre, disponibile"); orari come `radiogroup` con pulsanti alti 44 px |
| Passi della prenotazione | `features/site/booking-wizard.tsx`     | Elenco ordinato con `aria-current="step"`; al cambio di passo il focus va al titolo                                                                          |
| Scelta a scheda          | `ChoiceCard` nello stesso file         | `input type="radio"` reale dentro un'etichetta grande: tastiera e lettori di schermo funzionano senza ARIA aggiuntivo                                        |
| Riepilogo                | `Summary` nello stesso file            | Laterale e fisso su desktop, sotto i passi su mobile                                                                                                         |
| Stato dell'appuntamento  | `components/status-badge.tsx`          | Icona + testo + colore per ognuno dei cinque stati                                                                                                           |
| Editor degli orari       | `features/panel/availability-view.tsx` | Più fasce per giorno, rimozione con nome completo della fascia, errore annunciato con `role="alert"`                                                         |

## Stati e feedback

- **Caricamento:** scheletri con `aria-busy`; nessun salto di layout.
- **Vuoto:** messaggio con suggerimento ("Nessun orario libero in questo giorno", "Nessuna richiesta da confermare").
- **Errore:** sotto il campo, collegato con `aria-describedby`; nell'editor degli orari un messaggio unico con `role="alert"`.
- **Conferma:** notifiche brevi annunciate da una regione `aria-live`; azioni distruttive con `alertdialog`.
- **Non disponibile:** giorni passati o pieni restano visibili ma disattivati; il pulsante "Continua" è disattivato finché il passo non è completo e il motivo è evidente dal contenuto.

## Movimento

Solo transizioni brevi (comparsa della pagina, apertura di dialoghi e notifiche, 150–200 ms). Con `prefers-reduced-motion` le animazioni si azzerano (verificato nei test).
