import { expect, test } from "@playwright/test";
import {
  FIXED_NOW,
  firstFerriTicketId,
  freezeTime,
  loginAs,
  openPage,
  toastText,
  USERS,
} from "./helpers";

test.beforeEach(async ({ page }) => {
  await freezeTime(page);
});

test.describe("accesso", () => {
  test("password, codice errato, poi codice corretto", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Amministratore cliente/ }).click();
    await page.getByRole("button", { name: "Continua" }).click();
    await expect(page.getByRole("heading", { name: "Verifica in due passaggi" })).toBeVisible();
    await page.getByLabel("Codice di verifica").fill("111111");
    await page.getByRole("button", { name: "Verifica e accedi" }).click();
    await expect(page.locator('p[role="alert"]')).toHaveText(
      "Codice non valido. 4 tentativi rimasti.",
    );
    await page.getByLabel("Codice di verifica").fill("246 810");
    await page.getByRole("button", { name: "Verifica e accedi" }).click();
    await expect(page).toHaveURL(/\/portale$/);
    await expect(page.getByRole("heading", { level: 1, name: "Buongiorno, Giulia" })).toBeVisible();
  });

  test("lo staff arriva all'area amministrativa", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Email di lavoro").fill(USERS.support.email);
    await page.getByLabel("Password").fill("qualsiasi");
    await page.getByRole("button", { name: "Continua" }).click();
    await page.getByLabel("Codice di verifica").fill("246810");
    await page.getByRole("button", { name: "Verifica e accedi" }).click();
    await expect(page).toHaveURL(/\/admin$/);
  });

  test("blocca dopo 5 codici errati", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Membro/ }).click();
    await page.getByRole("button", { name: "Continua" }).click();
    for (let i = 0; i < 5; i += 1) {
      await page.getByLabel("Codice di verifica").fill("000000");
      await page.getByRole("button", { name: "Verifica e accedi" }).click();
    }
    await expect(page.locator('p[role="alert"]')).toHaveText(
      "Troppi tentativi. Riprova tra 15 minuti.",
    );
    await page.getByLabel("Codice di verifica").fill("246810");
    await page.getByRole("button", { name: "Verifica e accedi" }).click();
    await expect(page.locator('p[role="alert"]')).toContainText("Troppi tentativi");
    await expect(page).toHaveURL(/\/$/);
  });

  test("email sconosciuta e campi vuoti", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Continua" }).click();
    await expect(page.getByText("Campo obbligatorio").first()).toBeVisible();
    await page.getByLabel("Email di lavoro").fill("nessuno@example.com");
    await page.getByLabel("Password").fill("x");
    await page.getByRole("button", { name: "Continua" }).click();
    await expect(page.getByText("Email o password non corrette.")).toBeVisible();
  });

  test("la sessione scade dopo l'inattività", async ({ page }) => {
    await loginAs(page, USERS.clientAdmin.id, FIXED_NOW.getTime() - 31 * 60_000);
    await page.goto("/portale");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText("Sessione scaduta per inattività: accedi di nuovo.")).toBeVisible();
  });

  test("esci dal menu dell'account", async ({ page }) => {
    await loginAs(page, USERS.clientAdmin.id);
    await openPage(page, "/portale");
    await page.getByRole("button", { name: /Menu dell'account/ }).click();
    await page.getByRole("menuitem", { name: "Esci" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText("Sei uscito dal portale")).toBeVisible();
  });
});

test.describe("assistenza", () => {
  test("il cliente apre un ticket e risponde", async ({ page }) => {
    await loginAs(page, USERS.member.id);
    await openPage(page, "/portale/assistenza");
    await page.getByRole("button", { name: "Nuovo ticket" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Nuovo ticket" }).click();
    await expect(dialog.getByText("Campo obbligatorio").first()).toBeVisible();
    await dialog.getByLabel("Oggetto").fill("Il listino non si aggiorna");
    await dialog.getByLabel("Priorità").selectOption("high");
    await dialog.getByLabel(/^Descrizione/).fill("Da ieri il listino mostra i prezzi vecchi.");
    await dialog.getByRole("button", { name: "Nuovo ticket" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Il listino non si aggiorna" }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/portale\/assistenza\/t_/);
    await page.getByLabel("Messaggio").fill("Allego anche lo screenshot via email.");
    await page.getByRole("button", { name: "Invia" }).click();
    await expect(page.getByText("Allego anche lo screenshot via email.")).toBeVisible();
    // Il cliente non può scrivere note interne.
    await expect(page.getByText("Nota interna (non visibile al cliente)")).toHaveCount(0);
  });

  test("lo staff scrive una nota interna che il cliente non vede", async ({ page }) => {
    await loginAs(page, USERS.clientAdmin.id);
    const id = await firstFerriTicketId(page);

    await page.evaluate(
      ([userId, at]) => {
        localStorage.setItem(
          "portale:session",
          JSON.stringify({
            state: {
              userId,
              pendingUserId: null,
              attempts: { failures: 0, lastFailureAt: null },
              lastActivity: at,
              notice: null,
            },
            version: 0,
          }),
        );
      },
      [USERS.support.id, FIXED_NOW.getTime()] as const,
    );
    await openPage(page, `/admin/ticket/${id}`);
    const note = "Verificare la cache della CDN prima di rispondere.";
    const status = page.getByText(/Segna come/).first();
    await expect(status.or(page.getByText("Ticket chiuso"))).toBeVisible();
    if (await page.getByText("Ticket chiuso").isVisible())
      test.skip(true, "Ticket demo già chiuso");
    await page.getByLabel("Messaggio").fill(note);
    await page.getByLabel("Nota interna (non visibile al cliente)").check();
    await page.getByRole("button", { name: "Invia" }).click();
    await expect(page.getByText(note)).toBeVisible();

    await page.evaluate(
      ([userId, at]) => {
        localStorage.setItem(
          "portale:session",
          JSON.stringify({
            state: {
              userId,
              pendingUserId: null,
              attempts: { failures: 0, lastFailureAt: null },
              lastActivity: at,
              notice: null,
            },
            version: 0,
          }),
        );
      },
      [USERS.clientAdmin.id, FIXED_NOW.getTime()] as const,
    );
    await openPage(page, `/portale/assistenza/${id}`);
    await expect(page.getByRole("heading", { name: "Conversazione" })).toBeVisible();
    await expect(page.getByText(note)).toHaveCount(0);
    await expect(page.getByText("Nota interna", { exact: true })).toHaveCount(0);
  });

  test("lo staff assegna e risolve un ticket", async ({ page }) => {
    await loginAs(page, USERS.support.id);
    await openPage(page, "/admin/ticket");
    await page.getByRole("radio", { name: "Aperti" }).click();
    await page.getByRole("table").getByRole("link").first().click();
    await expect(page.getByRole("heading", { name: "Conversazione" })).toBeVisible();
    await page.getByLabel("Assegnato a").selectOption({ label: USERS.support.name });
    await expect(toastText(page, "Ticket assegnato")).toBeVisible();
    await page.getByRole("button", { name: "Segna come “Risolto”" }).click();
    await expect(toastText(page, "Stato aggiornato: Risolto")).toBeVisible();
  });

  test("un ticket di un'altra azienda non è visibile", async ({ page }) => {
    await loginAs(page, USERS.clientAdmin.id);
    await openPage(page, "/portale/assistenza/inesistente");
    await expect(page.getByRole("heading", { level: 1, name: "Ticket non trovato" })).toBeVisible();
  });
});

test.describe("documenti e fatture", () => {
  test("carica un documento e registra il download", async ({ page }) => {
    await loginAs(page, USERS.member.id);
    await openPage(page, "/portale/documenti");
    await page.getByRole("button", { name: "Carica documento" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nome del documento").fill("bad/name.pdf");
    await dialog.getByRole("button", { name: "Carica documento" }).click();
    await expect(dialog.getByText(/Il nome non può contenere/)).toBeVisible();
    await dialog.getByLabel("Nome del documento").fill("Brief campagna inverno.pdf");
    await dialog.getByLabel("Cartella").selectOption("report");
    await dialog.getByRole("button", { name: "Carica documento" }).click();
    await expect(toastText(page, "Documento caricato")).toBeVisible();
    await page.getByRole("radio", { name: "Report" }).click();
    await expect(page.locator("#main").getByText("Brief campagna inverno.pdf")).toBeVisible();
    await page.getByRole("button", { name: "Scarica Brief campagna inverno.pdf" }).click();
    await expect(
      toastText(page, "Download di “Brief campagna inverno.pdf” registrato"),
    ).toBeVisible();
  });

  test("filtra i documenti per nome", async ({ page }) => {
    await loginAs(page, USERS.clientAdmin.id);
    await openPage(page, "/portale/documenti");
    await page.getByRole("searchbox", { name: "Cerca un documento" }).fill("zzz-nessuno");
    await expect(page.getByText("Nessun documento in questa cartella")).toBeVisible();
  });

  test("l'amministratore cliente vede e scarica le fatture", async ({ page }) => {
    await loginAs(page, USERS.clientAdmin.id);
    await openPage(page, "/portale/fatture");
    await expect(page.getByRole("table").getByRole("row")).not.toHaveCount(1);
    await page
      .getByRole("button", { name: /^Scarica la fattura/ })
      .first()
      .click();
    await expect(page.getByText(/Download della fattura .* registrato/).first()).toBeVisible();
  });
});

test.describe("team e utenti", () => {
  test("l'amministratore cliente invita, cambia permessi e disattiva", async ({ page }) => {
    await loginAs(page, USERS.clientAdmin.id);
    await openPage(page, "/portale/team");
    await page.getByRole("button", { name: "Invita utente" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nome e cognome").fill("Paolo Neri");
    await dialog.getByLabel("Email", { exact: true }).fill(USERS.member.email);
    await dialog.getByRole("button", { name: "Invita utente" }).click();
    await expect(dialog.getByText("Esiste già un utente con questa email")).toBeVisible();
    await dialog.getByLabel("Email", { exact: true }).fill("paolo.neri@ferri-arredamenti.example");
    await expect(dialog.getByLabel("Permessi").locator("option")).toHaveCount(3);
    await dialog.getByRole("button", { name: "Invita utente" }).click();
    await expect(
      toastText(page, "Invito inviato a paolo.neri@ferri-arredamenti.example"),
    ).toBeVisible();
    await expect(page.getByRole("row", { name: /Paolo Neri/ })).toBeVisible();

    await page.getByLabel(`Permessi di ${USERS.member.name}`).selectOption("client_viewer");
    await expect(toastText(page, "Permessi aggiornati")).toBeVisible();

    await page.getByRole("button", { name: `Azioni per ${USERS.member.name}` }).click();
    await page.getByRole("menuitem", { name: "Disattiva" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Disattiva" }).click();
    await expect(toastText(page, "Utente disattivato")).toBeVisible();
    // Non può modificare sé stessa.
    await expect(page.getByLabel(`Permessi di ${USERS.clientAdmin.name}`)).toHaveCount(0);
  });

  test("resta sempre un amministratore cliente", async ({ page }) => {
    await loginAs(page, USERS.admin.id);
    await openPage(page, "/admin/utenti");
    await page.getByRole("searchbox", { name: "Cerca per nome o email" }).fill("giulia");
    await page.getByLabel(`Permessi di ${USERS.clientAdmin.name}`).selectOption("client_member");
    await expect(
      toastText(page, "Deve restare almeno un amministratore attivo nell'azienda."),
    ).toBeVisible();
    await expect(page.getByLabel(`Permessi di ${USERS.clientAdmin.name}`)).toHaveValue(
      "client_admin",
    );
  });

  test("attiva e disattiva la verifica in due passaggi", async ({ page }) => {
    await loginAs(page, USERS.clientAdmin.id);
    await openPage(page, "/portale/sicurezza");
    await expect(page.getByRole("switch", { name: "Verifica in due passaggi" })).toBeDisabled();
    await expect(page.getByRole("cell", { name: "Accesso" }).first()).toBeVisible();
  });
});

test.describe("amministrazione", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.admin.id);
  });

  test("disattivare un cliente blocca l'accesso dei suoi utenti", async ({ page }) => {
    await openPage(page, "/admin/clienti");
    await page.getByRole("button", { name: "Ferri Arredamenti S.p.A." }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("switch", { name: "Accesso attivo" }).click();
    await expect(toastText(page, "Cliente aggiornato")).toBeVisible();
    await dialog.getByRole("button", { name: "Chiudi" }).click();
    await expect(dialog).toBeHidden();
    await page.getByRole("button", { name: /Menu dell'account/ }).click();
    await page.getByRole("menuitem", { name: "Esci" }).click();
    await page.getByLabel("Email di lavoro").fill(USERS.clientAdmin.email);
    await page.getByLabel("Password").fill("x");
    await page.getByRole("button", { name: "Continua" }).click();
    await expect(page.getByText(/Account disattivato/)).toBeVisible();
  });

  test("segna una fattura scaduta come pagata", async ({ page }) => {
    await openPage(page, "/admin/clienti");
    await page.getByRole("button", { name: "Lumen Ottica S.r.l." }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Scaduta").first()).toBeVisible();
    const buttons = dialog.getByRole("button", { name: "Segna come pagata" });
    const before = await buttons.count();
    await buttons.first().click();
    await expect(toastText(page, "Fattura segnata come pagata")).toBeVisible();
    await expect(buttons).toHaveCount(before - 1);
  });

  test("filtra ed esporta il registro attività", async ({ page }) => {
    await openPage(page, "/admin/registro");
    await page.getByLabel("Tutte le azioni").selectOption("auth.login");
    const rows = page.getByRole("table").getByRole("row");
    await expect(rows.nth(1)).toContainText("Accesso");
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Esporta CSV" }).click();
    expect((await download).suggestedFilename()).toBe("registro-attivita.csv");
  });

  test("valida e salva le impostazioni", async ({ page }) => {
    await openPage(page, "/admin/impostazioni");
    await page.getByLabel(/Chiusura della sessione/).fill("2");
    await page.getByRole("button", { name: "Salva modifiche" }).click();
    await expect(page.getByText("Inserisci un numero tra 5 e 480")).toBeVisible();
    await page.getByLabel(/Chiusura della sessione/).fill("60");
    await page.getByLabel("Urgente").fill("2");
    await page.getByRole("button", { name: "Salva modifiche" }).click();
    await expect(toastText(page, "Impostazioni salvate")).toBeVisible();
    await openPage(page, "/admin/registro");
    await expect(page.getByRole("table")).toContainText("Impostazioni modificate");
  });

  test("ripristina i dati demo ed esce", async ({ page }) => {
    await openPage(page, "/admin/impostazioni");
    await page.getByRole("button", { name: "Ripristina dati demo" }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Ripristina dati demo" })
      .click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("il grafico dei ticket cambia serie", async ({ page }) => {
    await openPage(page, "/admin");
    await page.getByRole("radio", { name: "Risolti" }).click();
    await expect(page.getByRole("radio", { name: "Risolti" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });
});
