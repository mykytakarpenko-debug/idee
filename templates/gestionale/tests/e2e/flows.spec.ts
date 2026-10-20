import { expect, test } from "@playwright/test";
import { openPage } from "./helpers";

test.describe("flussi principali", () => {
  test("crea un cliente con validazione", async ({ page }) => {
    await openPage(page, "/clienti");
    await page.getByRole("button", { name: "Nuovo cliente" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Nuovo cliente" });
    await expect(dialog).toBeVisible();

    // Invio vuoto: errori accanto ai campi e focus sul primo
    await dialog.getByRole("button", { name: "Nuovo cliente" }).click();
    await expect(dialog.getByText("Campo obbligatorio").first()).toBeVisible();
    await expect(dialog.getByLabel("Nome", { exact: true })).toBeFocused();

    await dialog.getByLabel("Nome", { exact: true }).fill("Teresa");
    await dialog.getByLabel("Cognome").fill("Esempio");
    await dialog.getByLabel("Telefono").fill("+39 340 000 1234");
    await dialog.getByRole("button", { name: "Nuovo cliente" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText("Cliente aggiunto").first()).toBeVisible();

    await page.getByRole("searchbox", { name: "Cerca" }).fill("Teresa Esempio");
    await expect(page.getByRole("link", { name: "Teresa Esempio" })).toBeVisible();
  });

  test("avvisa delle sovrapposizioni in agenda", async ({ page }) => {
    await openPage(page, "/appuntamenti");
    await page.getByRole("button", { name: "Nuovo appuntamento" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Nuovo appuntamento" });

    await dialog.getByRole("combobox", { name: "Cliente" }).click();
    await page.getByPlaceholder("Cerca cliente…").fill("a");
    await page.keyboard.press("Enter");
    await dialog.getByLabel("Servizio").selectOption({ label: "Taglio e piega" });
    await dialog.getByLabel("Operatore").selectOption({ label: "Giulia Rinaldi" });
    await dialog.getByLabel("Data").fill("2030-01-08");
    await dialog.getByLabel("Ora di inizio").fill("10:00");
    await dialog.getByRole("button", { name: "Nuovo appuntamento" }).click();
    await expect(dialog).toBeHidden();

    // Secondo appuntamento sovrapposto: compare l'avviso e serve una conferma esplicita
    await page.getByRole("button", { name: "Nuovo appuntamento" }).first().click();
    await dialog.getByRole("combobox", { name: "Cliente" }).click();
    await page.getByPlaceholder("Cerca cliente…").fill("b");
    await page.keyboard.press("Enter");
    await dialog.getByLabel("Servizio").selectOption({ label: "Piega" });
    await dialog.getByLabel("Operatore").selectOption({ label: "Giulia Rinaldi" });
    await dialog.getByLabel("Data").fill("2030-01-08");
    await dialog.getByLabel("Ora di inizio").fill("10:30");
    await expect(dialog.getByRole("alert")).toContainText("Giulia Rinaldi ha già un appuntamento");
    await dialog.getByRole("button", { name: "Nuovo appuntamento" }).click();
    await expect(dialog.getByRole("button", { name: "Salva comunque" })).toBeVisible();
    await dialog.getByRole("button", { name: "Salva comunque" }).click();
    await expect(dialog).toBeHidden();
  });

  test("registra un incasso da un pagamento in attesa", async ({ page }) => {
    await openPage(page, "/pagamenti");
    await page.getByRole("radio", { name: "In attesa" }).click();
    const firstActions = page.getByRole("button", { name: /^Altre azioni: / }).first();
    await firstActions.click();
    await page.getByRole("menuitem", { name: "Segna come pagato" }).click();
    await expect(page.getByText("Pagamento incassato").first()).toBeVisible();
  });

  test("i dati restano dopo il ricaricamento", async ({ page }) => {
    await openPage(page, "/impostazioni");
    const name = page.getByLabel("Nome dell'attività");
    await name.fill("Studio Prova");
    await page.getByRole("button", { name: "Salva modifiche" }).first().click();
    await expect(page.getByText("Dati dell'attività salvati").first()).toBeVisible();
    await page.waitForTimeout(600);
    await page.reload();
    await expect(page.getByLabel("Nome dell'attività")).toHaveValue("Studio Prova");
  });
});
