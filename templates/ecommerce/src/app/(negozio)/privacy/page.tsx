import type { Metadata } from "next";
import { copy } from "@/content/it";
import { DEMO_SETTINGS } from "@/lib/demo/seed";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: copy.legal.privacy };

const s = DEMO_SETTINGS;

export default function PrivacyPage() {
  return (
    <LegalPage title={copy.legal.privacy}>
      <h2>Titolare del trattamento</h2>
      <p>
        {s.legal.company}, {s.legal.address}, email {s.legal.email}, PEC {s.legal.pec}.
      </p>

      <h2>Quali dati e perché</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Finalità</th>
            <th scope="col">Dati</th>
            <th scope="col">Base giuridica</th>
            <th scope="col">Conservazione</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Gestire ordini, consegne, resi e assistenza</td>
            <td>Nome, email, telefono, indirizzo, ordini</td>
            <td>Contratto (art. 6.1.b GDPR)</td>
            <td>10 anni per gli obblighi fiscali</td>
          </tr>
          <tr>
            <td>Area personale</td>
            <td>Dati dell&apos;account</td>
            <td>Contratto</td>
            <td>Fino alla cancellazione dell&apos;account</td>
          </tr>
          <tr>
            <td>Prevenzione delle frodi nei pagamenti</td>
            <td>Dati dell&apos;ordine, esito del pagamento</td>
            <td>Legittimo interesse (art. 6.1.f)</td>
            <td>24 mesi</td>
          </tr>
          <tr>
            <td>Novità e offerte via email</td>
            <td>Email</td>
            <td>Consenso facoltativo (art. 6.1.a), revocabile in ogni momento</td>
            <td>Fino alla revoca</td>
          </tr>
        </tbody>
      </table>

      <h2>A chi li comunichiamo</h2>
      <ul>
        <li>ai laboratori che preparano i tuoi prodotti (solo i dati necessari);</li>
        <li>al fornitore dei pagamenti, che tratta i dati della carta: noi non li vediamo;</li>
        <li>ai corrieri, per la consegna;</li>
        <li>ai fornitori di hosting e posta elettronica, nominati responsabili del trattamento.</li>
      </ul>

      <h2>Cookie e archiviazione locale</h2>
      <p>
        Usiamo solo strumenti tecnici necessari: il browser conserva carrello, accesso e preferenza
        del tema. Non usiamo cookie di profilazione né strumenti di analisi di terze parti, per
        questo non mostriamo il banner dei cookie.
      </p>

      <h2>I tuoi diritti</h2>
      <p>
        Puoi chiedere accesso, rettifica, cancellazione, limitazione, portabilità e opporti al
        trattamento scrivendo a {s.legal.email}; dall&apos;area personale puoi scaricare i tuoi dati
        e chiedere la cancellazione. Puoi proporre reclamo al Garante per la protezione dei dati
        personali.
      </p>
    </LegalPage>
  );
}
