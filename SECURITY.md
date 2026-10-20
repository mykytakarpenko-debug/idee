# Sicurezza

## Segnalare una vulnerabilità

Non aprire una issue pubblica. Usa la funzione **Security → Report a vulnerability** di GitHub (segnalazione privata) indicando:

- template e versione coinvolti;
- passi per riprodurre il problema e impatto stimato;
- eventuale proposta di correzione.

Riceverai una prima risposta entro 5 giorni lavorativi. Le correzioni vengono rilasciate il prima possibile e annunciate nelle note di rilascio.

## Buone pratiche per chi usa i template

- Non inserire mai chiavi, password o dati reali nel repository: usa le variabili d'ambiente di Vercel.
- Mantieni aggiornate le dipendenze (Dependabot è attivo su ogni template).
- Prima della produzione completa la checklist di sicurezza del template, ad esempio [`templates/gestionale/docs/sicurezza-privacy.md`](templates/gestionale/docs/sicurezza-privacy.md).
