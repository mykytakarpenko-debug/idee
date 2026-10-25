import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import {
  adminRoutes,
  firstFerriTicketId,
  freezeTime,
  loginAs,
  openPage,
  portalRoutes,
  publicRoutes,
  USERS,
} from "./helpers";

/** Controllo WCAG 2.2 AA con axe-core, in tema chiaro e scuro. */
async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const summary = results.violations.map(
    (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
  );
  expect(summary).toEqual([]);
}

for (const scheme of ["light", "dark"] as const) {
  test.describe(`accessibilità (${scheme})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
      await freezeTime(page);
    });

    for (const route of publicRoutes) {
      test(`${route.path}`, async ({ page }) => {
        await page.goto(route.path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expectAccessible(page);
      });
    }

    test("verifica del codice", async ({ page }) => {
      await page.goto("/");
      await page.getByRole("button", { name: /Amministratore cliente/ }).click();
      await page.getByRole("button", { name: "Continua" }).click();
      await page.getByLabel("Codice di verifica").fill("1");
      await page.getByRole("button", { name: "Verifica e accedi" }).click();
      await expect(page.locator('p[role="alert"]')).toBeVisible();
      await expectAccessible(page);
    });

    for (const route of portalRoutes) {
      test(`portale ${route.path}`, async ({ page }) => {
        await loginAs(page, USERS.clientAdmin.id);
        await openPage(page, route.path);
        await expectAccessible(page);
      });
    }

    for (const route of adminRoutes) {
      test(`admin ${route.path}`, async ({ page }) => {
        await loginAs(page, USERS.admin.id);
        await openPage(page, route.path);
        await expectAccessible(page);
      });
    }

    test("dettaglio ticket con note interne (staff)", async ({ page }) => {
      await loginAs(page, USERS.clientAdmin.id);
      const id = await firstFerriTicketId(page);
      await page.evaluate((at) => {
        const raw = JSON.parse(localStorage.getItem("portale:session")!);
        raw.state.userId = "s_luca";
        raw.state.lastActivity = at;
        localStorage.setItem("portale:session", JSON.stringify(raw));
      }, Date.now());
      await openPage(page, `/admin/ticket/${id}`);
      await expectAccessible(page);
    });

    test("finestre di dialogo", async ({ page }) => {
      await loginAs(page, USERS.clientAdmin.id);
      await openPage(page, "/portale/assistenza");
      await page.getByRole("button", { name: "Nuovo ticket" }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Nuovo ticket" }).click();
      await expect(page.getByRole("dialog").getByText("Campo obbligatorio").first()).toBeVisible();
      await expectAccessible(page);
      await page.keyboard.press("Escape");

      await openPage(page, "/portale/team");
      await page.getByRole("button", { name: "Invita utente" }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expectAccessible(page);
    });

    test("scheda cliente (admin)", async ({ page }) => {
      await loginAs(page, USERS.admin.id);
      await openPage(page, "/admin/clienti");
      await page.getByRole("button", { name: "Lumen Ottica S.r.l." }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expectAccessible(page);
    });
  });
}
