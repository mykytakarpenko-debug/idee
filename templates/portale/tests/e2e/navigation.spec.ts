import { expect, test } from "@playwright/test";
import {
  adminRoutes,
  freezeTime,
  loginAs,
  openPage,
  portalRoutes,
  publicRoutes,
  USERS,
} from "./helpers";

test.beforeEach(async ({ page }) => {
  await freezeTime(page);
});

test.describe("pagine pubbliche", () => {
  for (const route of publicRoutes) {
    test(`${route.path} mostra il titolo`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible();
    });
  }

  test("robots blocca tutto e le pagine non sono indicizzabili", async ({ page, request }) => {
    const robots = await request.get("/robots.txt");
    expect(await robots.text()).toContain("Disallow: /");
    await page.goto("/");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("senza accesso il portale rimanda al login", async ({ page }) => {
    await page.goto("/portale/fatture");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Accedi al portale" })).toBeVisible();
  });
});

test.describe("portale clienti", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.clientAdmin.id);
  });

  for (const route of portalRoutes) {
    test(`${route.path} si apre`, async ({ page }) => {
      await openPage(page, route.path);
      if (route.heading) {
        await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible();
      }
    });
  }

  test("l'area admin non è accessibile a un cliente", async ({ page }) => {
    await openPage(page, "/admin/utenti");
    await expect(
      page.getByRole("heading", { level: 1, name: "Accesso non consentito" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Torna alla tua area" }).click();
    await expect(page).toHaveURL(/\/portale$/);
  });

  test("la navigazione segna la pagina corrente", async ({ page, isMobile }) => {
    test.skip(isMobile, "La barra laterale è visibile da tablet in su");
    await openPage(page, "/portale/documenti");
    await expect(
      page
        .getByRole("navigation", { name: "Navigazione dell'area" })
        .getByRole("link", { name: "Documenti" }),
    ).toHaveAttribute("aria-current", "page");
  });
});

test.describe("permessi per ruolo", () => {
  test("il membro non vede le fatture", async ({ page, isMobile }) => {
    await loginAs(page, USERS.member.id);
    await openPage(page, "/portale");
    if (!isMobile) {
      const nav = page.getByRole("navigation", { name: "Navigazione dell'area" });
      await expect(nav.getByRole("link", { name: "Assistenza" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Fatture" })).toHaveCount(0);
    }
    await expect(page.getByText("Da pagare")).toHaveCount(0);
    await openPage(page, "/portale/fatture");
    await expect(
      page.getByRole("heading", { level: 1, name: "Accesso non consentito" }),
    ).toBeVisible();
  });

  test("la sola lettura non apre ticket né carica documenti", async ({ page }) => {
    await loginAs(page, USERS.viewer.id);
    await openPage(page, "/portale/assistenza");
    await expect(page.getByRole("button", { name: "Nuovo ticket" })).toHaveCount(0);
    await openPage(page, "/portale/documenti");
    await expect(page.getByRole("button", { name: "Carica documento" })).toHaveCount(0);
    await openPage(page, "/portale/team");
    await expect(page.getByRole("button", { name: "Invita utente" })).toHaveCount(0);
  });

  test("il supporto non vede registro e impostazioni", async ({ page }) => {
    await loginAs(page, USERS.support.id);
    await openPage(page, "/admin/ticket");
    await expect(page.getByRole("heading", { level: 1, name: "Ticket" })).toBeVisible();
    await openPage(page, "/admin/registro");
    await expect(
      page.getByRole("heading", { level: 1, name: "Accesso non consentito" }),
    ).toBeVisible();
    await openPage(page, "/portale");
    await expect(
      page.getByRole("heading", { level: 1, name: "Accesso non consentito" }),
    ).toBeVisible();
  });
});

test.describe("area amministrativa", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.admin.id);
  });

  for (const route of adminRoutes) {
    test(`${route.path} si apre`, async ({ page }) => {
      await openPage(page, route.path);
      if (route.heading) {
        await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible();
      }
    });
  }

  test("la matrice dei ruoli annuncia i permessi", async ({ page }) => {
    await openPage(page, "/admin/ruoli");
    const row = page.getByRole("row", { name: /Consultare il registro attività/ });
    await expect(row.getByText("Consentito", { exact: true })).toHaveCount(1);
    await expect(row.getByText("Non consentito", { exact: true })).toHaveCount(4);
  });
});
