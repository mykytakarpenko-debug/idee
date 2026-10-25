import { expect, test } from "@playwright/test";
import { openPage, prepare, routesToCheck } from "./helpers";

test.beforeEach(async ({ page }) => {
  await prepare(page);
});

for (const route of routesToCheck) {
  test(`${route.path} mostra il titolo`, async ({ page }) => {
    await openPage(page, route.path);
    await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible();
  });
}

test("la navigazione principale porta alle pagine", async ({ page, isMobile }) => {
  await openPage(page, "/");
  if (isMobile) {
    await page.getByRole("button", { name: "Apri il menu" }).click();
    await page.getByRole("dialog").getByRole("link", { name: "Prezzi" }).click();
  } else {
    await page
      .getByRole("navigation", { name: "Navigazione principale" })
      .getByRole("link", { name: "Prezzi" })
      .click();
  }
  await expect(page).toHaveURL(/\/prezzi$/);
});

test("404 con link alla home", async ({ page }) => {
  const response = await page.goto("/pagina-inesistente");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("link", { name: "Torna alla home" })).toBeVisible();
});

test.describe("SEO", () => {
  test("metadati, canonical, Open Graph e dati strutturati", async ({ page }) => {
    await page.goto("/prezzi");
    await expect(page).toHaveTitle("Prezzi · Quadrante");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/prezzi$/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /og\.png$/);
    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    const types = jsonLd.map((text) => JSON.parse(text)["@type"]);
    expect(types).toEqual(expect.arrayContaining(["SoftwareApplication", "FAQPage"]));
  });

  test("articolo con BlogPosting nell'HTML statico", async ({ request }) => {
    const html = await (await request.get("/blog/ferie-estive-metodo")).text();
    expect(html).toContain('"@type":"BlogPosting"');
    expect(html).toContain("Ferie estive senza discussioni");
  });

  test("sitemap e robots", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/blog/timbratura-digitale-privacy");
    expect(sitemap).toContain("/prezzi");
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Sitemap:");
    expect(robots).toContain("Disallow: /api/");
  });
});

test("gli accenti alternativi ridefiniscono i token in entrambi i temi", async ({ page }) => {
  await openPage(page, "/");
  const accent = () =>
    page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--accent").trim(),
    );
  expect(await accent()).toBe("#6d28d9");
  await page.evaluate(() => document.documentElement.setAttribute("data-accent", "verde"));
  expect(await accent()).toBe("#0f766e");
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  const text = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--accent-text").trim(),
  );
  expect(text).toBe("#5eead4");
});
