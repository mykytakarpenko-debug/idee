# Sicurezza, privacy e accessibilità — Portale

> Indicazioni tecniche e organizzative, non consulenza legale. Fai verificare informativa, contratti e processi da un legale prima della pubblicazione.

## Cosa è dimostrativo

In demo **non c'è un server**: password non verificate, codice di verifica fisso e mostrato a schermo, dati e sessione nel `localStorage`. I controlli nel browser mostrano il comportamento atteso ma **non proteggono nulla**. Non usare il template con dati reali prima di aver collegato autenticazione e API (vedi [architettura.md](architettura.md#collegare-un-backend)).

## Già presente nel template

| Misura                    | Dettaglio                                                                                                                                                      |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header di sicurezza e CSP | `next.config.ts`: CSP senza `eval` in produzione, HSTS, `frame-ancestors 'none'` e `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` |
| Nessuna indicizzazione    | `robots.txt` blocca tutto, `noindex, nofollow` su ogni pagina                                                                                                  |
| Accesso in due passaggi   | Codice a 6 cifre confrontato a tempo costante; 5 errori → blocco di 15 minuti; errori registrati                                                               |
| Messaggi non rivelatori   | Email sconosciute e account solo invitati ricevono lo stesso messaggio                                                                                         |
| Sessione                  | Chiusura dopo l'inattività impostata, uscita propagata a tutte le schede, utenti disattivati e aziende sospese escluse                                         |
| Permessi a più livelli    | Area, menu, pagina e azione (vedi [architettura.md](architettura.md#controlli-a-più-livelli))                                                                  |
| Isolamento per azienda    | Il cliente vede solo dati della propria azienda; un ticket di altri risulta "non trovato"                                                                      |
| Note interne              | Filtrate per permesso (`visibleMessages`), mai inviate al cliente                                                                                              |
| Nessuna auto-modifica     | Nessuno cambia il proprio ruolo o si disattiva; resta sempre un amministratore per azienda                                                                     |
| Validazione               | Schemi Zod per tutti i moduli; nomi dei file senza caratteri di percorso                                                                                       |
| Esportazioni              | CSV con neutralizzazione delle formule (CSV injection)                                                                                                         |

## Da fare in produzione

- **Autenticazione:** provider affidabile; password con hash (Argon2id o bcrypt) o, meglio, passkey; TOTP (RFC 6238) o WebAuthn verificati sul server; codici di recupero; limiti di frequenza per IP e per account.
- **Sessioni:** cookie `HttpOnly`, `Secure`, `SameSite=Lax`, rotazione dopo l'accesso, scadenza assoluta oltre a quella per inattività, revoca alla disattivazione dell'utente o dell'azienda.
- **Autorizzazione sul server** a ogni richiesta, con filtro per azienda (Row Level Security dove possibile). Test automatici che provano ad accedere ai dati di un'altra azienda.
- **Documenti:** storage privato, upload firmato con limiti di tipo e dimensione, antivirus, link di download firmati e brevi; mai URL pubblici.
- **Registro attività** scritto dal server, in sola aggiunta, con IP anonimizzato e cancellazione automatica oltre la conservazione.
- **SSO** (SAML/OIDC) per i clienti Enterprise e provisioning SCIM, se richiesti.
- **CSP con nonce** per eliminare `'unsafe-inline'` dagli script (rende le pagine dinamiche).
- **Backup, monitoraggio e gestione degli incidenti** (notifica al Garante entro 72 ore per le violazioni di dati personali, art. 33 GDPR).

## Privacy (GDPR)

- **Ruoli:** per i dati degli utenti del portale il fornitore è titolare; per i contenuti che i clienti caricano (documenti, ticket) è di norma **responsabile del trattamento** (art. 28): serve un accordo di nomina, citato nell'informativa di esempio.
- **Minimizzazione:** l'invito chiede solo nome, email e ruolo; il registro conserva l'IP senza l'ultimo ottetto.
- **Conservazione:** registro configurabile (365 giorni in demo); account fino alla fine del contratto; fatture 10 anni.
- **Diritti:** accesso, rettifica, cancellazione e portabilità tramite il supporto; il registro aiuta a rispondere alle richieste di accesso.
- **Cookie:** solo strumenti tecnici (sessione, tema), quindi nessun banner. Se aggiungi analisi o chat di terze parti, serve un banner conforme alle linee guida del Garante (giugno 2021).
- **Trasferimenti extra UE:** scegli fornitori con hosting nell'UE o garanzie adeguate (Data Privacy Framework, clausole contrattuali tipo).

## Accessibilità

Obiettivo **WCAG 2.2 AA** (richiesto dall'European Accessibility Act per molti servizi digitali dal 28 giugno 2025):

- navigazione completa da tastiera, link "Vai al contenuto principale", focus visibile;
- modali, menu e interruttori Radix con gestione del focus;
- tabelle con intestazioni, tabelle scorrevoli raggiungibili da tastiera, matrice dei permessi con "Consentito"/"Non consentito" per i lettori di schermo;
- stati con icona e testo, contrasti verificati in entrambi i temi;
- errori dei moduli collegati ai campi e annunciati, focus sul primo campo con errore;
- `prefers-reduced-motion` rispettato;
- test axe automatici su tutte le pagine, modali e schede, in tema chiaro e scuro, desktop e mobile.

Prima della pubblicazione fai anche una verifica manuale con lettore di schermo (NVDA o VoiceOver) e pubblica la dichiarazione di accessibilità se richiesta.
