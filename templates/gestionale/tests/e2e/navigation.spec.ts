import { expect, test } from "@playwright/test";
import { appRoutes, openPage } from "./helpers";

test.describe("navigazione", () => {
  for (const route of appRoutes) {
    test(`apre ${route.path}`, async ({ page }) => {
      await openPage(page, route.path);
      await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible();
    });
  }

  test("la radice porta alla dashboard", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("mostra la pagina 404", async ({ page }) => {
    const response = await page.goto("/pagina-inesistente");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Pagina non trovata" })).toBeVisible();
  });

  test("ricerca rapida con tastiera", async ({ page, isMobile }) => {
    test.skip(isMobile, "Scorciatoia da tastiera solo su desktop");
    await openPage(page, "/dashboard");
    await page.keyboard.press("ControlOrMeta+k");
    const input = page.getByPlaceholder("Cerca un cliente o digita un comando…");
    await expect(input).toBeVisible();
    await input.fill("Report");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/report$/);
  });

  test("cambia tema dal menu utente", async ({ page }) => {
    await openPage(page, "/dashboard");
    await page.getByRole("button", { name: "Account" }).click();
    await page.getByRole("menuitemradio", { name: "Scuro" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});
