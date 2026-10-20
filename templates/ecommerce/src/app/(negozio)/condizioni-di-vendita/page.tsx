import type { Metadata } from "next";
import Link from "next/link";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { DEMO_SETTINGS } from "@/lib/demo/seed";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: copy.legal.conditions };

const s = DEMO_SETTINGS;

export default function ConditionsPage() {
  return (
    <LegalPage title={copy.legal.conditions}>
      <h2>1. Chi vende</h2>
      <p>
        Il sito è gestito da {s.legal.company}, {s.legal.address}, P. IVA {s.legal.vatNumber}, REA{" "}
        {s.legal.rea}, email {s.legal.email}, PEC {s.legal.pec}.
      </p>
      <p>
        I prodotti sono realizzati e venduti dai laboratori indicati in ogni scheda, tutti venditori
        professionali: il contratto di vendita è concluso con il laboratorio. {s.name} gestisce per
        loro conto sito, pagamenti, spedizioni, resi e assistenza ed è il tuo unico punto di
        contatto. I dati di ogni laboratorio sono nella sua pagina.
      </p>

      <h2>2. Prezzi</h2>
      <p>
        Tutti i prezzi sono in euro e comprendono l&apos;IVA. Le spese di spedizione sono indicate
        nel carrello e prima della conferma dell&apos;ordine. In caso di riduzione di prezzo
        indichiamo il prezzo più basso applicato nei 30 giorni precedenti.
      </p>

      <h2>3. Ordine e conclusione del contratto</h2>
      <p>
        Prima dell&apos;invio vedi il riepilogo con prodotti, prezzi, spese e totale. Il contratto
        si conclude quando premi “Ordine con obbligo di pagamento” e riceve conferma via email con
        il numero d&apos;ordine. Se un prodotto non è più disponibile ti avvisiamo e, se hai già
        pagato, ti rimborsiamo entro 14 giorni.
      </p>

      <h2>4. Pagamenti</h2>
      <p>
        Accettiamo carte di credito e debito, PayPal e bonifico bancario. I dati di pagamento sono
        trattati direttamente dal fornitore di pagamento e non vengono conservati da noi. Con il
        bonifico l&apos;ordine viene spedito quando riceviamo l&apos;accredito.
      </p>

      <h2>5. Spedizione e consegna</h2>
      <p>
        Spediamo in Italia; tempi e costi sono descritti nella pagina{" "}
        <Link href={routes.shipping} className="text-accent-text underline">
          Spedizioni e resi
        </Link>
        . Il rischio di perdita o danneggiamento passa a te alla consegna.
      </p>

      <h2>6. Diritto di recesso</h2>
      <p>
        Puoi recedere entro {s.returnDays} giorni dalla consegna senza indicare il motivo, come
        spiegato nella pagina{" "}
        <Link href={routes.withdrawal} className="text-accent-text underline">
          Diritto di recesso
        </Link>
        , dove trovi anche il modulo tipo.
      </p>

      <h2>7. Garanzia legale di conformità</h2>
      <p>
        Tutti i prodotti godono della garanzia legale di conformità di 24 mesi dalla consegna
        prevista dal Codice del Consumo. In caso di difetto scrivici: hai diritto alla
        riparazione o sostituzione gratuita oppure, se non possibili, a una riduzione del prezzo o
        alla risoluzione del contratto. Le piccole variazioni di colore e forma tipiche della
        lavorazione a mano non sono difetti.
      </p>

      <h2>8. Reclami e controversie</h2>
      <p>
        Per qualsiasi reclamo scrivi a {s.legal.email}: rispondiamo entro 7 giorni lavorativi. Puoi
        anche rivolgerti a un organismo di risoluzione alternativa delle controversie (ADR). Il
        contratto è regolato dalla legge italiana; per le controversie è competente il giudice del
        luogo di residenza del consumatore.
      </p>
    </LegalPage>
  );
}
