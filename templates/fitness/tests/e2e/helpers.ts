import { expect, type BrowserContext, type Page } from "@playwright/test";

/**
 * Ora fissa per test deterministici: mercoledì 21 ottobre 2026, 10:00 a Roma.
 * Il club è aperto e ci sono lezioni prenotabili oggi e nei giorni successivi.
 */
export const FIXED_NOW = new Date("2026-10-21T10:00:00+02:00");

export async function freezeTime(target: Page | BrowserContext) {
  await target.clock.setFixedTime(FIXED_NOW);
}

/** Simula l'accesso all'area socio (socio demo). */
export async function loginAsMember(target: Page | BrowserContext) {
  await target.addInitScript(() => {
    localStorage.setItem(
      "forma:session",
      JSON.stringify({ state: { memberId: "m_1" }, version: 0 }),
    );
  });
}

export const siteRoutes = [
  { path: "/", heading: "Allenati con metodo. Senti la differenza." },
  { path: "/corsi", heading: "Corsi" },
  { path: "/orari", heading: "Orari delle lezioni" },
  { path: "/prezzi", heading: "Prezzi" },
  { path: "/prova-gratuita", heading: "Prova gratuita" },
  { path: "/accedi", heading: "Accedi all'area socio" },
  { path: "/privacy", heading: "Informativa privacy" },
] as const;

export const memberRoutes = [
  { path: "/area-socio", heading: "Ciao, Chiara" },
  { path: "/area-socio/prenota", heading: "Prenota una lezione" },
  { path: "/area-socio/abbonamento", heading: "Abbonamento" },
  { path: "/area-socio/profilo", heading: "Profilo" },
] as const;

export const panelRoutes = [
  { path: "/gestione", heading: "Panoramica" },
  { path: "/gestione/iscritti", heading: "Iscritti" },
  { path: "/gestione/lezioni", heading: "Lezioni" },
  { path: "/gestione/check-in", heading: "Check-in" },
  { path: "/gestione/piani", heading: "Piani" },
  { path: "/gestione/impostazioni", heading: "Impostazioni" },
] as const;

/** Apre una pagina e attende che i dati demo siano caricati (niente scheletri). */
export async function openPage(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('[aria-busy="true"]').filter({ visible: true })).toHaveCount(0, {
    timeout: 15_000,
  });
}
