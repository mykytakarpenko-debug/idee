import type { Metadata } from "next";
import { copy } from "@/content/it";
import { site } from "@/content/site";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = {
  title: copy.legal.terms,
  alternates: { canonical: "/termini" },
};

export default function TermsPage() {
  return (
    <LegalPage title={copy.legal.terms}>
      <p>{copy.legal.updated("1 ottobre 2026")}</p>
      <h2>Fornitore</h2>
      <p>
        {site.company}, {site.address}, P. IVA {site.vatNumber}, REA {site.rea}, {site.email}.
      </p>
      <h2>Servizio</h2>
      <p>
        {site.name} è un software in abbonamento per la gestione di turni, presenze e assenze,
        rivolto a imprese e professionisti. Le funzioni incluse dipendono dal piano scelto e sono
        descritte nella pagina Prezzi.
      </p>
      <h2>Prova, prezzi e pagamenti</h2>
      <ul>
        <li>La prova del piano Team dura 30 giorni e non richiede un metodo di pagamento.</li>
        <li>
          I prezzi sono per persona attiva al mese, IVA esclusa; la fatturazione può essere mensile
          o annuale.
        </li>
        <li>Le variazioni di prezzo sono comunicate con almeno 30 giorni di anticipo.</li>
      </ul>
      <h2>Durata e recesso</h2>
      <p>
        L&apos;abbonamento si rinnova alla scadenza del periodo scelto e si può disdire in qualsiasi
        momento dalle impostazioni; la disdetta ha effetto alla fine del periodo già pagato. I dati
        restano esportabili per 30 giorni.
      </p>
      <h2>Livelli di servizio e responsabilità</h2>
      <p>
        Disponibilità obiettivo del 99,5% su base mensile, esclusi interventi programmati comunicati
        in anticipo. La responsabilità del fornitore è limitata nei termini consentiti dalla legge.
      </p>
      <h2>Dati personali</h2>
      <p>
        Per i dati dei team gestiti con il servizio il fornitore agisce come responsabile del
        trattamento secondo l&apos;accordo ai sensi dell&apos;art. 28 GDPR, parte integrante di
        questi termini.
      </p>
      <h2>Legge applicabile</h2>
      <p>
        Legge italiana; foro competente quello della sede del fornitore, salvo diversa previsione
        inderogabile.
      </p>
    </LegalPage>
  );
}
