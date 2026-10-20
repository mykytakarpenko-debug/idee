import { expect, type Page } from "@playwright/test";

/** Rotte principali dell'area riservata con il titolo atteso. */
export const appRoutes = [
  { path: "/dashboard", heading: /Buongiorno|Buon pomeriggio|Buonasera/ },
  { path: "/appuntamenti", heading: "Appuntamenti" },
  { path: "/calendario", heading: "Calendario" },
  { path: "/clienti", heading: "Clienti" },
  { path: "/servizi", heading: "Servizi" },
  { path: "/pagamenti", heading: "Pagamenti" },
  { path: "/report", heading: "Report" },
  { path: "/impostazioni", heading: "Impostazioni" },
] as const;

/** Apre una pagina e attende che i dati demo siano caricati (niente scheletri). */
export async function openPage(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('[aria-busy="true"]').filter({ visible: true })).toHaveCount(0, {
    timeout: 15_000,
  });
}
