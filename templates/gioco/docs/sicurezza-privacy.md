# Norme, gioco responsabile, sicurezza e privacy — Arena

> Indicazioni tecniche e organizzative, non consulenza legale. Il gioco con vincita in denaro è una riserva dello Stato: in Italia può essere offerto solo da concessionari ADM, nel rispetto delle convenzioni di concessione e dei regolamenti tecnici. Fai verificare tutto da un legale specializzato.

## Quadro normativo (sintesi)

| Tema                                                           | Cosa prevede il template                                                                                             |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Concessione ADM                                                | Segnaposto della concessione nel piè di pagina; nessun gioco reale in demo                                           |
| Divieto ai minori (art. 24 D.L. 98/2011)                       | Domanda all'ingresso, maggiore età verificata con codice fiscale e documento alla registrazione                      |
| Avvertenze (D.L. 158/2012, "Decreto Balduzzi")                 | Rischio di dipendenza e divieto ai minori su ogni pagina; probabilità di vincita nella pagina Regole e su ogni gioco |
| Divieto di pubblicità (art. 9 D.L. 87/2018, "Decreto Dignità") | Nessun bonus, nessuna promozione, linguaggio neutro; nessuna comunicazione commerciale                               |
| Limiti di ricarica                                             | Limite settimanale obbligatorio in registrazione; riduzioni immediate, aumenti dopo 7 giorni                         |
| Autoesclusione                                                 | Pausa e autoesclusione dal conto; in produzione comunicazione al Registro unico delle autoesclusioni                 |
| Antiriciclaggio (D.Lgs. 231/2007)                              | Identità verificata prima del prelievo; prelievi verso strumenti intestati al titolare                               |
| RTP                                                            | Calcolato esattamente e mostrato; le slot demo superano il minimo del 90%                                            |

## Gioco responsabile

- **Prevenzione:** limiti di ricarica (24 ore, 7 e 30 giorni), perdita massima in 24 ore, durata della sessione, promemoria con il saldo della sessione, nessuna giocata automatica o rapida.
- **Interruzione:** pausa di 1/7/30 giorni, autoesclusione a tempo o indeterminata, pausa di 30 minuti dopo il limite di sessione. Nessuna di queste si revoca in anticipo, nemmeno dal pannello.
- **Consapevolezza:** test di autovalutazione Lie/Bet (risposte non salvate), consigli pratici, probabilità spiegate.
- **Aiuto:** Telefono Verde Nazionale per le problematiche legate al gioco d'azzardo dell'Istituto Superiore di Sanità (800 558 822), sempre raggiungibile.
- **Intervento dell'operatore:** segnali di rischio (limiti raggiunti spesso, gioco notturno, sessioni oltre 3 ore, ricariche in forte aumento, aumenti dei limiti) e note interne. Sono indicazioni per una procedura di contatto, non diagnosi né decisioni automatiche.

## Sicurezza

### Già presente nel template

| Misura                       | Dettaglio                                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| Header di sicurezza e CSP    | `next.config.ts`: CSP senza `eval` in produzione, HSTS, `frame-ancestors 'none'`, `nosniff`   |
| Regole ricalcolate           | Ogni azione dello store ricontrolla saldo, quote, limiti e blocchi invece di fidarsi della UI |
| Schedina senza quote         | Il browser conserva solo gli identificativi degli esiti                                       |
| Estrazione senza distorsione | `secureInt` usa il generatore crittografico con campionamento a rifiuto                       |
| Validazione                  | Schemi Zod per accesso, registrazione, limiti, ricariche e prelievi                           |
| Indicizzazione               | Conto, accesso, registrazione e pannello mai indicizzati                                      |

### Da fare in produzione

- **Server autorevole** per saldo e giocate, con transazioni atomiche e registro immutabile dei movimenti.
- **Autenticazione forte** (password con hash, verifica in due passaggi), sessioni in cookie `HttpOnly`, pannello operatore con ruoli e registro degli accessi.
- **RNG e giochi certificati**, server di gioco separati e monitorati.
- **Prevenzione delle frodi:** controllo dei conti multipli, limiti di frequenza, analisi dei pattern di scommessa.

## Privacy (GDPR)

- **Dati trattati:** anagrafica, codice fiscale, documento, movimenti, giocate, sessioni, limiti ed eventi di gioco responsabile.
- **Basi giuridiche:** contratto di conto di gioco, obblighi di legge (gioco pubblico, antiriciclaggio), tutela del giocatore.
- **Minimizzazione:** il conto mostra il codice fiscale mascherato; i dati demo usano un codice comune inesistente (`Z000`) per non coincidere con persone reali.
- **Nessuna profilazione commerciale:** i dati di gioco servono solo a tutela e obblighi di legge.
- **Cookie:** solo strumenti tecnici (accesso, schedina, tema, conferma dell'età); non serve il banner.

## Accessibilità

Obiettivo **WCAG 2.2 AA**:

- avvertenze e numero di aiuto leggibili e raggiungibili da tastiera;
- pulsanti quota con nome accessibile completo e stato `aria-pressed`;
- risultato delle giocate annunciato in una regione `aria-live`;
- conferme per le azioni irreversibili (pausa, autoesclusione) in `alertdialog`;
- `prefers-reduced-motion` rispettato anche dai rulli;
- test axe automatici in tema chiaro e scuro, desktop e mobile.
