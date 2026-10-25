import { expect, type BrowserContext, type Page } from "@playwright/test";

/** Ora fissa per test deterministici: mercoledì 21 ottobre 2026, 10:00 a Roma. */
export const FIXED_NOW = new Date("2026-10-21T10:00:00+02:00");

export async function freezeTime(target: Page | BrowserContext) {
  await target.clock.setFixedTime(FIXED_NOW);
}

/** Accesso come cliente demo (Chiara Benassi). */
export async function loginAsCustomer(target: Page | BrowserContext) {
  await target.addInitScript(() => {
    localStorage.setItem(
      "bottega:session",
      JSON.stringify({ state: { customerId: "c_1" }, version: 0 }),
    );
  });
}

export const shopRoutes = [
  { path: "/", heading: "Oggetti di tutti i giorni, fatti per durare." },
  { path: "/catalogo", heading: "Negozio" },
  { path: "/prodotto/tazza-alba", heading: "Tazza Alba" },
  { path: "/laboratori", heading: "I laboratori" },
  { path: "/laboratori/argilla-lenta", heading: "Argilla Lenta" },
  { path: "/carrello", heading: "Carrello" },
  { path: "/checkout", heading: "Checkout" },
  { path: "/accedi", heading: "Accedi" },
  { path: "/condizioni-di-vendita", heading: "Condizioni di vendita" },
  { path: "/recesso", heading: "Diritto di recesso" },
  { path: "/spedizioni", heading: "Spedizioni e resi" },
  { path: "/privacy", heading: "Informativa privacy" },
] as const;

export const panelRoutes = [
  { path: "/gestione", heading: "Panoramica" },
  { path: "/gestione/ordini", heading: "Ordini" },
  { path: "/gestione/prodotti", heading: "Prodotti" },
  { path: "/gestione/clienti", heading: "Clienti" },
  { path: "/gestione/laboratori", heading: "Laboratori" },
  { path: "/gestione/impostazioni", heading: "Impostazioni" },
] as const;

/** Apre una pagina e attende che i dati demo siano caricati (niente scheletri). */
export async function openPage(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('[aria-busy="true"]').filter({ visible: true })).toHaveCount(0, {
    timeout: 15_000,
  });
}

/** Testo di una notifica (evita il duplicato nella regione per i lettori di schermo). */
export const toastText = (page: Page, text: string) => page.getByText(text, { exact: true });

/** Aggiunge al carrello la variante indicata dalla scheda prodotto. */
export async function addToCart(page: Page, slug: string, variant?: RegExp, quantity = 1) {
  await openPage(page, `/prodotto/${slug}`);
  if (variant) await page.getByRole("radio", { name: variant }).check({ force: true });
  if (quantity > 1) {
    await page.getByRole("spinbutton", { name: "Quantità" }).fill(String(quantity));
  }
  await page.getByRole("button", { name: "Aggiungi al carrello" }).click();
  await expect(page.getByRole("dialog", { name: "Carrello" })).toBeVisible();
}

export const customer = {
  email: "marta@example.com",
  name: "Marta Bianchi",
  street: "Via dell'Esempio 3",
  postalCode: "40121",
  city: "Bologna",
  province: "BO",
  phone: "+39 333 000 1111",
};

/** Compila i dati di consegna del checkout. */
export async function fillCheckout(page: Page) {
  await page.getByLabel("Email", { exact: true }).fill(customer.email);
  await page.getByLabel("Nome e cognome").fill(customer.name);
  await page.getByLabel("Indirizzo e numero civico").fill(customer.street);
  await page.getByLabel("CAP", { exact: true }).fill(customer.postalCode);
  await page.getByLabel("Città", { exact: true }).fill(customer.city);
  await page.getByLabel("Provincia", { exact: true }).fill(customer.province);
  await page.getByLabel("Telefono", { exact: true }).fill(customer.phone);
}

/** Invia l'ordine e restituisce il numero dalla pagina di conferma. */
export async function submitOrder(page: Page): Promise<string> {
  await page.getByRole("checkbox", { name: /condizioni di vendita/ }).check();
  await page.getByRole("button", { name: "Ordine con obbligo di pagamento" }).click();
  await expect(page.getByText("Grazie per il tuo ordine!")).toBeVisible();
  const match = /\/ordine\/(BT-\d+)/.exec(page.url());
  return match?.[1] ?? "";
}
