import { expect, test } from "@playwright/test";
import {
  freezeTime,
  loginAsMember,
  memberRoutes,
  openPage,
  panelRoutes,
  siteRoutes,
} from "./helpers";

test.beforeEach(async ({ page }) => {
  await freezeTime(page);
  await loginAsMember(page);
});

test.describe("navigazione", () => {
  for (const route of [...siteRoutes, ...memberRoutes, ...panelRoutes]) {
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

  test("palinsesto e dati strutturati nell'HTML iniziale (SEO)", async ({ request }) => {
    const schedule = await (await request.get("/orari")).text();
    expect(schedule).toContain("Functional Training");
    const home = await (await request.get("/")).text();
    expect(home).toContain('"@type":"ExerciseGym"');
  });

  test("area socio e pannello non sono indicizzabili", async ({ page }) => {
    for (const path of ["/gestione", "/area-socio"]) {
      await page.goto(path);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    }
  });

  test("senza accesso l'area socio rimanda al login", async ({ browser }) => {
    const context = await browser.newContext();
    await freezeTime(context);
    const page = await context.newPage();
    await page.goto("/area-socio");
    await expect(page).toHaveURL(/\/accedi$/);
    await page.getByRole("button", { name: "Accedi" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Ciao, Chiara" })).toBeVisible();
    await context.close();
  });

  test("filtra il palinsesto per categoria", async ({ page, isMobile }) => {
    await openPage(page, "/orari");
    await page.getByRole("button", { name: "Cardio" }).click();
    await expect(page.getByRole("button", { name: "Cardio" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const scope = isMobile ? page.getByRole("region", { name: "Mercoledì" }) : page.locator("main");
    await expect(scope.getByText("Yoga Flow")).toHaveCount(0);
  });

  test("cambia tema e lo ricorda", async ({ page }) => {
    await openPage(page, "/");
    await page.getByRole("button", { name: "Cambia tema" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});
