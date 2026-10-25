import { expect, test } from "@playwright/test";
import { FIXED_NOW, openPage, panelRoutes, prepare, publicRoutes } from "./helpers";

test.describe("pagine pubbliche", () => {
  test.beforeEach(async ({ page }) => {
    await prepare(page);
  });

  for (const route of publicRoutes) {
    test(`${route.path} mostra il titolo e le avvertenze`, async ({ page }) => {
      await openPage(page, route.path);
      await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible();
      await expect(
        page.getByText("Il gioco è vietato ai minori e può causare dipendenza patologica.").first(),
      ).toBeVisible();
      await expect(page.getByRole("link", { name: /800 558 822/ }).first()).toBeVisible();
    });
  }

  test("il conto senza accesso rimanda all'accesso", async ({ page }) => {
    await page.goto("/conto");
    await expect(page).toHaveURL(/\/accedi$/);
  });

  test("le pagine dei giochi mostrano RTP e tabella dei pagamenti", async ({ page }) => {
    await openPage(page, "/giochi/frutteto");
    await expect(page.getByText("95,56%")).toBeVisible();
    await expect(page.getByRole("table")).toContainText("Tre sette");
    await expect(
      page.getByRole("link", { name: "Accedi per giocare con i crediti demo" }),
    ).toBeVisible();
  });

  test("le scommesse mostrano gli eventi futuri con le quote", async ({ page }) => {
    await openPage(page, "/sport");
    await expect(page.getByRole("heading", { level: 2, name: "Oggi" })).toBeVisible();
    await page.getByRole("radio", { name: "Tennis" }).click();
    await expect(page.getByRole("group", { name: "Testa a testa" }).first()).toBeVisible();
    await expect(page.getByRole("group", { name: "Esito finale 1X2" })).toHaveCount(0);
  });

  test("robots blocca tutto in demo", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(await robots.text()).toContain("Disallow: /");
  });
});

test.describe("verifica della maggiore età", () => {
  test("chi dichiara di essere minorenne non entra", async ({ page }) => {
    await page.clock.setFixedTime(FIXED_NOW);
    await page.goto("/");
    const gate = page.getByRole("alertdialog", { name: "Hai almeno 18 anni?" });
    await expect(gate).toBeVisible();
    await gate.getByRole("button", { name: "No", exact: true }).click();
    await expect(page).toHaveURL(/\/minori$/);
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await page.goto("/sport");
    await expect(page.getByRole("alertdialog", { name: "Hai almeno 18 anni?" })).toBeVisible();
  });

  test("la conferma vale per le visite successive", async ({ page }) => {
    await page.clock.setFixedTime(FIXED_NOW);
    await page.goto("/");
    await page.getByRole("button", { name: "Sì, ho almeno 18 anni" }).click();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await page.goto("/giochi");
    await expect(page.getByRole("heading", { level: 1, name: "Giochi" })).toBeVisible();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
  });
});

test.describe("pannello operatore", () => {
  test.beforeEach(async ({ page }) => {
    await prepare(page);
  });

  for (const route of panelRoutes) {
    test(`${route.path} si apre`, async ({ page }) => {
      await openPage(page, route.path);
      await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible();
    });
  }
});
