import type { Metadata } from "next";
import { copy } from "@/content/it";
import { DEMO_SETTINGS } from "@/lib/demo/seed";
import { formatCurrency } from "@/lib/format";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: copy.legal.terms };

const s = DEMO_SETTINGS;

export default function TermsPage() {
  return (
    <LegalPage title={copy.legal.terms}>
      <h2>Operatore</h2>
      <p>
        {s.company}, {s.address}, P. IVA {s.vatNumber}, {s.license}. Assistenza: {s.email}.
      </p>
      <h2>Apertura del conto</h2>
      <ul>
        <li>
          Il conto è riservato a persone maggiorenni residenti in Italia; è ammesso un solo conto
          per persona.
        </li>
        <li>Servono dati anagrafici veri, codice fiscale e documento d&apos;identità valido.</li>
        <li>
          Fino alla verifica del documento (entro 30 giorni) il conto è provvisorio e non consente
          prelievi.
        </li>
        <li>Alla registrazione è obbligatorio indicare un limite di ricarica settimanale.</li>
      </ul>
      <h2>Ricariche e prelievi</h2>
      <ul>
        <li>Ricariche e prelievi solo con strumenti intestati al titolare del conto.</li>
        <li>
          I limiti si possono ridurre subito; aumenti e rimozioni hanno effetto dopo{" "}
          {s.limitIncreaseDays} giorni.
        </li>
        <li>
          Il saldo resta del titolare e può essere prelevato anche durante pause o autoesclusione.
        </li>
      </ul>
      <h2>Giocate</h2>
      <ul>
        <li>
          Importo per schedina da {formatCurrency(s.minStake)} a {formatCurrency(s.maxStake)};
          vincita massima {formatCurrency(s.maxWin)}.
        </li>
        <li>
          Le regole di ogni gioco e le probabilità di vincita sono nella pagina Regole e
          probabilità.
        </li>
      </ul>
      <h2>Gioco responsabile</h2>
      <p>
        L&apos;operatore mette a disposizione limiti, promemoria, pause e autoesclusione e può
        contattare il giocatore in presenza di segnali di gioco problematico. Non sono previsti
        bonus né comunicazioni promozionali.
      </p>
      <h2>Reclami</h2>
      <p>
        I reclami si inviano a {s.email}; la risposta arriva entro 30 giorni. Resta possibile
        rivolgersi ad ADM.
      </p>
    </LegalPage>
  );
}
