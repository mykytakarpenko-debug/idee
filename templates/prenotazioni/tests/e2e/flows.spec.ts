import { expect, test, type Page } from "@playwright/test";
import {
  confirmationCode,
  customer,
  fillDetails,
  freezeTime,
  openPage,
  pickService,
  slotGroup,
} from "./helpers";

test.beforeEach(async ({ page }) => {
  await freezeTime(page);
});

/** Riquadro delle richieste da confermare nell'agenda. */
const pendingCard = (page: Page) =>
  page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Da confermare", exact: true }) });

/** Prenota il 730 in studio al primo orario libero e restituisce orario e codice. */
async function book730(page: Page) {
  await pickService(page, /Dichiarazione dei redditi/);
  await page.getByRole("radio", { name: /In studio/ }).check();
  await page.getByRole("button", { name: "Continua" }).click();
  const first = slotGroup(page).getByRole("radio").first();
  const time = ((await first.textContent()) ?? "").trim();
  await first.click();
  await expect(first).toHaveAttribute("aria-checked", "true");
  await page.getByRole("button", { name: "Continua" }).click();
  await fillDetails(page, "Conferma prenotazione");
  await expect(page.getByRole("heading", { name: "Prenotazione confermata" })).toBeVisible();
  return { time, code: await confirmationCode(page) };
}

test.describe("prenotazione online", () => {
  test("prenota, sposta e cancella un appuntamento", async ({ page }) => {
    await openPage(page, "/prenota");
    await pickService(page, /Dichiarazione dei redditi/);

    // Un solo professionista: è già scelto; la modalità va indicata.
    const next = page.getByRole("button", { name: "Continua" });
    await expect(next).toBeDisabled();
    await page.getByRole("radio", { name: /In studio/ }).check();
    await next.click();

    // Il primo giorno disponibile (giovedì) è già selezionato.
    await expect(
      page.getByRole("button", { name: "Giovedì 22 ottobre, disponibile" }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("button", { name: "Mercoledì 21 ottobre, non disponibile" }),
    ).toBeDisabled();
    await expect(next).toBeDisabled();
    // L'ultimo orario del giorno è oltre le 24 ore: si potrà spostare e cancellare online.
    await slotGroup(page).getByRole("radio").last().click();
    await next.click();

    // Validazione dei dati.
    await page.getByRole("button", { name: "Conferma prenotazione" }).click();
    await expect(page.getByText("Campo obbligatorio").first()).toBeVisible();
    await expect(page.getByText("Per continuare è necessario il consenso")).toBeVisible();
    await fillDetails(page, "Conferma prenotazione");

    await expect(page.getByRole("heading", { name: "Prenotazione confermata" })).toBeVisible();
    const code = await confirmationCode(page);
    expect(code).toMatch(/^AG-[A-Z0-9]{6}$/);

    await page.getByRole("link", { name: "Gestisci la prenotazione" }).click();
    await expect(page).toHaveURL(new RegExp(`/prenotazione/${code}$`));
    await expect(
      page.getByRole("heading", { level: 1, name: `Prenotazione ${code}` }),
    ).toBeVisible();
    await expect(page.getByText("Confermato", { exact: true })).toBeVisible();
    await expect(page.getByText("Giovedì 22 ottobre", { exact: false }).first()).toBeVisible();

    // Spostamento a venerdì.
    await page.getByRole("button", { name: "Sposta" }).click();
    await page.getByRole("button", { name: "Venerdì 23 ottobre, disponibile" }).click();
    await slotGroup(page).getByRole("radio").first().click();
    await page.getByRole("button", { name: "Conferma", exact: true }).click();
    await expect(page.getByText("Appuntamento spostato", { exact: true })).toBeVisible();
    await expect(page.getByText(/^Venerdì 23 ottobre, \d{2}:\d{2}$/).first()).toBeVisible();
    await expect(page.getByText("Spostato da te")).toBeVisible();

    // Cancellazione.
    await page.getByRole("button", { name: "Cancella appuntamento" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Cancella appuntamento" }).click();
    await expect(page.getByText("Appuntamento cancellato", { exact: true })).toBeVisible();
    await expect(page.getByText("Cancellato", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Sposta" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Prenota di nuovo" })).toBeVisible();
  });

  test("un orario appena prenotato non viene più proposto", async ({ page }) => {
    await openPage(page, "/prenota");
    const { time } = await book730(page);
    await page.getByRole("button", { name: "Nuova prenotazione" }).click();
    await pickService(page, /Dichiarazione dei redditi/);
    await page.getByRole("radio", { name: /In studio/ }).check();
    await page.getByRole("button", { name: "Continua" }).click();
    await expect(slotGroup(page)).toBeVisible();
    await expect(slotGroup(page).getByRole("radio", { name: time, exact: true })).toHaveCount(0);
  });

  test("la richiesta da confermare viene approvata dal pannello", async ({ page }) => {
    await openPage(page, "/prenota");
    await pickService(page, /Prima consulenza conoscitiva/);
    // Più professionisti: "primo disponibile" è proposto di default; solo videochiamata.
    await expect(page.getByRole("radio", { name: /Primo disponibile/ })).toBeChecked();
    await page.getByRole("button", { name: "Continua" }).click();
    await slotGroup(page).getByRole("radio").first().click();
    await page.getByRole("button", { name: "Continua" }).click();
    await fillDetails(page, "Invia richiesta");
    await expect(page.getByRole("heading", { name: "Richiesta inviata" })).toBeVisible();
    const code = await confirmationCode(page);

    await openPage(page, `/prenotazione/${code}`);
    await expect(page.getByText("Da confermare", { exact: true })).toBeVisible();

    await openPage(page, "/gestione");
    const pending = pendingCard(page);
    await expect(pending.getByText(customer.name, { exact: true })).toBeVisible();
    await pending.getByRole("button", { name: `Conferma · ${customer.name}` }).click();
    await expect(page.getByText("Appuntamento confermato", { exact: true })).toBeVisible();
    await expect(pending.getByText(customer.name, { exact: true })).toHaveCount(0);

    await openPage(page, `/prenotazione/${code}`);
    await expect(page.getByText("Confermato", { exact: true })).toBeVisible();
  });

  test("lo studio rifiuta una richiesta dal dettaglio", async ({ page }) => {
    await openPage(page, "/gestione");
    const pending = pendingCard(page);
    const rows = pending.getByRole("listitem");
    const before = await rows.count();
    expect(before).toBeGreaterThan(0);
    await pending
      .getByRole("button", { name: /^Dettagli/ })
      .first()
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Rifiuta" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Rifiuta" }).click();
    await expect(page.getByText("Richiesta rifiutata", { exact: true })).toBeVisible();
    await expect(rows).toHaveCount(before - 1);
  });

  test("la prenotazione dal widget compare nell'agenda dello studio", async ({ page }) => {
    await openPage(page, "/widget");
    await expect(page.getByRole("contentinfo")).toHaveCount(0); // niente piè di pagina del sito
    const { time } = await book730(page);

    await openPage(page, "/gestione");
    await page.getByRole("button", { name: "Successivo" }).click();
    await expect(page.getByText("Giovedì 22 ottobre", { exact: true })).toBeVisible();
    await page.getByRole("combobox", { name: "Tutti i professionisti" }).selectOption({
      label: "Laura Ferraris",
    });
    const row = page.getByRole("listitem").filter({ hasText: customer.name });
    await expect(row).toContainText(time);
    await row.getByRole("button").first().click();
    await expect(page.getByRole("dialog")).toContainText("Widget");
  });
});

test.describe("pannello", () => {
  test("un'assenza rende il giorno non prenotabile", async ({ page }) => {
    await openPage(page, "/gestione/disponibilita");
    await page.getByLabel("Chi", { exact: true }).selectOption({ label: "Laura Ferraris" });
    await page.getByLabel("Dal", { exact: true }).fill("2026-10-22");
    await page.getByLabel("Al", { exact: true }).fill("2026-10-23");
    await page.getByLabel(/^Motivo/).fill("Ferie");
    await page.getByRole("button", { name: "Aggiungi assenza" }).click();
    await expect(page.getByText("Assenza aggiunta", { exact: true })).toBeVisible();
    await expect(
      page.getByText(/in questo periodo: ricordati di avvisare i clienti/).first(),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /^Elimina: Laura Ferraris/ })).toBeVisible();

    await openPage(page, "/prenota");
    await pickService(page, /Dichiarazione dei redditi/);
    await page.getByRole("radio", { name: /In studio/ }).check();
    await page.getByRole("button", { name: "Continua" }).click();
    await expect(
      page.getByRole("button", { name: "Giovedì 22 ottobre, non disponibile" }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Venerdì 23 ottobre, non disponibile" }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Lunedì 26 ottobre, disponibile" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("l'orario settimanale valida le fasce prima di salvare", async ({ page }) => {
    await openPage(page, "/gestione/disponibilita");
    await page.getByLabel("Lunedì, alle").first().fill("15:00");
    await page.getByRole("button", { name: "Salva modifiche" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "non sovrapporsi" })).toBeVisible();
    await page.getByLabel("Lunedì, alle").first().fill("13:00");
    await page.getByRole("button", { name: "Salva modifiche" }).click();
    await expect(page.getByText("Orari salvati", { exact: true })).toBeVisible();
  });

  test("disattivare un servizio lo toglie dalla prenotazione", async ({ page }) => {
    await openPage(page, "/gestione/servizi");
    const toggle = page.getByRole("switch", {
      name: "Prenotabile online: Check-up fiscale annuale",
    });
    await expect(toggle).toBeChecked();
    await toggle.click();
    await expect(toggle).not.toBeChecked();

    await openPage(page, "/prenota");
    await expect(page.getByRole("radio", { name: /Dichiarazione dei redditi/ })).toBeVisible();
    await expect(page.getByRole("radio", { name: /Check-up fiscale/ })).toHaveCount(0);
  });

  test("crea un nuovo servizio prenotabile", async ({ page }) => {
    await openPage(page, "/gestione/servizi");
    await page.getByRole("button", { name: "Nuovo servizio" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Nuovo servizio" }).click();
    await expect(dialog.getByText("Campo obbligatorio").first()).toBeVisible();
    await expect(dialog.getByText("Seleziona almeno un'opzione")).toBeVisible();

    await dialog.getByLabel("Nome").fill("Consulenza successione");
    await dialog.getByLabel("Descrizione").fill("Analisi dei documenti e dei passaggi necessari.");
    await dialog.getByLabel("Categoria").selectOption({ index: 2 });
    await dialog.getByLabel("Durata (minuti)").fill("60");
    await dialog.getByLabel("Prezzo (€)").fill("90");
    await dialog.getByRole("checkbox", { name: "Videochiamata" }).check();
    await dialog.getByRole("checkbox", { name: "Giada Moretti" }).check();
    await dialog.getByRole("button", { name: "Nuovo servizio" }).click();
    await expect(page.getByText("Servizio creato", { exact: true })).toBeVisible();
    await expect(page.getByText("Consulenza successione")).toBeVisible();

    await openPage(page, "/prenota");
    await pickService(page, /Consulenza successione/);
    await page.getByRole("radio", { name: /Videochiamata/ }).check();
    await page.getByRole("button", { name: "Continua" }).click();
    await expect(slotGroup(page).getByRole("radio").first()).toBeVisible();
  });

  test('senza "primo disponibile" il cliente sceglie il professionista', async ({ page }) => {
    await openPage(page, "/gestione/impostazioni");
    const toggle = page.getByRole("switch", { name: 'Consenti "primo disponibile"' });
    await toggle.click();
    await expect(toggle).not.toBeChecked();
    const rules = page.locator("form").filter({ has: toggle });
    await rules.getByRole("button", { name: "Salva modifiche" }).click();
    await expect(page.getByText("Regole salvate", { exact: true })).toBeVisible();

    await openPage(page, "/prenota");
    await pickService(page, /Prima consulenza conoscitiva/);
    await expect(page.getByRole("radio", { name: /Primo disponibile/ })).toHaveCount(0);
    const next = page.getByRole("button", { name: "Continua" });
    await expect(next).toBeDisabled();
    await page.getByRole("radio", { name: /Giada Moretti/ }).check();
    await expect(next).toBeEnabled();
  });

  test("il ripristino riporta i dati demo", async ({ page }) => {
    await openPage(page, "/gestione/servizi");
    const toggle = page.getByRole("switch", {
      name: "Prenotabile online: Successioni e donazioni",
    });
    await toggle.click();
    await expect(toggle).not.toBeChecked();

    await openPage(page, "/gestione/impostazioni");
    await page.getByRole("button", { name: "Ripristina dati demo" }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Ripristina dati demo" })
      .click();
    await expect(page.getByText("Dati demo ripristinati", { exact: true })).toBeVisible();

    await openPage(page, "/gestione/servizi");
    for (const item of await page.getByRole("switch").all()) await expect(item).toBeChecked();
  });

  test("agenda: navigazione per giorno e filtro per professionista", async ({ page }) => {
    await openPage(page, "/gestione");
    await expect(page.getByText("Mercoledì 21 ottobre", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Successivo" }).click();
    await expect(page.getByText("Giovedì 22 ottobre", { exact: true })).toBeVisible();
    await page.getByRole("combobox", { name: "Tutti i professionisti" }).selectOption({
      label: "Giada Moretti",
    });
    const rows = page.getByRole("main").getByRole("list").last().getByRole("listitem");
    await expect(rows.first()).toBeVisible();
    for (const row of await rows.all()) await expect(row).toContainText("Giada Moretti");
    await page.getByRole("button", { name: "Oggi" }).click();
    await expect(page.getByText("Mercoledì 21 ottobre", { exact: true })).toBeVisible();
  });
});
