# Sicurezza, privacy e accessibilità — Vetrina

> Indicazioni tecniche e organizzative, non consulenza legale. Fai verificare testi e processi da un legale prima della pubblicazione.

## Cookie (Linee guida del Garante, 10 giugno 2021)

| Requisito                                    | Nel template                                                                                              |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Nessun cookie non tecnico prima del consenso | Nessuno strumento di terze parti incluso; attributi `data-consent-*` = `denied` finché non c'è una scelta |
| Chiudere il banner equivale a rifiutare      | La X salva il rifiuto                                                                                     |
| Rifiuto facile quanto l'accettazione         | "Rifiuta" e "Accetta tutti" con lo stesso stile e la stessa dimensione                                    |
| Scelte granulari                             | Preferenze per Statistiche e Marketing; Necessari sempre attivi                                           |
| Nessun "cookie wall"                         | Il banner non blocca la navigazione                                                                       |
| Scelta modificabile in ogni momento          | "Preferenze cookie" nel piè di pagina e nella cookie policy                                               |
| Nuova richiesta non prima di 6 mesi          | Scadenza a 180 giorni; nuova richiesta anche se cambia la versione                                        |
| Prova del consenso                           | Scelta salvata con data e versione                                                                        |

## Privacy (GDPR)

- **Modulo contatti:** solo i dati utili a rispondere; base giuridica precontrattuale, quindi nessuna casella di consenso obbligatoria; informativa linkata accanto al pulsante.
- **Newsletter:** consenso separato, facoltativo, non preselezionato; in produzione double opt-in e disiscrizione in ogni email.
- **Log:** il route handler non registra dati personali.
- **Fornitori:** hosting, email e CRM come responsabili del trattamento (art. 28), preferibilmente con dati nell'UE.
- **Prodotto SaaS:** per i dati dei clienti il fornitore è responsabile del trattamento; l'accordo va allegato ai termini.

## Comunicazione commerciale

- Numeri, recensioni e testimonianze devono essere **veri e verificabili** (Codice del Consumo, pratiche commerciali scorrette; Direttiva Omnibus sulle recensioni).
- Prezzi verso i consumatori **IVA inclusa**; verso le imprese si può indicare IVA esclusa, come nel template.
- Rinnovi automatici e condizioni di disdetta chiari prima dell'acquisto.

## Sicurezza

### Già presente

| Misura                    | Dettaglio                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| Header di sicurezza e CSP | `next.config.ts`: CSP senza `eval` in produzione, HSTS, `frame-ancestors 'none'`, `nosniff` |
| Validazione lato server   | Stesso schema Zod nel browser e nel route handler                                           |
| Antispam                  | Campo trappola, tempo minimo di compilazione, limite di frequenza per IP                    |
| JSON-LD sicuro            | Contenuti nostri, serializzati con `<` neutralizzato                                        |
| Niente segreti nel client | Solo variabili `NEXT_PUBLIC_*` non sensibili; chiavi delle integrazioni solo sul server     |

### Da fare in produzione

- Limite di frequenza su archivio condiviso o regole del firewall (Vercel WAF).
- CAPTCHA rispettoso della privacy (es. Friendly Captcha, Turnstile) solo se lo spam supera i filtri attuali.
- Monitoraggio degli errori senza dati personali.

## Accessibilità

Obiettivo **WCAG 2.2 AA** (richiesto dall'European Accessibility Act per molti servizi digitali):

- struttura con titoli ordinati, link "Vai al contenuto principale", navigazioni etichettate;
- contrasti verificati per tutti gli accenti, in entrambi i temi;
- banner dei cookie raggiungibile da tastiera e senza trappole di focus; preferenze in una modale accessibile;
- modulo con etichette, errori collegati ai campi, focus sul primo errore; campo trappola nascosto anche alle tecnologie assistive;
- tabella dei piani con intestazioni di riga e valori testuali; FAQ con `<details>` nativi;
- test axe automatici su tutte le pagine, sul banner, sulle preferenze e sul modulo con errori, desktop e mobile, chiaro e scuro.
