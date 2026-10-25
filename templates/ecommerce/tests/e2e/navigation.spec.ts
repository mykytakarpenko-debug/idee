import { expect, test } from "@playwright/test";
import { freezeTime, openPage, panelRoutes, shopRoutes } from "./helpers";

test.beforeEach(async ({ page }) => {
  await freezeTime(page);
});

test.describe("navigazione", () => {
  for (const route of [...shopRoutes, ...panelRoutes]) {
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

  test("prodotti, prezzi e dati strutturati nell'HTML iniziale (SEO)", async ({ request }) => {
    const product = await (await request.get("/prodotto/ciotola-onda")).text();
    expect(product).toContain("Ciotola Onda");
    expect(product).toContain('"@type":"Product"');
    expect(product).toContain('"price":"17.60"');
    expect(product).toContain("Prezzo più basso negli ultimi 30 giorni");
    const catalog = await (await request.get("/catalogo")).text();
    expect(catalog).toContain("Taccuino A5 rilegato a mano");
    const home = await (await request.get("/")).text();
    expect(home).toContain('"@type":"OnlineStore"');
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/prodotto/tazza-alba");
  });

  test("carrello, checkout, area personale e pannello non sono indicizzabili", async ({ page }) => {
    for (const path of ["/carrello", "/checkout", "/account", "/gestione"]) {
      await page.goto(path);
      await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
        "content",
        /noindex/,
      );
    }
  });

  test("senza accesso l'area personale rimanda al login", async ({ page }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/\/accedi$/);
    await page.getByRole("button", { name: "Accedi" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Ciao, Chiara" })).toBeVisible();
  });

  test("la ricerca dell'intestazione apre il catalogo filtrato", async ({ page, isMobile }) => {
    await openPage(page, "/");
    if (isMobile) {
      await page.getByRole("button", { name: "Apri il menu" }).click();
      await page
        .getByRole("dialog")
        .getByRole("searchbox", { name: "Cerca nel negozio" })
        .fill("taccuino");
    } else {
      await page.getByRole("searchbox", { name: "Cerca nel negozio" }).fill("taccuino");
    }
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/catalogo\?q=taccuino/);
    await expect(page.getByText("1 prodotto", { exact: true }).last()).toBeVisible();
    await expect(page.getByRole("link", { name: "Taccuino A5 rilegato a mano" })).toBeVisible();
  });
});
