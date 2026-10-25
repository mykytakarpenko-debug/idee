import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import {
  addToCart,
  freezeTime,
  loginAsCustomer,
  openPage,
  panelRoutes,
  shopRoutes,
} from "./helpers";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function expectNoViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const summary = results.violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.nodes
        .map((n) => n.target.join(" "))
        .slice(0, 3)
        .join(" | ")}`,
  );
  expect(summary).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await freezeTime(page);
  await loginAsCustomer(page);
});

for (const scheme of ["light", "dark"] as const) {
  test.describe(`accessibilità (${scheme})`, () => {
    test.use({ colorScheme: scheme });

    for (const { path } of [...shopRoutes, { path: "/account" }, ...panelRoutes]) {
      test(`${path} senza violazioni WCAG 2.2 AA`, async ({ page }) => {
        await openPage(page, path);
        await expectNoViolations(page);
      });
    }

    test("carrello aperto, checkout con errori e ordine senza violazioni", async ({ page }) => {
      await addToCart(page, "ciotola-onda");
      await page.waitForTimeout(300);
      await expectNoViolations(page);
      await openPage(page, "/checkout");
      await page.getByRole("button", { name: "Ordine con obbligo di pagamento" }).click();
      // I dati della cliente sono precompilati: resta l'errore sulle condizioni di vendita.
      await expect(
        page.getByText("Per inviare l'ordine devi accettare le condizioni di vendita"),
      ).toBeVisible();
      await expectNoViolations(page);
    });

    test("schede del pannello senza violazioni", async ({ page }) => {
      await openPage(page, "/gestione/ordini");
      await page.locator("main :is(table, ul) button").filter({ visible: true }).first().click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.waitForTimeout(300);
      await expectNoViolations(page);
      await page.keyboard.press("Escape");
      await openPage(page, "/gestione/prodotti");
      await page.getByRole("button", { name: "Nuovo prodotto" }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.waitForTimeout(300);
      await expectNoViolations(page);
    });
  });
}

test("rispetta prefers-reduced-motion", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await openPage(page, "/gestione");
  const duration = await page
    .locator("main > div")
    .first()
    .evaluate((el) => getComputedStyle(el).animationDuration);
  expect(Number.parseFloat(duration)).toBeLessThan(0.01);
  await context.close();
});
