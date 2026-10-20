import { expect, type BrowserContext, type Page } from "@playwright/test";

/**
 * Ora fissa per test deterministici: mercoledì 21 ottobre 2026, 10:00 a Roma.
 * Con l'anticipo minimo di 12 ore, il primo giorno prenotabile è giovedì 22.
 */
export const FIXED_NOW = new Date("2026-10-21T10:00:00+02:00");

export async function freezeTime(target: Page | BrowserContext) {
  await target.clock.setFixedTime(FIXED_NOW);
}

export const siteRoutes = [
  { path: "/", heading: "Studio Delta" },
  { path: "/prenota", heading: "Prenota un appuntamento" },
  { path: "/prenotazione", heading: "La mia prenotazione" },
  { path: "/privacy", heading: "Informativa privacy" },
  { path: "/widget", heading: "Prenota · Studio Delta" },
] as const;

export const panelRoutes = [
  { path: "/gestione", heading: "Agenda" },
  { path: "/gestione/disponibilita", heading: "Disponibilità" },
  { path: "/gestione/servizi", heading: "Servizi" },
  { path: "/gestione/impostazioni", heading: "Impostazioni" },
] as const;

/** Apre una pagina e attende che i dati demo siano caricati (niente scheletri). */
export async function openPage(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('[aria-busy="true"]').filter({ visible: true })).toHaveCount(0, {
    timeout: 15_000,
  });
}

export const customer = {
  name: "Marta Bianchi",
  email: "marta@example.com",
  phone: "+39 333 000 1111",
};

/** Sceglie un servizio nella prenotazione e prosegue al passo successivo. */
export async function pickService(page: Page, name: RegExp) {
  await page.getByRole("radio", { name }).check();
  await page.getByRole("button", { name: "Continua" }).click();
}

/** Compila i dati del cliente e invia. */
export async function fillDetails(page: Page, submit: string) {
  await page.getByLabel("Nome e cognome").fill(customer.name);
  await page.getByLabel("Email").fill(customer.email);
  await page.getByLabel("Telefono").fill(customer.phone);
  await page.getByRole("checkbox", { name: /informativa privacy/ }).check();
  await page.getByRole("button", { name: submit }).click();
}

/** Orari proposti nel giorno selezionato. */
export const slotGroup = (page: Page) => page.getByRole("radiogroup", { name: /^Orari di/ });

/** Codice della prenotazione mostrato nella conferma. */
export async function confirmationCode(page: Page): Promise<string> {
  const text = await page.getByText(/^AG-[A-Z0-9]{6}$/).textContent();
  return (text ?? "").trim();
}
