import { expect, test } from "@playwright/test";
import { login, openPage, prepare, slip, toastText } from "./helpers";

test.describe("conto", () => {
  test.beforeEach(async ({ page }) => {
    await prepare(page);
    await login(page);
  });

  test("mostra saldo, movimenti e scommesse; esce", async ({ page }) => {
    await expect(page.getByText("Identità verificata")).toBeVisible();
    await expect(page.getByRole("table")).toContainText("Scommessa");
    await page.getByRole("tab", { name: "Scommesse" }).click();
    await expect(page.getByText("In corso").first()).toBeVisible();
    await page.getByRole("button", { name: "Esci" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole("link", { name: "Accedi" }).filter({ visible: true }).first(),
    ).toBeVisible();
  });

  test("rispetta il limite di ricarica settimanale", async ({ page }) => {
    await page.getByRole("button", { name: "Ricarica" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(/Puoi ricaricare ancora/)).toBeVisible();
    await dialog.getByLabel("Importo (€)").fill("500");
    await dialog.getByRole("button", { name: "Ricarica" }).click();
    await expect(dialog.getByText(/Supera il tuo limite/)).toBeVisible();
  });

  test("preleva con identità verificata", async ({ page }) => {
    await page.getByRole("button", { name: "Preleva" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Importo (€)").fill("10");
    await dialog.getByRole("button", { name: "Preleva" }).click();
    await expect(toastText(page, "Prelievo di 10,00 € richiesto")).toBeVisible();
    await expect(page.getByRole("table")).toContainText("Prelievo");
  });
});

test.describe("scommesse", () => {
  test.beforeEach(async ({ page }) => {
    await prepare(page);
    await login(page);
    await openPage(page, "/sport");
    await page.getByRole("radio", { name: "Calcio" }).click();
  });

  test("gioca una singola", async ({ page, isMobile }) => {
    const odds = page
      .getByRole("group", { name: "Esito finale 1X2" })
      .first()
      .getByRole("button")
      .first();
    await odds.click();
    await expect(odds).toHaveAttribute("aria-pressed", "true");
    const panel = await slip(page, isMobile);
    await expect(panel.getByText("Singola")).toBeVisible();
    await panel.getByLabel("Importo (€)").fill("2");
    await panel.getByRole("button", { name: "Conferma la giocata" }).click();
    await expect(toastText(page, /Scommessa ARN-\d{6} registrata/)).toBeVisible();
    await openPage(page, "/conto");
    await page.getByRole("tab", { name: "Scommesse" }).click();
    await expect(page.getByText("2,00 €").first()).toBeVisible();
  });

  test("compone una multipla, sostituisce l'esito dello stesso evento", async ({
    page,
    isMobile,
  }) => {
    const groups = page.getByRole("group", { name: "Esito finale 1X2" });
    await groups.nth(0).getByRole("button").nth(0).click();
    await groups.nth(0).getByRole("button").nth(1).click();
    await expect(groups.nth(0).getByRole("button").nth(0)).toHaveAttribute("aria-pressed", "false");
    await groups.nth(1).getByRole("button").nth(2).click();
    const panel = await slip(page, isMobile);
    await expect(panel.getByText("Multipla (2)")).toBeVisible();
    await expect(panel.getByText("Quota totale")).toBeVisible();
  });

  test("blocca la puntata oltre il limite di perdita giornaliero", async ({ page, isMobile }) => {
    await page
      .getByRole("group", { name: "Esito finale 1X2" })
      .first()
      .getByRole("button")
      .first()
      .click();
    const panel = await slip(page, isMobile);
    await panel.getByLabel("Importo (€)").fill("45");
    await panel.getByRole("button", { name: "Conferma la giocata" }).click();
    await expect(panel.getByText(/limite di perdita giornaliero/)).toBeVisible();
  });
});

test.describe("slot", () => {
  test("una giocata dura almeno 2,5 secondi e annuncia il risultato", async ({ page }) => {
    await prepare(page);
    await login(page);
    await openPage(page, "/giochi/frutteto");
    const play = page.getByRole("button", { name: "Gioca" });
    await play.click();
    await expect(page.getByRole("button", { name: "Rulli in movimento…" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Gioca" })).toBeEnabled({ timeout: 6_000 });
    await expect(page.getByText(/^Risultato: /)).toBeAttached();
    await openPage(page, "/conto");
    await expect(page.getByRole("table")).toContainText("Giocata slot");
  });
});

test.describe("gioco responsabile", () => {
  test.beforeEach(async ({ page }) => {
    await prepare(page);
    await login(page);
    await openPage(page, "/gioco-responsabile");
  });

  test("riduce subito, aumenta dopo 7 giorni", async ({ page }) => {
    await page.getByLabel("Perdita massima in 24 ore (€)").fill("20");
    await page.getByRole("button", { name: "Salva" }).click();
    await expect(toastText(page, "Limiti aggiornati")).toBeVisible();
    await expect(page.getByText("In vigore: 20,00 €")).toBeVisible();
    await page.getByLabel("Ricarica massima in 7 giorni (€)").fill("300");
    await page.getByRole("button", { name: "Salva" }).click();
    await expect(toastText(page, /Riduzioni attive subito; aumenti dal 28 ott 2026/)).toBeVisible();
    await expect(page.getByText(/Modifica meno restrittiva in attesa/)).toBeVisible();
  });

  test("una pausa sospende gioco e ricariche", async ({ page }) => {
    await page.getByRole("button", { name: "Pausa di 1 giorno" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Conferma" }).click();
    await expect(page.getByText(/Pausa attiva fino al/).first()).toBeVisible();
    await openPage(page, "/giochi/frutteto");
    await expect(page.getByRole("button", { name: "Gioca" })).toBeDisabled();
    await expect(page.getByText(/Gioco e ricariche sono sospesi/)).toBeVisible();
  });

  test("autoesclusione", async ({ page }) => {
    await page.getByLabel("Durata", { exact: true }).selectOption("90");
    await page.getByRole("button", { name: "Autoesclusione" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText("90 giorni");
    await dialog.getByRole("button", { name: "Autoesclusione" }).click();
    await expect(page.getByText("Autoesclusione attiva", { exact: true }).first()).toBeVisible();
    await openPage(page, "/conto");
    await expect(page.getByText(/Puoi solo prelevare il saldo/)).toBeVisible();
  });

  test("test di autovalutazione", async ({ page }) => {
    const test1 = page.getByRole("group", { name: /somme di denaro sempre maggiori/ });
    await test1.getByLabel("No").check();
    await page
      .getByRole("group", { name: /mentire a persone importanti/ })
      .getByLabel("Sì")
      .check();
    await page.getByRole("button", { name: "Vedi il risultato" }).click();
    await expect(page.getByText(/è consigliabile parlarne con un professionista/)).toBeVisible();
  });
});

test.describe("sessione", () => {
  test("promemoria del tempo di gioco e chiusura al limite di durata", async ({ page }) => {
    await prepare(page, { clock: "install" });
    await login(page);
    await page.clock.fastForward("31:00");
    // Fa partire i requestAnimationFrame rimasti in coda con l'orologio simulato.
    await page.clock.runFor(1_000);
    const dialog = page.getByRole("dialog", { name: "Promemoria del tempo di gioco" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Giocato in questa sessione");
    await dialog.getByRole("button", { name: "Continua" }).click();
    await expect(dialog).toBeHidden();
    // Limite di sessione del conto demo: 2 ore.
    await page.clock.fastForward("01:30:00");
    await page.clock.runFor(1_000);
    await expect(page).toHaveURL(/\/accedi$/, { timeout: 10_000 });
    await expect(page.getByText(/hai raggiunto la durata massima/)).toBeVisible();
    await page.getByRole("button", { name: "Accedi", exact: true }).click();
    await expect(page.getByText(/puoi accedere di nuovo dalle/)).toBeVisible();
  });
});

test.describe("registrazione", () => {
  test("controlla età e codice fiscale, poi apre un conto provvisorio", async ({ page }) => {
    await prepare(page);
    await openPage(page, "/registrazione");
    await page.getByRole("button", { name: "Apri il conto" }).click();
    await expect(page.getByText("Campo obbligatorio").first()).toBeVisible();
    await page.getByRole("button", { name: "Compila con dati demo" }).click();
    await page.getByLabel("Data di nascita").fill("2010-01-01");
    await page.getByRole("button", { name: "Apri il conto" }).click();
    await expect(page.getByText("Devi avere almeno 18 anni")).toBeVisible();
    await page.getByLabel("Data di nascita").fill("1995-03-09");
    await page.getByRole("button", { name: "Apri il conto" }).click();
    await expect(
      page.getByText(/Devi accettare i termini|non corrisponde alla data di nascita/).first(),
    ).toBeVisible();
    await page.getByLabel("Data di nascita").fill("1995-03-08");
    await page.getByRole("checkbox", { name: /termini e condizioni/ }).check();
    await page.getByRole("checkbox", { name: /informativa privacy/ }).check();
    await page.getByRole("button", { name: "Apri il conto" }).click();
    await expect(page).toHaveURL(/\/conto$/);
    await expect(page.getByText("Documento in verifica", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Preleva" }).click();
    await expect(
      page.getByRole("dialog").getByText("Per prelevare serve l'identità verificata."),
    ).toBeVisible();
  });
});

test.describe("pannello operatore", () => {
  test.beforeEach(async ({ page }) => {
    await prepare(page);
  });

  test("referta un evento e liquida le scommesse", async ({ page }) => {
    await openPage(page, "/operatore/eventi");
    const form = page.getByRole("form").first();
    await form.getByLabel(/^Casa/).fill("2");
    await form.getByLabel(/^Ospite/).fill("1");
    await form.getByRole("button", { name: "Conferma risultato" }).click();
    await expect(toastText(page, /Risultato registrato: \d+ scommess/)).toBeVisible();
    await page.getByRole("radio", { name: "Conclusi" }).click();
    await expect(page.getByText("2 – 1").first()).toBeVisible();
  });

  test("verifica un documento", async ({ page }) => {
    await openPage(page, "/operatore/giocatori");
    await page.getByRole("radio", { name: "Da verificare" }).click();
    const rows = page.getByRole("table").getByRole("row");
    await expect(rows).toHaveCount(4);
    await rows.nth(1).getByRole("button").click();
    await page.getByRole("dialog").getByRole("button", { name: "Approva documento" }).click();
    await expect(toastText(page, "Identità verificata")).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "Chiudi" }).click();
    await expect(rows).toHaveCount(3);
  });

  test("mostra i segnali di gioco a rischio senza poter revocare le autoesclusioni", async ({
    page,
  }) => {
    await openPage(page, "/operatore/giocatori");
    await page.getByRole("radio", { name: "In pausa o esclusi" }).click();
    await page.getByRole("table").getByRole("row").nth(1).getByRole("button").click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByText("Pause e autoesclusioni non si possono revocare dal pannello."),
    ).toBeVisible();
    await dialog.getByLabel("Nota interna").fill("Contattato via email.");
    await dialog.getByRole("button", { name: "Salva" }).click();
    await expect(toastText(page, "Nota salvata")).toBeVisible();
  });
});
