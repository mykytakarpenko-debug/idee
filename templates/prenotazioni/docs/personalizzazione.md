# Personalizzazione — Agenda

## 1. Dati dello studio

| Cosa                                                             | Dove                                                                 |
| ---------------------------------------------------------------- | -------------------------------------------------------------------- |
| Nome, frase, indirizzo, contatti, P. IVA                         | `DEMO_SETTINGS` in `src/lib/demo/seed.ts` (e dal pannello)           |
| Nome e descrizione per SEO e manifest                            | `src/config/brand.ts`                                                |
| Tipo `schema.org` (es. `Dentist`, `LegalService`, `BeautySalon`) | `src/lib/seo.ts`                                                     |
| Logo                                                             | `src/components/site/logo.tsx`, `src/app/icon.svg`, `apple-icon.png` |
| Testi dell'interfaccia                                           | `src/content/it.ts` (tutte le stringhe in un unico file)             |
| Informativa privacy                                              | `src/app/(sito)/privacy/page.tsx`                                    |

## 2. Servizi e professionisti

In `src/lib/demo/seed.ts`:

- `CATEGORIES`: gruppi mostrati nella home e nella prenotazione.
- `STAFF`: nome, ruolo e iniziali (avatar senza foto, nessun dato biometrico).
- `SERVICES`: per ognuno `durationMin`, `bufferMin` (pausa dopo), `price` in centesimi o `null` se gratuito, `modes` (`in_person`, `online`), `staffIds`, `requiresApproval`.

Dal pannello (_Servizi_) si creano e modificano i servizi e si attiva o disattiva la prenotazione online.

## 3. Orari e regole

- **Orari settimanali:** `HOURS` nel seed o _Disponibilità_ nel pannello. Più fasce nello stesso giorno = pausa.
- **Assenze e chiusure:** _Disponibilità → Assenze e chiusure_ ("Tutto lo studio" per ponti e festività).
- **Regole** (`DEMO_SETTINGS.booking` o _Impostazioni_):

| Regola                  | Demo  | Consiglio                                                           |
| ----------------------- | ----- | ------------------------------------------------------------------- |
| Passo degli orari       | 30'   | 15' per servizi brevi (es. parrucchiere), 60' per consulenze lunghe |
| Anticipo minimo         | 12 h  | 0–2 h per saloni, 24 h per studi con preparazione delle pratiche    |
| Orizzonte               | 45 gg | 90 gg per visite periodiche                                         |
| Modifiche online fino a | 24 h  | Allinealo alle condizioni di cancellazione comunicate               |
| Primo disponibile       | Sì    | No se il cliente deve sempre scegliere la persona (es. terapeuta)   |

## 4. Colori e tipografia

In `src/app/globals.css` cambia i token `--accent*` per tema chiaro e scuro, mantenendo i contrasti indicati in [design-system.md](design-system.md). Esempi:

| Settore                 | Accento suggerito      |
| ----------------------- | ---------------------- |
| Studio medico, dentista | Blu `#1f5fa8`          |
| Benessere, estetica     | Prugna `#7a3e6a`       |
| Legale, consulenza      | Petrolio (predefinito) |
| Veterinario             | Verde `#2f6b3f`        |

Verifica sempre il contrasto del testo bianco sul nuovo accento (minimo 4,5:1) e lancia `npm run test:e2e`: i test axe controllano entrambe le modalità.

## 5. Adattamenti per settore

| Settore                           | Cosa cambiare                                                                                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Studio medico o dentista**      | Servizi come visite e controlli; tipo `Dentist`/`MedicalClinic`; **nessun dato sanitario nelle note** (vedi sicurezza-privacy); prima visita su approvazione |
| **Salone, barbiere, estetica**    | Passo 15', anticipo 1 h, durate brevi con pausa per la pulizia; "primo disponibile" attivo; campo note per preferenze                                        |
| **Fisioterapia, psicologia**      | Professionista sempre scelto dal cliente; colloqui online; limite di cancellazione 48 h; informativa specifica                                               |
| **Consulenze e agenzie**          | Prima chiamata gratuita su approvazione, servizi a pagamento dopo il preventivo; widget nel sito aziendale                                                   |
| **Autoscuole, corsi individuali** | Professionisti = istruttori; servizi = tipi di lezione; orizzonte breve                                                                                      |

## 6. Testi e lingua

Tutti i testi sono in `src/content/it.ts`, raggruppati per area (`booking`, `manage`, `agenda`, `availability`…). Per un'altra lingua duplica il file, traduci e cambia `LOCALE` in `src/lib/format.ts` (date e valute).

## 7. Dopo le modifiche

```bash
npm run check      # formattazione, lint, tipi, test unitari, build
npm run test:e2e   # flussi e accessibilità (dopo la build)
```

Se cambi servizi o orari del seed, aggiorna i test che li nominano (`tests/unit/availability.test.ts`, `tests/e2e/*`).
