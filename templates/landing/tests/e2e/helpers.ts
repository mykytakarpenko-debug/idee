import { expect, type Page } from "@playwright/test";

export const FIXED_NOW = new Date("2026-10-21T10:00:00+02:00");

/** Ora fissa; con `consent` simula una scelta già fatta (niente banner). */
export async function prepare(page: Page, { consent = true }: { consent?: boolean } = {}) {
  await page.clock.setFixedTime(FIXED_NOW);
  if (consent) {
    await page.addInitScript(() =>
      localStorage.setItem(
        "vetrina:consent",
        JSON.stringify({
          version: 1,
          date: new Date().toISOString(),
          statistics: false,
          marketing: false,
        }),
      ),
    );
  }
}

export const routesToCheck = [
  { path: "/", heading: "I turni del tuo team, senza fogli di calcolo." },
  { path: "/funzionalita", heading: "Funzionalità" },
  { path: "/prezzi", heading: "Prezzi" },
  { path: "/chi-siamo", heading: "Chi siamo" },
  { path: "/blog", heading: "Blog" },
  {
    path: "/blog/turni-piccolo-negozio",
    heading: "Come organizzare i turni in un piccolo negozio",
  },
  { path: "/contatti", heading: "Contatti" },
  { path: "/privacy", heading: "Informativa privacy" },
  { path: "/cookie", heading: "Cookie policy" },
  { path: "/termini", heading: "Termini di servizio" },
] as const;

export async function openPage(page: Page, path: string) {
  await page.goto(path);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

export const toastText = (page: Page, text: string) =>
  page.getByText(text, { exact: true }).first();
