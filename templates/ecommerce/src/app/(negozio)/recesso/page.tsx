import type { Metadata } from "next";
import Link from "next/link";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { DEMO_SETTINGS } from "@/lib/demo/seed";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: copy.legal.withdrawal };

const s = DEMO_SETTINGS;

export default function WithdrawalPage() {
  return (
    <LegalPage title={copy.legal.withdrawal}>
      <p>
        Hai il diritto di recedere dal contratto, senza indicarne le ragioni, entro{" "}
        {s.returnDays} giorni dal giorno in cui tu, o una persona da te indicata diversa dal
        vettore, ricevi i beni (artt. 52 e seguenti del Codice del Consumo).
      </p>

      <h2>Come esercitarlo</h2>
      <ul>
        <li>
          dall&apos;
          <Link href={routes.account} className="text-accent-text underline">
            area personale
          </Link>
          , con “Richiedi un reso” accanto all&apos;ordine;
        </li>
        <li>
          oppure inviando una dichiarazione esplicita (anche con il modulo qui sotto) a{" "}
          {s.legal.email} o alla PEC {s.legal.pec}, prima della scadenza del termine.
        </li>
      </ul>

      <h2>Restituzione dei beni</h2>
      <p>
        Restituisci i prodotti entro 14 giorni dalla comunicazione del recesso, integri e con la
        confezione originale se possibile. Le spese dirette di restituzione sono a tuo carico, salvo
        prodotto difettoso o non conforme. Sei responsabile solo della diminuzione di valore
        dovuta a una manipolazione diversa da quella necessaria per verificarne natura e
        funzionamento.
      </p>

      <h2>Rimborso</h2>
      <p>
        Ti rimborsiamo entro 14 giorni dalla comunicazione del recesso tutti i pagamenti ricevuti,
        comprese le spese di consegna (escluso l&apos;eventuale costo aggiuntivo della spedizione
        espressa rispetto a quella standard), con lo stesso mezzo di pagamento usato per
        l&apos;acquisto. Possiamo trattenere il rimborso finché non riceviamo i beni o la prova
        della spedizione.
      </p>

      <h2 id="modulo">{copy.legal.formTitle}</h2>
      <div className="rounded-xl border border-line bg-surface p-5 text-sm">
        <p>
          Destinatario: {s.legal.company}, {s.legal.address}, {s.legal.email}
        </p>
        <p className="mt-3">
          Con la presente io/noi (*) notifico/notifichiamo (*) il recesso dal mio/nostro (*)
          contratto di vendita dei seguenti beni (*):
        </p>
        <p className="mt-3">Ordinato il (*) / ricevuto il (*):</p>
        <p>Nome del/dei consumatore/i:</p>
        <p>Indirizzo del/dei consumatore/i:</p>
        <p>Firma del/dei consumatore/i (solo se il modulo è inviato su carta):</p>
        <p>Data:</p>
        <p className="mt-3 text-[13px] text-fg-muted">(*) Cancellare la dicitura inutile.</p>
      </div>
    </LegalPage>
  );
}
