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
        {s.company}, {s.address}. Contatto: {s.email}. Responsabile della protezione dei dati: da
        indicare.
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
            <td>Apertura e gestione del conto di gioco</td>
            <td>Anagrafica, codice fiscale, documento, contatti</td>
            <td>Contratto; obblighi di legge sul gioco pubblico</td>
            <td>Per la durata del conto e 10 anni dopo la chiusura</td>
          </tr>
          <tr>
            <td>Verifica dell&apos;età e dell&apos;identità, antiriciclaggio</td>
            <td>Anagrafica, documento, movimenti</td>
            <td>Obbligo di legge (D.Lgs. 231/2007)</td>
            <td>10 anni</td>
          </tr>
          <tr>
            <td>Gioco responsabile</td>
            <td>Limiti, pause, autoesclusioni, durata delle sessioni, segnali di rischio</td>
            <td>Obbligo di legge; interesse vitale e legittimo alla tutela del giocatore</td>
            <td>Per la durata del conto</td>
          </tr>
        </tbody>
      </table>
      <h2>Cosa non facciamo</h2>
      <ul>
        <li>Nessuna comunicazione promozionale né profilazione a fini di marketing.</li>
        <li>
          Nessuna decisione automatizzata con effetti giuridici: i segnali di rischio sono valutati
          da una persona.
        </li>
      </ul>
      <h2>Destinatari</h2>
      <p>
        ADM e autorità competenti per gli obblighi di legge; fornitori di verifica
        dell&apos;identità, pagamento e hosting come responsabili del trattamento.
      </p>
      <h2>Cookie</h2>
      <p>
        Solo strumenti tecnici (accesso, schedina, tema, conferma dell&apos;età): non serve il
        consenso.
      </p>
      <h2>Diritti</h2>
      <p>
        Accesso, rettifica, cancellazione (nei limiti degli obblighi di conservazione), limitazione,
        portabilità e opposizione scrivendo a {s.email}; reclamo al Garante per la protezione dei
        dati personali.
      </p>
    </LegalPage>
  );
}
