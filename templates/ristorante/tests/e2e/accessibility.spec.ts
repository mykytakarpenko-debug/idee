import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { freezeTime, openPage, panelRoutes, siteRoutes } from "./helpers";

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
});

for (const scheme of ["light", "dark"] as const) {
  test.describe(`accessibilità (${scheme})`, () => {
    test.use({ colorScheme: scheme });

    for (const { path } of [...siteRoutes, ...panelRoutes, { path: "/ordina/checkout" }]) {
      test(`${path} senza violazioni WCAG 2.2 AA`, async ({ page }) => {
        await openPage(page, path);
        await expectNoViolations(page);
      });
    }

    test("modale prenotazione del pannello senza violazioni", async ({ page }) => {
      await openPage(page, "/gestione");
      await page.getByRole("button", { name: "Nuova prenotazione" }).first().click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.waitForTimeout(300);
      await expectNoViolations(page);
    });

    test("tracking ordine senza violazioni", async ({ page }) => {
      await openPage(page, "/gestione/ordini");
      const number = await page
        .getByText(/^#\d+$/)
        .first()
        .textContent();
      await openPage(page, `/ordine/${number?.replace("#", "")}`);
      await expect(page.getByRole("heading", { level: 1 })).toContainText("Ordine n.");
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
