import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { FIXED_NOW, login, openPage, panelRoutes, prepare, publicRoutes } from "./helpers";

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
    });

    for (const route of [...publicRoutes, ...panelRoutes]) {
      test(route.path, async ({ page }) => {
        await prepare(page);
        await openPage(page, route.path);
        await expectAccessible(page);
      });
    }

    test("verifica dell'età", async ({ page }) => {
      await page.clock.setFixedTime(FIXED_NOW);
      await page.goto("/");
      await expect(page.getByRole("alertdialog")).toBeVisible();
      await expectAccessible(page);
    });

    test("pagine con accesso", async ({ page }) => {
      await prepare(page);
      await login(page);
      await expectAccessible(page);
      for (const path of ["/gioco-responsabile", "/giochi/frutteto", "/sport"]) {
        await openPage(page, path);
        await expectAccessible(page);
      }
    });

    test("schedina, ricarica e scheda giocatore", async ({ page, isMobile }) => {
      await prepare(page);
      await login(page);
      await page.getByRole("button", { name: "Ricarica" }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expectAccessible(page);
      await page.keyboard.press("Escape");
      await openPage(page, "/sport");
      await page
        .getByRole("group", { name: /1X2|Testa a testa/ })
        .first()
        .getByRole("button")
        .first()
        .click();
      if (isMobile) await page.getByRole("button", { name: /^Apri la schedina/ }).click();
      await expectAccessible(page);
      await openPage(page, "/operatore/giocatori");
      await page.getByRole("table").getByRole("row").nth(1).getByRole("button").click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expectAccessible(page);
    });
  });
}
