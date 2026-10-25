import { expect, type Page } from "@playwright/test";

/** Ora fissa per test deterministici: mercoledì 21 ottobre 2026, 10:00 a Roma. */
export const FIXED_NOW = new Date("2026-10-21T10:00:00+02:00");

/** Ora fissa e maggiore età già confermata. */
export async function prepare(
  page: Page,
  { clock = "fixed" }: { clock?: "fixed" | "install" } = {},
) {
  if (clock === "fixed") await page.clock.setFixedTime(FIXED_NOW);
  else await page.clock.install({ time: FIXED_NOW });
  await page.addInitScript(() => localStorage.setItem("arena:age", "1"));
}

export const publicRoutes = [
  { path: "/", heading: "Gioca solo se ti diverte. Con limiti che decidi tu." },
  { path: "/sport", heading: "Scommesse sportive" },
  { path: "/giochi", heading: "Giochi" },
  { path: "/giochi/frutteto", heading: "Frutteto" },
  { path: "/giochi/sette-doro", heading: "Sette d'oro" },
  { path: "/gioco-responsabile", heading: "Gioco responsabile" },
  { path: "/regole", heading: "Regole e probabilità di vincita" },
  { path: "/termini", heading: "Termini e condizioni del conto di gioco" },
  { path: "/privacy", heading: "Informativa privacy" },
  { path: "/accedi", heading: "Accedi" },
  { path: "/registrazione", heading: "Apri un conto di gioco" },
  { path: "/minori", heading: "Questo sito non è per te" },
] as const;

export const panelRoutes = [
  { path: "/operatore", heading: "Panoramica" },
  { path: "/operatore/giocatori", heading: "Giocatori" },
  { path: "/operatore/eventi", heading: "Eventi" },
] as const;

/** Apre una pagina e attende che i dati demo siano caricati (niente scheletri). */
export async function openPage(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('[aria-busy="true"]').filter({ visible: true })).toHaveCount(0, {
    timeout: 15_000,
  });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

/** Accesso con il conto demo (credenziali già inserite). */
export async function login(page: Page) {
  await openPage(page, "/accedi");
  await page.getByRole("button", { name: "Accedi", exact: true }).click();
  await expect(page).toHaveURL(/\/conto$/);
  await expect(page.getByRole("heading", { level: 1, name: "Il mio conto" })).toBeVisible();
}

/** Testo di una notifica (evita il duplicato nella regione per i lettori di schermo). */
export const toastText = (page: Page, text: string | RegExp) =>
  page.getByText(text, typeof text === "string" ? { exact: true } : undefined).first();

/** Schedina visibile: laterale su desktop, in un pannello su mobile. */
export async function slip(page: Page, isMobile: boolean) {
  if (isMobile) {
    await page.getByRole("button", { name: /^Apri la schedina/ }).click();
    return page.getByRole("dialog");
  }
  return page.getByRole("complementary");
}
