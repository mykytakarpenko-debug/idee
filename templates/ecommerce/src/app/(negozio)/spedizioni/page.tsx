import type { Metadata } from "next";
import Link from "next/link";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { DEMO_SETTINGS } from "@/lib/demo/seed";
import { formatCurrency } from "@/lib/format";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: copy.legal.shipping };

const s = DEMO_SETTINGS;
const methods = copy.checkout.methods;

export default function ShippingPage() {
  return (
    <LegalPage title={copy.legal.shipping}>
      <p>
        Spediamo in tutta Italia, isole comprese. Ogni ordine parte in un unico pacco, anche se
        contiene oggetti di laboratori diversi, imballato con materiali riciclati.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">{copy.checkout.shippingMethod}</th>
            <th scope="col">Tempi</th>
            <th scope="col">Costo</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{methods.standard.label}</td>
            <td>{methods.standard.text}</td>
            <td>
              {formatCurrency(s.shipping.standard)}, gratuita da{" "}
              {formatCurrency(s.shipping.freeThreshold, { round: true })}
            </td>
          </tr>
          <tr>
            <td>{methods.express.label}</td>
            <td>{methods.express.text}</td>
            <td>{formatCurrency(s.shipping.express)}</td>
          </tr>
          <tr>
            <td>{methods.pickup.label}</td>
            <td>{methods.pickup.text}</td>
            <td>{copy.common.free}</td>
          </tr>
        </tbody>
      </table>
      <p>Ritiro: {s.shipping.pickupAddress}.</p>

      <h2>Tracciamento</h2>
      <p>
        Quando il pacco parte ricevi un&apos;email con il corriere e il codice di tracciamento,
        visibili anche nella pagina dell&apos;ordine.
      </p>

      <h2>Pacco danneggiato</h2>
      <p>
        Se l&apos;imballo è visibilmente danneggiato, accetta con riserva specifica (“pacco
        danneggiato”) e scrivici entro 7 giorni con alcune foto: sostituiamo o rimborsiamo i
        prodotti rotti.
      </p>

      <h2>Resi</h2>
      <p>
        Hai {s.returnDays} giorni dalla consegna per recedere: tutte le istruzioni nella pagina{" "}
        <Link href={routes.withdrawal} className="text-accent-text underline">
          Diritto di recesso
        </Link>
        .
      </p>
    </LegalPage>
  );
}
