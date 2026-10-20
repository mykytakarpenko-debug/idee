# Brief — Tavola

## Obiettivo

Dare a un ristorante indipendente un sito che **porta prenotazioni e ordini diretti** (senza commissioni dei marketplace) e un pannello semplice per **gestire sala e cucina** durante il servizio. Il cliente fa tutto da smartphone in meno di un minuto; lo staff lavora su tablet o PC con pochi tocchi.

## Pubblico

| Profilo                         | Contesto                        | Bisogni principali                                                                |
| ------------------------------- | ------------------------------- | --------------------------------------------------------------------------------- |
| Cliente che sceglie dove andare | Smartphone, spesso in movimento | Capire subito se è aperto, vedere menu e prezzi, prenotare senza telefonare       |
| Cliente con allergie o diete    | Smartphone o desktop            | Informazioni chiare sugli allergeni, filtri affidabili                            |
| Cliente che ordina a casa       | Smartphone, la sera             | Ordine minimo e costi chiari, orario di consegna, sapere a che punto è l'ordine   |
| Titolare / responsabile di sala | Tablet al banco, PC in ufficio  | Arrivi del servizio, tavoli liberi, conferme, coperti                             |
| Cucina                          | Schermo o tablet in cucina      | Ordini da preparare in ordine di urgenza, ritardi evidenti, un tocco per avanzare |

## Pagine

### Sito pubblico

| Pagina   | Rotta              | Contenuto                                                                             |
| -------- | ------------------ | ------------------------------------------------------------------------------------- |
| Home     | `/`                | Stato di apertura, orari, valori del locale, piatti in evidenza, consegna, dove siamo |
| Menu     | `/menu`            | Menu completo per categorie, filtri dieta/allergeni, avviso allergeni                 |
| Prenota  | `/prenota`         | Persone → giorno → orario → dati → conferma con codice e `.ics`                       |
| Ordina   | `/ordina`          | Menu ordinabile con carrello (pannello laterale su desktop, barra e modale su mobile) |
| Checkout | `/ordina/checkout` | Modalità, orario, indirizzo (solo consegna), contatti, pagamento, consensi, riepilogo |
| Tracking | `/ordine/[numero]` | Stato dell'ordine passo per passo, riepilogo, aggiornamento automatico                |
| Privacy  | `/privacy`         | Modello di informativa da completare                                                  |

### Pannello di gestione (`/gestione`)

| Pagina       | Rotta                    | Domanda a cui risponde                                         |
| ------------ | ------------------------ | -------------------------------------------------------------- |
| Oggi         | `/gestione`              | Quanti coperti abbiamo, chi arriva adesso, cosa c'è in cucina? |
| Prenotazioni | `/gestione/prenotazioni` | Chi viene in questo giorno, a che tavolo, cosa va confermato?  |
| Sala         | `/gestione/sala`         | Quali tavoli sono liberi, prenotati o occupati a quest'ora?    |
| Ordini       | `/gestione/ordini`       | Cosa devo preparare, cosa è in ritardo, cosa va consegnato?    |
| Menu         | `/gestione/menu`         | Cosa è finito oggi? Come aggiungo o modifico un piatto?        |
| Impostazioni | `/gestione/impostazioni` | Orari, regole di prenotazione, consegna, dati del locale       |

## Flussi principali

### 1. Prenotazione

1. Il cliente sceglie il numero di persone (1–8 online; oltre, invito a telefonare).
2. Sceglie "Oggi", "Domani" o una data fino a 60 giorni.
3. Vede gli orari divisi per pranzo e cena: quelli senza tavoli liberi sono barrati e non selezionabili.
4. Inserisce nome, telefono, email, eventuali richieste; accetta l'informativa (obbligatoria) e, separatamente, le comunicazioni promozionali (facoltative).
5. Riceve il codice di prenotazione e può aggiungere l'evento al calendario.
6. Nel pannello la prenotazione compare già assegnata al tavolo più piccolo adatto.

### 2. Ordine online e tracking

1. Il cliente aggiunge piatti (i piatti esauriti o "solo in sala" non sono ordinabili).
2. Sceglie consegna o asporto: il carrello mostra costi, quanto manca all'ordine minimo e alla consegna gratuita.
3. Nel checkout sceglie "prima possibile" o un orario (ogni 15 minuti, dopo i tempi di preparazione e consegna), inserisce l'indirizzo (verifica immediata del CAP) e i contatti.
4. Invia l'ordine e arriva alla pagina di tracking.
5. In cucina l'ordine compare tra i **Nuovi** con l'orario entro cui avviare la preparazione; ogni avanzamento aggiorna il tracking del cliente.

### 3. Servizio in sala

1. Dalla pagina **Oggi** lo staff vede i prossimi arrivi e li fa accomodare con un tocco.
2. Nella **Sala** sceglie la zona e l'orario; un tavolo libero può accogliere clienti senza prenotazione, uno occupato può essere liberato.
3. Le prenotazioni possono essere spostate di tavolo solo verso tavoli liberi e abbastanza grandi.

## Regole di business

| Regola                       | Valore demo                                                     | Dove si cambia                    |
| ---------------------------- | --------------------------------------------------------------- | --------------------------------- |
| Servizi                      | Pranzo 12:30–14:30/15:00, cena 19:00–23:00/23:30; lunedì chiuso | Impostazioni → Servizi            |
| Intervallo orari prenotabili | 30 minuti                                                       | Impostazioni → Prenotazioni       |
| Durata media del tavolo      | 105 minuti                                                      | Impostazioni → Prenotazioni       |
| Anticipo minimo              | 60 minuti                                                       | Impostazioni → Prenotazioni       |
| Ultimo arrivo                | 60 minuti prima della chiusura                                  | Impostazioni → Prenotazioni       |
| Gruppo massimo online        | 8 persone                                                       | Impostazioni → Prenotazioni       |
| Ordine minimo consegna       | 20 €                                                            | Impostazioni → Asporto e consegna |
| Costo consegna / gratuita da | 3 € / 40 €                                                      | Impostazioni → Asporto e consegna |
| Tempi                        | Preparazione 25', consegna 20'                                  | Impostazioni → Asporto e consegna |
| Zone servite                 | CAP 40121–40127                                                 | Impostazioni → Asporto e consegna |
| Assegnazione tavoli          | Il più piccolo che basta; un gruppo per tavolo                  | `lib/domain/booking.ts`           |

## Stati

| Prenotazione   | Significato                            | Ordine          | Significato                                   |
| -------------- | -------------------------------------- | --------------- | --------------------------------------------- |
| Da confermare  | Richiesta da verificare (es. telefono) | Ricevuto        | In attesa che la cucina lo prenda in carico   |
| Confermata     | Tavolo riservato                       | In preparazione | La cucina ci sta lavorando                    |
| Al tavolo      | Clienti seduti                         | Pronto          | Pronto per il ritiro o per il rider           |
| Conclusa       | Tavolo liberato                        | In consegna     | Solo per la consegna a domicilio              |
| Non presentato | No-show                                | Completato      | Consegnato o ritirato                         |
| Annullata      | Tavolo di nuovo disponibile            | Annullato       | Con conferma; il cliente lo vede nel tracking |

## Criteri di successo

- Prenotazione completabile da smartphone in **meno di 60 secondi** e senza errori di disponibilità.
- Nessuna informazione su prezzi, costi di consegna e allergeni nascosta fino all'ultimo passaggio.
- In cucina, l'ordine più urgente è sempre il primo della colonna e i ritardi sono evidenti senza leggere.
- Tutte le pagine superano i controlli automatici WCAG 2.2 AA in tema chiaro e scuro.

## Note legali sintetiche

Allergeni (Reg. UE 1169/2011), vendita a distanza di alimenti (esclusione del recesso, art. 59 Codice del Consumo), consensi separati (GDPR) e accessibilità dei servizi di prenotazione (European Accessibility Act) sono descritti in [sicurezza-privacy.md](sicurezza-privacy.md).
