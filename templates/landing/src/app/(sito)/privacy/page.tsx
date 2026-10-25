import type { Metadata } from "next";
import { copy } from "@/content/it";
import { site } from "@/content/site";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = {
  title: copy.legal.privacy,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage title={copy.legal.privacy}>
      <p>{copy.legal.updated("1 ottobre 2026")}</p>
      <h2>Titolare del trattamento</h2>
      <p>
        {site.company}, {site.address}, P. IVA {site.vatNumber}. Contatto per la privacy:{" "}
        {site.privacyEmail}.
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
            <td>Rispondere alle richieste dal modulo contatti</td>
            <td>Nome, email, azienda, dimensione del team, messaggio</td>
            <td>Misure precontrattuali su richiesta dell&apos;interessato (art. 6.1.b GDPR)</td>
            <td>12 mesi dall&apos;ultimo contatto</td>
          </tr>
          <tr>
            <td>Newsletter</td>
            <td>Email</td>
            <td>Consenso (art. 6.1.a), revocabile in ogni momento</td>
            <td>Fino alla revoca</td>
          </tr>
          <tr>
            <td>Statistiche di utilizzo del sito</td>
            <td>Dati di navigazione aggregati</td>
            <td>Consenso tramite il banner dei cookie</td>
            <td>Vedi la cookie policy</td>
          </tr>
          <tr>
            <td>Sicurezza del sito</td>
            <td>Indirizzo IP, data e ora delle richieste</td>
            <td>Legittimo interesse (art. 6.1.f)</td>
            <td>30 giorni</td>
          </tr>
        </tbody>
      </table>
      <h2>Destinatari</h2>
      <p>
        Fornitori che trattano i dati per nostro conto come responsabili del trattamento (hosting,
        invio email, CRM), con server nell&apos;Unione europea o con garanzie adeguate per il
        trasferimento.
      </p>
      <h2>Diritti</h2>
      <p>
        Accesso, rettifica, cancellazione, limitazione, portabilità, opposizione e revoca del
        consenso scrivendo a {site.privacyEmail}. Puoi presentare reclamo al Garante per la
        protezione dei dati personali.
      </p>
      <h2>Dati dei clienti del software</h2>
      <p>
        Per i dati dei team gestiti con il software agiamo come responsabile del trattamento secondo
        l&apos;accordo allegato ai termini di servizio (art. 28 GDPR).
      </p>
    </LegalPage>
  );
}
