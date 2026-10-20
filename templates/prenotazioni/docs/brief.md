# Brief — Agenda

## Obiettivo

Far prenotare online un appuntamento con un professionista **in meno di un minuto**, proponendo solo orari davvero liberi, e dare allo studio un'agenda chiara con le richieste da confermare in evidenza. Il cliente deve poter spostare o cancellare da solo, entro le regole dello studio, senza telefonare.

## Pubblico

| Chi                       | Bisogno                                                                   | Come lo soddisfa il template                                                                   |
| ------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Cliente privato o azienda | Capire cosa offre lo studio e quanto costa, prenotare quando è comodo     | Servizi con durata, modalità e prezzo; calendario con i soli giorni liberi; conferma immediata |
| Cliente già prenotato     | Ricordarsi l'appuntamento, cambiarlo o disdirlo                           | File `.ics`, pagina con il codice, spostamento con lo stesso calendario, cancellazione         |
| Segreteria                | Sapere chi arriva oggi, gestire le richieste, aggiornare gli stati        | Agenda del giorno per professionista, richieste da confermare, scheda appuntamento             |
| Professionista            | Lavorare con pause e assenze rispettate                                   | Orari con più fasce, pausa dopo ogni servizio, assenze con avviso sui conflitti                |
| Titolare                  | Decidere cosa si prenota online e con quali regole; usare il proprio sito | Servizi attivabili, regole di anticipo, orizzonte e cancellazione, widget incorporabile        |

## Pagine

| Rotta                     | Contenuto                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `/`                       | Hero, giorni di ricevimento per professionista, servizi per categoria, team, FAQ, invito a gestire la prenotazione |
| `/prenota`                | Prenotazione in quattro passi con riepilogo                                                                        |
| `/prenotazione`           | Ricerca della prenotazione per codice                                                                              |
| `/prenotazione/[codice]`  | Dettaglio, calendario, spostamento, cancellazione, cronologia                                                      |
| `/widget`                 | Stessa prenotazione, compatta e senza intestazione, da incorporare in un `iframe`                                  |
| `/privacy`                | Informativa di esempio                                                                                             |
| `/gestione`               | Agenda: indicatori, richieste da confermare, giorno per giorno con filtro                                          |
| `/gestione/disponibilita` | Orario settimanale per professionista, assenze e chiusure                                                          |
| `/gestione/servizi`       | Elenco per categoria, attivazione online, creazione e modifica                                                     |
| `/gestione/impostazioni`  | Dati dello studio, regole di prenotazione, codice del widget, dati demo                                            |

## Flussi principali

### Prenotazione

1. **Servizio:** scelte raggruppate per categoria (durata, modalità, prezzo; "Su conferma dello studio" se richiede approvazione).
2. **Professionista e modalità:** se il servizio ha un solo professionista o una sola modalità, la scelta è già fatta. Con più professionisti si propone "Primo disponibile" (se consentito).
3. **Giorno e orario:** il primo giorno libero è già selezionato; gli orari sono un gruppo di scelte a pulsanti grandi.
4. **Dati:** nome, email, telefono, note facoltative; consenso privacy obbligatorio e consenso marketing separato e facoltativo; regole di cancellazione scritte prima dell'invio.
5. **Conferma:** codice, riepilogo, "Aggiungi al calendario", "Gestisci la prenotazione". Se nel frattempo l'orario è stato preso, il cliente torna al calendario con un messaggio.

### Richiesta su approvazione

Servizi come la prima consulenza gratuita partono **da confermare**. Lo studio li vede in cima all'agenda e li conferma con un clic o li rifiuta dalla scheda; l'orario resta bloccato finché la richiesta è aperta.

### Spostamento e cancellazione

Dal codice il cliente sposta l'appuntamento con lo stesso calendario (escludendo se stesso dai conflitti) o lo cancella con una conferma. Entro il limite impostato (24 ore in demo) i pulsanti spariscono e compare il numero dello studio.

## Regole di disponibilità

Un orario è proposto se:

1. il professionista lavora quel giorno e l'orario cade in una delle sue fasce (le pause sono gli spazi tra le fasce);
2. non c'è un'assenza personale né una chiusura dello studio;
3. l'appuntamento, **più la pausa dopo del servizio**, non si sovrappone ad appuntamenti attivi (confermati o da confermare) **più la loro pausa**;
4. inizia almeno _anticipo minimo_ ore dopo adesso (12 in demo) e non oltre l'_orizzonte_ (45 giorni);
5. è allineato al passo scelto (ogni 15, 30 o 60 minuti) e finisce entro la fascia.

"Primo disponibile" assegna l'appuntamento al professionista con meno appuntamenti in quel giorno, a parità nell'ordine indicato dal servizio.

## Stati dell'appuntamento

| Stato          | Significato                               | Occupa l'agenda | Il cliente può modificarlo |
| -------------- | ----------------------------------------- | --------------- | -------------------------- |
| Da confermare  | Richiesta inviata, in attesa dello studio | Sì              | Sì, entro il limite        |
| Confermato     | Appuntamento fissato                      | Sì              | Sì, entro il limite        |
| Concluso       | Svolto                                    | —               | No                         |
| Non presentato | Il cliente non si è presentato            | —               | No                         |
| Cancellato     | Disdetto dal cliente o dallo studio       | No              | No                         |

## Fuori dallo scopo della demo

Invio reale di email e SMS, autenticazione dello staff, pagamenti e caparre, sincronizzazione con calendari esterni, link alle videochiamate: indicati in [architettura.md](architettura.md#collegare-un-backend).
