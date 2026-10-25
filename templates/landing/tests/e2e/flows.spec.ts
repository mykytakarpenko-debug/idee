import { expect, test } from "@playwright/test";
import { openPage, prepare, toastText } from "./helpers";

test.describe("banner dei cookie", () => {
  test.beforeEach(async ({ page }) => {
    await prepare(page, { consent: false });
  });

  test("rifiuta con la stessa evidenza di accetta e non ricompare", async ({ page }) => {
    await openPage(page, "/");
    const banner = page.getByRole("region", { name: "Cookie e privacy" });
    await expect(banner).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-consent-statistics", "denied");
    const reject = banner.getByRole("button", { name: "Rifiuta", exact: true });
    const accept = banner.getByRole("button", { name: "Accetta tutti" });
    expect(await reject.getAttribute("class")).toBe(await accept.getAttribute("class"));
    await reject.click();
    await expect(banner).toBeHidden();
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("region", { name: "Cookie e privacy" })).toHaveCount(0);
  });

  test("la X equivale a rifiutare", async ({ page }) => {
    await openPage(page, "/");
    await page.getByRole("button", { name: "Chiudi e rifiuta i cookie non necessari" }).click();
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("vetrina:consent")!));
    expect(stored).toMatchObject({ statistics: false, marketing: false, version: 1 });
  });

  test("accetta tutti attiva le statistiche", async ({ page }) => {
    await openPage(page, "/");
    await page.getByRole("button", { name: "Accetta tutti" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-consent-statistics", "granted");
    await expect(page.locator("html")).toHaveAttribute("data-consent-marketing", "granted");
  });

  test("personalizza per categoria e modifica dal piè di pagina", async ({ page }) => {
    await openPage(page, "/");
    await page.getByRole("button", { name: "Personalizza" }).click();
    const dialog = page.getByRole("dialog", { name: "Preferenze cookie" });
    await dialog.getByRole("switch", { name: "Statistiche" }).click();
    await dialog.getByRole("button", { name: "Salva le scelte" }).click();
    await expect(toastText(page, "Preferenze salvate")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-consent-statistics", "granted");
    await expect(page.locator("html")).toHaveAttribute("data-consent-marketing", "denied");
    await page.getByRole("button", { name: "Preferenze cookie" }).click();
    await expect(dialog.getByRole("switch", { name: "Statistiche" })).toBeChecked();
    await dialog.getByRole("button", { name: "Rifiuta", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-consent-statistics", "denied");
  });
});

test.describe("prezzi", () => {
  test.beforeEach(async ({ page }) => {
    await prepare(page);
    await openPage(page, "/prezzi");
  });

  test("passa da annuale a mensile", async ({ page }) => {
    const team = page
      .getByRole("article")
      .filter({ has: page.getByRole("heading", { name: "Team" }) });
    await expect(team).toContainText("3,20 €");
    await page.getByRole("radio", { name: "Mensile" }).click();
    await expect(team).toContainText("4,00 €");
    await expect(team).toContainText("Fatturazione mensile");
  });

  test("stima il costo con il calcolatore", async ({ page }) => {
    const slider = page.getByRole("slider", { name: /Persone nel team/ });
    await slider.fill("10");
    await expect(page.getByText("Per 10 persone: 384,00 € all'anno (IVA esclusa)")).toBeVisible();
    await expect(page.getByText("Con la fatturazione annuale risparmi 96,00 €")).toBeVisible();
  });

  test("confronta i piani e apre le domande frequenti", async ({ page }) => {
    const row = page.getByRole("row", { name: /Più sedi/ });
    await expect(row.getByText("Incluso", { exact: true })).toHaveCount(1);
    await expect(row.getByText("Non incluso", { exact: true })).toHaveCount(2);
    const question = page.getByText("Serve una carta di credito per la prova?");
    await question.click();
    await expect(page.getByText(/La prova del piano Team dura 30 giorni/)).toBeVisible();
  });

  test("il piano scelto precompila il messaggio", async ({ page }) => {
    await page.getByRole("link", { name: "Prova 30 giorni – Team" }).click();
    await expect(page).toHaveURL(/\/contatti\?piano=team$/);
    await expect(page.getByLabel("Messaggio")).toHaveValue(/piano Team/);
  });
});

test.describe("contatti", () => {
  test.beforeEach(async ({ page }) => {
    await prepare(page);
    await openPage(page, "/contatti");
  });

  test("mostra gli errori e poi invia", async ({ page }) => {
    await page.getByRole("button", { name: "Invia richiesta" }).click();
    await expect(page.getByText("Campo obbligatorio").first()).toBeVisible();
    await expect(page.getByLabel("Nome e cognome")).toBeFocused();
    await page.getByLabel("Nome e cognome").fill("Ada Neri");
    await page.getByLabel("Email di lavoro").fill("ada@");
    await page.getByLabel("Messaggio").fill("Vorrei una demo per tre negozi.");
    await page.getByRole("button", { name: "Invia richiesta" }).click();
    await expect(page.getByText("Inserisci un indirizzo email valido")).toBeVisible();
    await page.getByLabel("Email di lavoro").fill("ada@example.com");
    await page.getByLabel("Persone nel team").selectOption("21-50");
    await page.getByRole("button", { name: "Invia richiesta" }).click();
    await expect(page.getByRole("heading", { name: "Richiesta inviata" })).toBeVisible();
  });

  test("il server rivalida i dati e ignora i bot", async ({ request }, info) => {
    // Indirizzo dedicato: non consuma il limite delle richieste dal browser.
    const headers = { "x-forwarded-for": `198.51.100.${info.project.name === "mobile" ? 2 : 1}` };
    const invalid = await request.post("/api/contatti", {
      headers,
      data: {
        name: "",
        email: "x",
        teamSize: "6-20",
        message: "breve",
        newsletter: false,
        company: "",
        elapsedMs: 5_000,
      },
    });
    expect(invalid.status()).toBe(400);
    const body = await invalid.json();
    expect(Object.keys(body.errors)).toEqual(expect.arrayContaining(["name", "email", "message"]));
    const bot = await request.post("/api/contatti", {
      headers,
      data: { website: "https://spam.example", elapsedMs: 100 },
    });
    expect(bot.status()).toBe(200);
    expect(await bot.json()).toEqual({ ok: true });
  });

  test("limita le richieste ripetute dallo stesso indirizzo", async ({ request }, info) => {
    const headers = { "x-forwarded-for": `203.0.113.${info.project.name === "mobile" ? 2 : 1}` };
    const statuses: number[] = [];
    for (let i = 0; i < 6; i += 1) {
      statuses.push(
        (
          await request.post("/api/contatti", { headers, data: { website: "", elapsedMs: 0 } })
        ).status(),
      );
    }
    expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
  });

  test("il campo trappola non è raggiungibile", async ({ page }) => {
    await expect(page.locator("#website")).toHaveAttribute("tabindex", "-1");
    await expect(page.getByRole("textbox", { name: "Lascia vuoto questo campo" })).toHaveCount(0);
  });
});

test.describe("blog", () => {
  test("dall'elenco all'articolo e agli articoli correlati", async ({ page }) => {
    await prepare(page);
    await openPage(page, "/blog");
    await page
      .getByRole("link", { name: "Ferie estive senza discussioni: un metodo in 4 passi" })
      .click();
    await expect(page.getByRole("heading", { level: 1, name: /Ferie estive/ })).toBeVisible();
    await expect(page.getByText("di Sara Villa")).toBeVisible();
    await page.getByRole("complementary").getByRole("link").first().click();
    await expect(page).toHaveURL(/\/blog\/(turni-piccolo-negozio|timbratura-digitale-privacy)$/);
  });
});
