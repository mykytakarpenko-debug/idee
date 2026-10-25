import { expect, test, type Page } from "@playwright/test";
import {
  addToCart,
  fillCheckout,
  freezeTime,
  loginAsCustomer,
  openPage,
  submitOrder,
  toastText,
} from "./helpers";

test.beforeEach(async ({ page }) => {
  await freezeTime(page);
});

/** Apre la scheda di un ordine dal pannello cercandolo per numero. */
async function openOrderInPanel(page: Page, number: string) {
  await openPage(page, "/gestione/ordini");
  await page.getByRole("searchbox", { name: "Cerca per numero, cliente o email" }).fill(number);
  await page
    .getByRole("button", { name: new RegExp(number) })
    .filter({ visible: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog", { name: `Ordine ${number}` });
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe("acquisto", () => {
  test("dal prodotto all'ordine spedito", async ({ page }) => {
    await addToCart(page, "tazza-alba", /^Sabbia/, 2);
    const drawer = page.getByRole("dialog", { name: "Carrello" });
    await expect(drawer.getByText("Sabbia · 24,00 € cad.")).toBeVisible();
    await expect(drawer.getByText("Ti mancano 21,00 € per la spedizione gratuita.")).toBeVisible();
    await drawer.getByRole("link", { name: "Vai al checkout" }).click();

    await expect(page.getByRole("heading", { level: 1, name: "Checkout" })).toBeVisible();
    await page.getByRole("button", { name: "Ordine con obbligo di pagamento" }).click();
    await expect(page.getByText("Campo obbligatorio").first()).toBeVisible();
    await expect(
      page.getByText("Per inviare l'ordine devi accettare le condizioni di vendita"),
    ).toBeVisible();

    await fillCheckout(page);
    await page.getByLabel("Codice sconto").fill("benvenuto10");
    await page.getByRole("button", { name: "Applica" }).click();
    await expect(page.getByText("Codice BENVENUTO10 applicato").first()).toBeVisible();
    await page.getByRole("radio", { name: /^Espressa/ }).check();
    const summary = page.getByRole("complementary", { name: "Riepilogo dell'ordine" });
    // 48,00 − 4,80 di sconto + 9,90 di espressa.
    await expect(summary.getByText("53,10 €", { exact: true })).toBeVisible();

    const number = await submitOrder(page);
    expect(number).toMatch(/^BT-\d+$/);
    await expect(page.getByRole("heading", { level: 1, name: `Ordine ${number}` })).toBeVisible();
    await expect(page.getByText("Pagato", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Carrello, 0 articoli/ })).toBeVisible();

    const dialog = await openOrderInPanel(page, number);
    await dialog.getByRole("button", { name: "Inizia la preparazione" }).click();
    await expect(toastText(page, "Ordine aggiornato: In preparazione")).toBeVisible();
    await dialog.getByLabel("Codice di tracciamento").fill("123456789IT");
    await dialog.getByRole("button", { name: "Salva e segna come spedito" }).click();
    await expect(dialog.getByText("Spedito", { exact: true }).first()).toBeVisible();
    await expect(dialog.getByText("BRT · 123456789IT")).toBeVisible();
  });

  test("le scorte limitano il carrello e si aggiornano dopo l'ordine", async ({ page }) => {
    await addToCart(page, "diario-viaggio", undefined, 3);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Aggiungi al carrello" }).click();
    await expect(
      toastText(page, "Hai già nel carrello tutta la disponibilità").first(),
    ).toBeVisible();

    await openPage(page, "/checkout");
    await fillCheckout(page);
    await page.getByRole("radio", { name: /^Bonifico bancario/ }).check();
    const number = await submitOrder(page);
    await expect(page.getByText("In attesa di pagamento", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(`causale “${number}”`, { exact: false })).toBeVisible();

    await openPage(page, "/prodotto/diario-viaggio");
    await expect(page.getByRole("button", { name: "Esaurito" })).toBeDisabled();
  });

  test("i codici sconto spiegano perché non valgono", async ({ page }) => {
    await addToCart(page, "quaderno-puntinato");
    await openPage(page, "/carrello");
    const code = page.getByLabel("Codice sconto");
    await code.fill("ESTATE15");
    await page.getByRole("button", { name: "Applica" }).click();
    await expect(page.getByText("Questo codice è scaduto.")).toBeVisible();
    await code.fill("GRAZIE5");
    await page.getByRole("button", { name: "Applica" }).click();
    await expect(page.getByText("Codice valido per ordini da 50,00 €.")).toBeVisible();
    await code.fill("NONESISTE");
    await code.press("Enter");
    await expect(page.getByText("Codice non valido.")).toBeVisible();
    await page.getByRole("button", { name: "Rimuovi Quaderno puntinato, Sabbia" }).click();
    await expect(page.getByText("Il carrello è vuoto")).toBeVisible();
  });
});

test.describe("catalogo", () => {
  test("filtra per categoria e offerte con l'URL condivisibile", async ({ page, isMobile }) => {
    await openPage(page, "/catalogo");
    const filters = isMobile
      ? (await page.getByRole("button", { name: /^Filtri/ }).click(), page.getByRole("dialog"))
      : page.getByRole("complementary", { name: "Filtri" });
    await filters.getByLabel("Categoria").selectOption({ label: "Tessili" });
    await expect(page).toHaveURL(/categoria=tessili/);
    await filters.getByRole("checkbox", { name: "Solo in offerta" }).check();
    await expect(page).toHaveURL(/offerte=1/);
    if (isMobile) await page.getByRole("button", { name: /^Mostra 1 prodotto/ }).click();
    await expect(page.getByText("1 prodotto · 2 filtri attivi")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Tessili" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Canovaccio a righe in lino" })).toBeVisible();

    await openPage(page, "/catalogo?q=zzz");
    await expect(page.getByText("Nessun prodotto trovato")).toBeVisible();
  });

  test("la scheda prodotto cambia variante e immagine", async ({ page }) => {
    await openPage(page, "/prodotto/ciotola-onda");
    await expect(
      page.getByText("Prezzo più basso negli ultimi 30 giorni: 22,00 €").last(),
    ).toBeVisible();
    await page.getByRole("radio", { name: /^Salvia/ }).check({ force: true });
    await expect(page.getByRole("button", { name: "Esaurito" })).toBeDisabled();
    await page.getByRole("button", { name: "Mostra immagine 3 di 3" }).click();
    await expect(page.getByRole("img", { name: "Ciotola Onda, Salvia, ambientato" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Recensioni" })).toBeVisible();
    await expect(page.getByText("Acquisto verificato").first()).toBeVisible();
  });
});

test.describe("area personale e resi", () => {
  test("la cliente chiede un reso e lo studio lo rimborsa", async ({ page }) => {
    await loginAsCustomer(page);
    await openPage(page, "/account");
    await expect(page.getByRole("heading", { level: 1, name: "Ciao, Chiara" })).toBeVisible();
    const returnButton = page.getByRole("button", { name: /^Richiedi un reso/ });
    await expect(returnButton).toHaveCount(1);
    const number = ((await returnButton.textContent()) ?? "").match(/BT-\d+/)?.[0] ?? "";
    await returnButton.click();
    const dialog = page.getByRole("dialog", { name: "Richiedi un reso" });
    await expect(dialog.getByText(/Rimborso stimato/)).toBeVisible();
    await dialog.getByRole("button", { name: "Invia la richiesta di reso" }).click();
    await expect(toastText(page, "Richiesta di reso inviata")).toBeVisible();
    await expect(page.getByText("Reso richiesto", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/Il termine per il recesso è scaduto/)).toBeVisible();

    const order = await openOrderInPanel(page, number);
    await order.getByRole("button", { name: "Approva reso" }).click();
    await expect(toastText(page, "Reso aggiornato: Reso approvato")).toBeVisible();
    await order.getByRole("button", { name: "Segna come rimborsato" }).click();
    await expect(toastText(page, "Reso aggiornato: Rimborsato")).toBeVisible();
  });

  test("aggiorna i dati e scarica una copia (GDPR)", async ({ page }) => {
    await loginAsCustomer(page);
    await openPage(page, "/account");
    await page.getByRole("tab", { name: "Dati e indirizzo" }).click();
    await page.getByLabel("Telefono", { exact: true }).fill("+39 333 000 9999");
    await page.getByRole("button", { name: "Salva modifiche" }).click();
    await expect(toastText(page, "Dati aggiornati")).toBeVisible();
    await page.getByRole("tab", { name: "Privacy" }).click();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Scarica i miei dati" }).click();
    expect((await download).suggestedFilename()).toBe("dati-c_1.json");
  });
});

test.describe("pannello", () => {
  test("una promozione mostra lo sconto calcolato sui 30 giorni", async ({ page }) => {
    await openPage(page, "/gestione/prodotti");
    await page
      .getByRole("button", { name: "Tazza Alba" })
      .filter({ visible: true })
      .first()
      .click();
    const dialog = page.getByRole("dialog", { name: "Modifica prodotto" });
    await dialog.getByLabel(/^Prezzo in offerta/).fill("19");
    await expect(
      dialog.getByText("Prezzo più basso negli ultimi 30 giorni: 24,00 €. Sconto mostrato: −21%."),
    ).toBeVisible();
    await dialog.getByLabel("Offerta dal").fill("2026-10-21");
    await dialog.getByLabel("Offerta al").fill("2026-11-15");
    await dialog.getByRole("button", { name: "Salva modifiche" }).click();
    await expect(toastText(page, "Prodotto aggiornato")).toBeVisible();

    await openPage(page, "/prodotto/tazza-alba");
    await expect(page.getByText("−21%").first()).toBeVisible();
    await expect(page.getByText("19,00 €", { exact: true }).first()).toBeVisible();
  });

  test("crea un prodotto che compare nel negozio", async ({ page }) => {
    await openPage(page, "/gestione/prodotti");
    await page.getByRole("button", { name: "Nuovo prodotto" }).click();
    const dialog = page.getByRole("dialog", { name: "Nuovo prodotto" });
    await dialog.getByRole("button", { name: "Nuovo prodotto" }).click();
    await expect(dialog.getByText("Campo obbligatorio").first()).toBeVisible();
    await dialog.getByLabel("Nome", { exact: true }).fill("Brocca Fonte");
    await dialog.getByLabel("Descrizione breve").fill("Brocca in gres da un litro.");
    await dialog.getByLabel("Descrizione", { exact: true }).fill("Brocca per acqua e fiori.");
    await dialog.getByLabel("Illustrazione").selectOption({ label: "Vaso" });
    await dialog.getByLabel("Prezzo di listino (€)").fill("39");
    await dialog.getByLabel("Nome variante").fill("Avorio");
    await dialog.getByLabel("Pezzi disponibili").fill("4");
    await dialog.getByRole("button", { name: "Nuovo prodotto" }).click();
    await expect(toastText(page, "Prodotto creato")).toBeVisible();

    await openPage(page, "/catalogo?q=brocca");
    await page.getByRole("link", { name: "Brocca Fonte" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Brocca Fonte" })).toBeVisible();
    await expect(page.getByText("39,00 €", { exact: true }).first()).toBeVisible();
  });

  test("un nuovo codice sconto vale subito nel carrello", async ({ page }) => {
    await openPage(page, "/gestione/impostazioni");
    await page.getByLabel("Codice", { exact: true }).fill("prova20");
    await page.getByLabel("Valore").fill("20");
    await page.getByRole("button", { name: "Aggiungi codice" }).click();
    await expect(toastText(page, "Codice aggiunto")).toBeVisible();

    await addToCart(page, "vaso-colle");
    await openPage(page, "/carrello");
    await page.getByLabel("Codice sconto").fill("PROVA20");
    await page.getByRole("button", { name: "Applica" }).click();
    await expect(page.getByText("Codice PROVA20 applicato").first()).toBeVisible();
    await expect(page.getByText("−9,60 €")).toBeVisible();
  });

  test("la commissione cambia l'importo da liquidare", async ({ page }) => {
    await openPage(page, "/gestione/laboratori");
    const field = page.getByLabel("Commissione di Lume Lento (%)");
    await field.fill("80");
    await field.press("Enter");
    await expect(page.getByText("Inserisci un numero tra 0 e 50")).toBeVisible();
    await field.fill("20");
    await field.press("Enter");
    await expect(toastText(page, "Commissione aggiornata")).toBeVisible();
    await expect(page.getByText("Commissione (20%)")).toBeVisible();
  });
});
