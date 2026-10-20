import { expect, test } from "@playwright/test";
import { freezeTime, openPage, panelRoutes, siteRoutes } from "./helpers";

test.beforeEach(async ({ page }) => {
  await freezeTime(page);
});

test.describe("navigazione", () => {
  for (const route of [...siteRoutes, ...panelRoutes]) {
    test(`apre ${route.path}`, async ({ page }) => {
      await openPage(page, route.path);
      await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible();
    });
  }

  test("mostra la pagina 404", async ({ page }) => {
    const response = await page.goto("/pagina-inesistente");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Pagina non trovata" })).toBeVisible();
  });

  test("servizi e dati strutturati nell'HTML iniziale (SEO)", async ({ request }) => {
    const home = await (await request.get("/")).text();
    expect(home).toContain("Dichiarazione dei redditi (730)");
    expect(home).toContain('"@type":"ProfessionalService"');
    expect(home).toContain('"@type":"ReserveAction"');
  });

  test("pannello, widget e pagina della prenotazione non sono indicizzabili", async ({ page }) => {
    for (const path of ["/gestione", "/widget", "/prenotazione/AG-AAAAAA"]) {
      await page.goto(path);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    }
  });

  test("il widget è incorporabile, le altre pagine no", async ({ request }) => {
    const widget = await request.get("/widget");
    expect(widget.headers()["content-security-policy"]).toContain("frame-ancestors 'self'");
    expect(widget.headers()["x-frame-options"]).toBeUndefined();
    for (const path of ["/", "/prenota", "/gestione"]) {
      const response = await request.get(path);
      expect(response.headers()["content-security-policy"], path).toContain(
        "frame-ancestors 'none'",
      );
      expect(response.headers()["x-frame-options"], path).toBe("DENY");
    }
  });

  test("dalla home si arriva alla prenotazione", async ({ page }) => {
    await openPage(page, "/");
    await page
      .getByRole("main")
      .getByRole("link", { name: "Prenota un appuntamento" })
      .first()
      .click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Prenota un appuntamento" }),
    ).toBeVisible();
  });

  test("navigazione del pannello", async ({ page }) => {
    await openPage(page, "/gestione");
    const nav = page.getByRole("navigation").filter({ visible: true }).first();
    await nav.getByRole("link", { name: "Servizi" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Servizi" })).toBeVisible();
    await nav.getByRole("link", { name: "Disponibilità" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Disponibilità" })).toBeVisible();
    await expect(nav.getByRole("link", { name: /Agenda/ })).toBeVisible();
  });

  test("cerca una prenotazione per codice", async ({ page }) => {
    await openPage(page, "/prenotazione");
    await page.getByRole("button", { name: "Cerca" }).click();
    await expect(page.getByText("Inserisci un codice nel formato AG-XXXXXX")).toBeVisible();
    await page.getByLabel("Codice prenotazione").fill("ag-zzzzzz");
    await page.getByRole("button", { name: "Cerca" }).click();
    await expect(page).toHaveURL(/\/prenotazione\/AG-ZZZZZZ$/);
    await expect(page.getByText("Nessuna prenotazione con questo codice.")).toBeVisible();
  });
});
