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

  test("il menu è nell'HTML iniziale (SEO) con i dati strutturati", async ({ request }) => {
    const menu = await (await request.get("/menu")).text();
    expect(menu).toContain("Tagliatelle al ragù");
    const home = await (await request.get("/")).text();
    expect(home).toContain('"@type":"Restaurant"');
  });

  test("il pannello non è indicizzabile", async ({ page }) => {
    await page.goto("/gestione");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("filtra il menu per dieta e allergeni", async ({ page }) => {
    await openPage(page, "/menu");
    const count = page.getByText(/^\d+ piatti$/);
    await expect(count).toHaveText("30 piatti");
    await page.getByRole("button", { name: "Vegano" }).click();
    await expect(page.getByRole("button", { name: "Vegano" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(count).not.toHaveText("30 piatti");
    await expect(page.getByRole("heading", { name: "Tagliatelle al ragù" })).toHaveCount(0);
  });

  test("cambia tema e lo ricorda", async ({ page }) => {
    await openPage(page, "/");
    await page.getByRole("button", { name: "Cambia tema" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});
