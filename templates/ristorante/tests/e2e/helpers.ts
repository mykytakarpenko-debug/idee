import { expect, type BrowserContext, type Page } from "@playwright/test";

/**
 * Ora fissa per test deterministici: mercoledì 21 ottobre 2026, 12:00 a Roma.
 * Il locale demo apre a pranzo alle 12:30, quindi si può ordinare e prenotare.
 */
export const FIXED_NOW = new Date("2026-10-21T12:00:00+02:00");

export async function freezeTime(target: Page | BrowserContext) {
  await target.clock.setFixedTime(FIXED_NOW);
}

/** Pagine pubbliche con il titolo atteso. */
export const siteRoutes = [
  { path: "/", heading: "Osteria Lume" },
  { path: "/menu", heading: "Menu" },
  { path: "/prenota", heading: "Prenota un tavolo" },
  { path: "/ordina", heading: "Ordina online" },
  { path: "/privacy", heading: "Informativa privacy" },
] as const;

/** Pagine del pannello di gestione. */
export const panelRoutes = [
  { path: "/gestione", heading: "Oggi in osteria" },
  { path: "/gestione/prenotazioni", heading: "Prenotazioni" },
  { path: "/gestione/sala", heading: "Sala" },
  { path: "/gestione/ordini", heading: "Ordini" },
  { path: "/gestione/menu", heading: "Menu" },
  { path: "/gestione/impostazioni", heading: "Impostazioni" },
] as const;

/** Apre una pagina e attende che i dati demo siano caricati (niente scheletri). */
export async function openPage(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('[aria-busy="true"]').filter({ visible: true })).toHaveCount(0, {
    timeout: 15_000,
  });
}
