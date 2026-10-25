import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { openPage, prepare, routesToCheck } from "./helpers";

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

    for (const route of routesToCheck) {
      test(route.path, async ({ page }) => {
        await prepare(page);
        await openPage(page, route.path);
        await expectAccessible(page);
      });
    }

    test("banner e preferenze dei cookie", async ({ page }) => {
      await prepare(page, { consent: false });
      await openPage(page, "/");
      await expect(page.getByRole("region", { name: "Cookie e privacy" })).toBeVisible();
      await expectAccessible(page);
      await page.getByRole("button", { name: "Personalizza" }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expectAccessible(page);
    });

    test("modulo contatti con errori", async ({ page }) => {
      await prepare(page);
      await openPage(page, "/contatti");
      await page.getByRole("button", { name: "Invia richiesta" }).click();
      await expect(page.getByText("Campo obbligatorio").first()).toBeVisible();
      await expectAccessible(page);
    });
  });
}
