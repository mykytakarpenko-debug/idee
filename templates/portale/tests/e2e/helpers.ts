import { expect, type BrowserContext, type Page } from "@playwright/test";

/** Ora fissa per test deterministici: mercoledì 21 ottobre 2026, 10:00 a Roma. */
export const FIXED_NOW = new Date("2026-10-21T10:00:00+02:00");

export async function freezeTime(target: Page | BrowserContext) {
  await target.clock.setFixedTime(FIXED_NOW);
}

/** Utenti demo (vedi lib/demo/seed.ts). */
export const USERS = {
  clientAdmin: {
    id: "u_giulia",
    email: "giulia.ferri@ferri-arredamenti.example",
    name: "Giulia Ferri",
  },
  member: { id: "u_marco", email: "marco.rossi@ferri-arredamenti.example", name: "Marco Rossi" },
  viewer: { id: "u_anna", email: "anna.galli@ferri-arredamenti.example", name: "Anna Galli" },
  support: { id: "s_luca", email: "luca.ferretti@orbita.example", name: "Luca Ferretti" },
  admin: { id: "s_elisa", email: "elisa.marchi@orbita.example", name: "Elisa Marchi" },
} as const;

/** Sessione già aperta (password + codice verificati) per l'utente indicato. */
export async function loginAs(
  target: Page | BrowserContext,
  userId: string,
  lastActivity = FIXED_NOW.getTime(),
) {
  await target.addInitScript(
    ([id, at]) => {
      if (sessionStorage.getItem("e2e:logged")) return;
      sessionStorage.setItem("e2e:logged", "1");
      localStorage.setItem(
        "portale:session",
        JSON.stringify({
          state: {
            userId: id,
            pendingUserId: null,
            attempts: { failures: 0, lastFailureAt: null },
            lastActivity: at,
            notice: null,
          },
          version: 0,
        }),
      );
    },
    [userId, lastActivity] as const,
  );
}

export const publicRoutes = [
  { path: "/", heading: "Accedi al portale" },
  { path: "/privacy", heading: "Informativa privacy del portale" },
] as const;

export const portalRoutes = [
  { path: "/portale", heading: "Buongiorno, Giulia" },
  { path: "/portale/progetti", heading: "Progetti" },
  { path: "/portale/documenti", heading: "Documenti" },
  { path: "/portale/assistenza", heading: "Assistenza" },
  { path: "/portale/assistenza/t_1", heading: null },
  { path: "/portale/fatture", heading: "Fatture" },
  { path: "/portale/team", heading: "Team" },
  { path: "/portale/sicurezza", heading: "Sicurezza" },
] as const;

export const adminRoutes = [
  { path: "/admin", heading: "Panoramica" },
  { path: "/admin/ticket", heading: "Ticket" },
  { path: "/admin/ticket/t_1", heading: null },
  { path: "/admin/clienti", heading: "Clienti" },
  { path: "/admin/utenti", heading: "Utenti" },
  { path: "/admin/ruoli", heading: "Ruoli e permessi" },
  { path: "/admin/registro", heading: "Registro attività" },
  { path: "/admin/impostazioni", heading: "Impostazioni" },
] as const;

/** Apre una pagina e attende che i dati demo siano caricati (niente scheletri). */
export async function openPage(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('[aria-busy="true"]').filter({ visible: true })).toHaveCount(0, {
    timeout: 15_000,
  });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

/** Testo di una notifica (evita il duplicato nella regione per i lettori di schermo). */
export const toastText = (page: Page, text: string) =>
  page.getByText(text, { exact: true }).first();

/** Primo ticket (dei dati demo) dell'azienda Ferri, con id. */
export async function firstFerriTicketId(page: Page): Promise<string> {
  await openPage(page, "/portale/assistenza");
  await page.getByRole("radio", { name: "Tutti" }).click();
  const href = await page.getByRole("table").getByRole("link").first().getAttribute("href");
  return decodeURIComponent(href!.split("/").pop()!);
}
