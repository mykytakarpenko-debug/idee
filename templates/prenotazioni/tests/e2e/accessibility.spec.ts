import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { freezeTime, openPage, panelRoutes, pickService, siteRoutes, slotGroup } from "./helpers";

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

    for (const { path } of [...siteRoutes, ...panelRoutes]) {
      test(`${path} senza violazioni WCAG 2.2 AA`, async ({ page }) => {
        await openPage(page, path);
        await expectNoViolations(page);
      });
    }

    test("passaggi della prenotazione senza violazioni", async ({ page }) => {
      await openPage(page, "/prenota");
      await pickService(page, /Dichiarazione dei redditi/);
      await expectNoViolations(page);
      await page.getByRole("radio", { name: /In studio/ }).check();
      await page.getByRole("button", { name: "Continua" }).click();
      await slotGroup(page).getByRole("radio").first().click();
      await expectNoViolations(page);
      await page.getByRole("button", { name: "Continua" }).click();
      await page.getByRole("button", { name: "Conferma prenotazione" }).click();
      await expect(page.getByText("Campo obbligatorio").first()).toBeVisible();
      await expectNoViolations(page);
    });

    test("dettaglio appuntamento e modulo servizio senza violazioni", async ({ page }) => {
      await openPage(page, "/gestione");
      await page
        .getByRole("button", { name: /^Dettagli/ })
        .first()
        .click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.waitForTimeout(300);
      await expectNoViolations(page);
      await page.keyboard.press("Escape");
      await openPage(page, "/gestione/servizi");
      await page.getByRole("button", { name: "Nuovo servizio" }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.waitForTimeout(300);
      await expectNoViolations(page);
    });
  });
}

test("la prenotazione si completa da tastiera", async ({ page, isMobile }) => {
  test.skip(isMobile, "solo desktop");
  await openPage(page, "/prenota");
  // Il primo servizio si seleziona con le frecce dal gruppo di scelte.
  await page.getByRole("radio", { name: /Prima consulenza conoscitiva/ }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("radio", { name: /Dichiarazione dei redditi/ })).toBeChecked();
  await page.getByRole("button", { name: "Continua" }).focus();
  await page.keyboard.press("Enter");
  // Il focus passa al titolo del passaggio per i lettori di schermo.
  await expect(page.getByRole("heading", { level: 2, name: "Con chi e come?" })).toBeFocused();
});

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
