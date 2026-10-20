import { expect, test, type Page } from "@playwright/test";
import { freezeTime, openPage } from "./helpers";

test.beforeEach(async ({ context }) => {
  await freezeTime(context);
});

async function fillContact(page: Page) {
  await page.getByLabel("Nome e cognome").fill("Anna Bianchi");
  await page.getByLabel("Telefono").fill("+39 333 123 4567");
  await page.getByLabel("Email").fill("anna@example.com");
}

test.describe("prenotazione dal sito", () => {
  test("prenota un tavolo e lo ritrova nel pannello", async ({ page }) => {
    await openPage(page, "/prenota");
    await page.getByRole("radio", { name: "3 persone" }).click();
    await page.getByRole("button", { name: "Domani" }).click();
    const dinner = page.getByRole("radiogroup", { name: "Orario · Cena" });
    await dinner.getByRole("radio", { name: "20:00", exact: true }).click();
    await fillContact(page);

    // Senza consenso privacy il modulo non parte.
    await page.getByRole("button", { name: "Conferma prenotazione" }).click();
    await expect(page.getByText("Per continuare è necessario il consenso")).toBeVisible();

    await page.getByRole("checkbox", { name: /informativa privacy/ }).check();
    await page.getByRole("button", { name: "Conferma prenotazione" }).click();
    await expect(page.getByRole("heading", { name: "Prenotazione confermata" })).toBeVisible();
    const code = (await page.locator("dd.font-mono").textContent())?.trim() ?? "";
    expect(code).toMatch(/^[A-Z]{2}-[A-Z0-9]{4}$/);

    await openPage(page, "/gestione/prenotazioni");
    await page.getByRole("button", { name: "Successivo" }).click();
    await page.getByRole("searchbox", { name: "Cerca" }).fill(code);
    const row = page.getByRole("listitem").filter({ hasText: "Anna Bianchi" });
    await expect(row).toBeVisible();
    await expect(row).toContainText("Confermata");
  });

  test("i gruppi oltre il massimo online non sono prenotabili", async ({ page }) => {
    await openPage(page, "/prenota");
    await expect(page.getByRole("radio", { name: "8 persone" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "9 persone" })).toHaveCount(0);
  });
});

test.describe("ordine online", () => {
  test("ordina d'asporto, la cucina lo prende in carico e il tracking si aggiorna", async ({
    page,
    context,
    isMobile,
  }) => {
    await openPage(page, "/ordina");
    const add = page.getByRole("button", { name: "Aggiungi: Tagliatelle al ragù" });
    await add.click();
    await add.click();

    if (isMobile) {
      await page.getByRole("button", { name: /^Vedi ordine/ }).click();
    }
    const cart = isMobile ? page.getByRole("dialog") : page.locator("aside");
    await cart.getByRole("radio", { name: "Asporto", exact: true }).click();
    await cart.getByRole("link", { name: "Vai al pagamento" }).click();

    await expect(page.getByRole("heading", { level: 1, name: "Completa l'ordine" })).toBeVisible();
    await page.getByRole("radio", { name: "Asporto", exact: true }).check();
    await fillContact(page);
    await page.getByRole("checkbox", { name: /informativa privacy/ }).check();
    await page.getByRole("button", { name: /^Invia ordine/ }).click();

    await expect(page).toHaveURL(/\/ordine\/\d+$/);
    const number = page.url().split("/").pop() ?? "";
    await expect(
      page.getByRole("heading", { level: 1, name: `Ordine n. ${number}` }),
    ).toBeVisible();
    await expect(page.locator('[aria-current="step"]')).toContainText("Ricevuto");

    // Il pannello (stesso browser, altra scheda) vede l'ordine e lo avanza.
    const kitchen = await context.newPage();
    await openPage(kitchen, "/gestione/ordini");
    const card = kitchen
      .getByRole("listitem")
      .filter({ hasText: `#${number}` })
      .first();
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: /Inizia preparazione/ }).click();

    await page.bringToFront();
    await expect(page.locator('[aria-current="step"]')).toContainText("In preparazione");
  });

  test("blocca la consegna fuori zona", async ({ page }) => {
    await openPage(page, "/ordina");
    const add = page.getByRole("button", { name: "Aggiungi: Tagliatelle al ragù" });
    for (let i = 0; i < 2; i += 1) await add.click();
    await page.goto("/ordina/checkout");
    await page.getByRole("radio", { name: "Consegna", exact: true }).check();
    await page.getByLabel("Via e numero civico").fill("Via Roma 1");
    await page.getByLabel("CAP").fill("20121");
    await expect(page.getByText("Non consegniamo in questo CAP")).toBeVisible();
  });
});

test.describe("pannello", () => {
  test("un piatto esaurito compare come tale nel sito", async ({ page }) => {
    await openPage(page, "/gestione/menu");
    await page.getByRole("switch", { name: "Disponibile oggi: Tagliatelle al ragù" }).click();
    await expect(page.getByText("Tagliatelle al ragù segnato come esaurito").first()).toBeVisible();

    await openPage(page, "/ordina");
    await expect(
      page.getByRole("button", { name: "Aggiungi: Tagliatelle al ragù" }),
    ).toBeDisabled();
  });

  test("accomoda clienti senza prenotazione dalla mappa di sala", async ({ page }) => {
    await openPage(page, "/gestione/sala");
    // Alle 12:00 il locale è ancora chiuso: la sala è tutta libera.
    await page.getByRole("combobox", { name: "Alle ore" }).selectOption("now");
    const table = page.getByRole("button", { name: /^1\b/ }).first();
    await expect(table).toContainText("Libero");
    await table.click();
    await page.getByRole("button", { name: "Aggiungi senza prenotazione" }).click();
    await page.getByLabel("Persone").fill("2");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Aggiungi senza prenotazione" })
      .click();
    await expect(page.getByText("Tavolo occupato").first()).toBeVisible();
    await expect(table).toContainText("Occupato");
  });

  test("le impostazioni cambiano il modulo di prenotazione", async ({ page }) => {
    await openPage(page, "/gestione/impostazioni");
    await page.getByLabel("Gruppo massimo prenotabile online").fill("6");
    await page
      .locator("#impostazioni-prenotazioni")
      .getByRole("button", { name: "Salva modifiche" })
      .click();
    await expect(page.getByText("Impostazioni prenotazioni salvate").first()).toBeVisible();

    await openPage(page, "/prenota");
    await expect(page.getByRole("radio", { name: "6 persone" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "7 persone" })).toHaveCount(0);
  });
});
