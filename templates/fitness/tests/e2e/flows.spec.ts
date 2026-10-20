import { expect, test } from "@playwright/test";
import { freezeTime, loginAsMember, openPage } from "./helpers";

test.beforeEach(async ({ context }) => {
  await freezeTime(context);
  await loginAsMember(context);
});

test.describe("area socio", () => {
  test("prenota una lezione e la ritrova nella panoramica", async ({ page }) => {
    await openPage(page, "/area-socio/prenota");
    // Domani (giovedì 22): il socio ha già lezioni, quindi sceglie venerdì 23.
    await page.getByRole("radio", { name: /Venerdì 23 ottobre/i }).click();
    const card = page
      .getByRole("listitem")
      .filter({ has: page.getByRole("button", { name: /^Prenota ·/ }) })
      .first();
    const course = (await card.getByRole("heading", { level: 2 }).textContent())?.trim() ?? "";
    await card.getByRole("button", { name: /^Prenota ·/ }).click();
    await expect(page.getByText(`Prenotazione confermata: ${course}`).first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: new RegExp(`^Cancella · ${course}`) }).first(),
    ).toBeVisible();

    await openPage(page, "/area-socio");
    await expect(page.getByRole("listitem").filter({ hasText: course }).first()).toBeVisible();
  });

  test("cancella una prenotazione con conferma", async ({ page }) => {
    await openPage(page, "/area-socio");
    const row = page
      .getByRole("listitem")
      .filter({ has: page.getByRole("button", { name: /^Cancella ·/ }) })
      .first();
    await row.getByRole("button", { name: /^Cancella ·/ }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Cancella" }).click();
    await expect(page.getByText("Prenotazione cancellata").first()).toBeVisible();
  });

  test("disattiva il rinnovo automatico (disdetta)", async ({ page }) => {
    await openPage(page, "/area-socio/abbonamento");
    await page.getByRole("switch", { name: "Rinnovo automatico" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Disattiva rinnovo" }).click();
    await expect(page.getByText("Rinnovo disattivato").first()).toBeVisible();
    await expect(page.getByText(/Il rinnovo è disattivato/)).toBeVisible();
    await expect(page.getByRole("switch", { name: "Rinnovo automatico" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  test("aggiorna i consensi dal profilo", async ({ page }) => {
    await openPage(page, "/area-socio/profilo");
    const marketing = page.getByRole("switch", { name: "Comunicazioni promozionali" });
    await expect(marketing).toHaveAttribute("aria-checked", "false");
    await marketing.click();
    await expect(marketing).toHaveAttribute("aria-checked", "true");
    await page.reload();
    await expect(page.getByRole("switch", { name: "Comunicazioni promozionali" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });
});

test.describe("sito e reception", () => {
  test("richiesta di prova gratuita visibile nel pannello", async ({ page }) => {
    await openPage(page, "/prova-gratuita");
    await page.getByRole("radio", { name: "Cardio e cycle" }).check();
    await page.locator('input[name="sessionId"]').first().check();
    await page.getByLabel("Nome e cognome").fill("Marta Prova");
    await page.getByLabel("Email").fill("marta@example.com");
    await page.getByLabel("Telefono").fill("+39 333 000 7777");
    await page.getByRole("button", { name: "Richiedi la prova" }).click();
    await expect(page.getByText("Conferma di essere maggiorenne")).toBeVisible();
    await page.getByRole("checkbox", { name: /almeno 18 anni/ }).check();
    await page.getByRole("checkbox", { name: /informativa privacy/ }).check();
    await page.getByRole("button", { name: "Richiedi la prova" }).click();
    await expect(page.getByRole("heading", { name: "Richiesta inviata" })).toBeVisible();

    await openPage(page, "/gestione");
    await expect(page.getByText("Marta Prova").first()).toBeVisible();
  });

  test("check-in del socio con avvisi", async ({ page }) => {
    await openPage(page, "/gestione/check-in");
    await page.getByRole("searchbox").fill("RC-1007");
    await page.getByRole("button", { name: /Chiara Colombo/ }).click();
    await expect(page.getByText("Ingresso consentito")).toBeVisible();
    await expect(page.getByText(/Certificato in scadenza/)).toBeVisible();
    await page.getByRole("button", { name: "Registra ingresso" }).click();
    await expect(page.getByText("Ingresso registrato: Chiara Colombo").first()).toBeVisible();
    await expect(
      page.getByRole("listitem").filter({ hasText: "Chiara Colombo" }).first(),
    ).toBeVisible();
  });

  test("nuovo iscritto senza certificato: ingresso bloccato", async ({ page }) => {
    await openPage(page, "/gestione/iscritti");
    await page.getByRole("button", { name: "Nuovo iscritto" }).first().click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nome", { exact: true }).fill("Paolo");
    await dialog.getByLabel("Cognome").fill("Nuovo");
    await dialog.getByLabel("Email").fill("paolo.nuovo@example.com");
    await dialog.getByLabel("Telefono").fill("+39 333 000 5555");
    await dialog.getByRole("button", { name: "Nuovo iscritto" }).click();
    await expect(page.getByText("Iscritto aggiunto").first()).toBeVisible();

    await openPage(page, "/gestione/check-in");
    await page.getByRole("searchbox").fill("Paolo Nuovo");
    await page.getByRole("button", { name: /Paolo Nuovo/ }).click();
    await expect(page.getByText("Ingresso non consentito")).toBeVisible();
    await expect(page.getByText("Certificato medico mancante")).toBeVisible();
    await expect(page.getByRole("button", { name: "Registra ingresso" })).toBeDisabled();
  });

  test("registra le presenze di una lezione conclusa", async ({ page }) => {
    await openPage(page, "/gestione");
    await page.getByRole("button", { name: /07:30/ }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: /Prenotati/ })).toBeVisible();
    // Il primo prenotato: "Presente" cambia stato a ogni clic.
    const present = dialog.getByRole("group").first().getByRole("button", { name: "Presente" });
    const before = await present.getAttribute("aria-pressed");
    await present.click();
    await expect(present).toHaveAttribute("aria-pressed", before === "true" ? "false" : "true");
  });

  test("disattivare le prove gratuite aggiorna il sito", async ({ page }) => {
    await openPage(page, "/gestione/impostazioni");
    await page.getByRole("switch", { name: "Richieste di prova dal sito" }).click();
    await page
      .locator("#impostazioni-regole")
      .getByRole("button", { name: "Salva modifiche" })
      .click();
    await expect(page.getByText("Regole salvate").first()).toBeVisible();
    await openPage(page, "/prova-gratuita");
    await expect(page.getByText(/non accettiamo richieste di prova online/)).toBeVisible();
  });
});
