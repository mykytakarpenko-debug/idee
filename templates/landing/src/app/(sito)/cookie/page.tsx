import type { Metadata } from "next";
import { copy } from "@/content/it";
import { CONSENT_MAX_AGE_DAYS } from "@/lib/consent";
import { CookiePreferencesButton } from "@/components/site/cookie-consent";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = {
  title: copy.legal.cookies,
  alternates: { canonical: "/cookie" },
};

export default function CookiePage() {
  return (
    <LegalPage title={copy.legal.cookies}>
      <p>{copy.legal.updated("1 ottobre 2026")}</p>
      <p>
        Questo sito usa strumenti tecnici necessari al funzionamento e, solo con il tuo consenso,
        strumenti di statistica e di marketing. Alla prima visita un banner ti chiede di scegliere:
        chiudendolo con la X restano attivi solo gli strumenti tecnici.
      </p>
      <h2>Strumenti utilizzati</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">Categoria</th>
            <th scope="col">Finalità</th>
            <th scope="col">Durata</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>vetrina:consent (archiviazione locale)</td>
            <td>Necessario</td>
            <td>Ricordare le tue scelte sui cookie</td>
            <td>{CONSENT_MAX_AGE_DAYS} giorni</td>
          </tr>
          <tr>
            <td>vetrina:theme (archiviazione locale)</td>
            <td>Necessario</td>
            <td>Ricordare il tema chiaro o scuro scelto</td>
            <td>Fino alla cancellazione</td>
          </tr>
          <tr>
            <td>Strumento di statistica (da configurare)</td>
            <td>Statistiche</td>
            <td>Misurare in forma aggregata le visite</td>
            <td>Secondo il fornitore</td>
          </tr>
          <tr>
            <td>Pixel di marketing (da configurare)</td>
            <td>Marketing</td>
            <td>Misurare le campagne pubblicitarie</td>
            <td>Secondo il fornitore</td>
          </tr>
        </tbody>
      </table>
      <h2>Come cambiare le scelte</h2>
      <p>
        Puoi modificare le preferenze in qualsiasi momento dal link &quot;Preferenze cookie&quot;
        nel piè di pagina o da qui: <CookiePreferencesButton />. Le scelte vengono richieste di
        nuovo dopo {CONSENT_MAX_AGE_DAYS / 30} mesi o se cambiano gli strumenti utilizzati.
      </p>
    </LegalPage>
  );
}
