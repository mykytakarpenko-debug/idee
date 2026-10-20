import type { Metadata } from "next";
import { Container } from "@/components/site/section";
import { DEMO_SETTINGS } from "@/lib/demo/seed";

export const metadata: Metadata = { title: "Informativa privacy" };

/**
 * Modello di informativa (artt. 13–14 GDPR) da adattare con il consulente privacy.
 * I dati del titolare provengono dalle impostazioni dello studio.
 */
export default function PrivacyPage() {
  const s = DEMO_SETTINGS;
  return (
    <Container className="max-w-3xl py-12 sm:py-16">
      <article className="space-y-6 text-fg [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:text-fg-muted [&_p]:text-fg-muted">
        <h1 className="text-4xl font-semibold tracking-tight">Informativa privacy</h1>
        <p className="rounded-lg border border-line bg-surface-2 p-4 text-sm">
          Testo di esempio da personalizzare e far verificare: non costituisce consulenza legale.
        </p>
        <h2>Titolare del trattamento</h2>
        <p>
          {s.name}, {s.address}, {s.postalCode} {s.city} · P. IVA {s.vatNumber} · {s.email}
        </p>
        <h2>Dati trattati e finalità</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Prenotazione: nome, email, telefono, servizio, data e note facoltative, per fissare e
            gestire l&apos;appuntamento e inviarti conferme e promemoria.
          </li>
          <li>
            Videochiamate: il collegamento avviene tramite il fornitore indicato nella email di
            conferma; non registriamo le sessioni.
          </li>
          <li>Comunicazioni dello studio: solo con consenso facoltativo e revocabile.</li>
        </ul>
        <h2>Base giuridica</h2>
        <p>
          Esecuzione di misure precontrattuali e del contratto (art. 6.1.b GDPR) per gli
          appuntamenti; obblighi di legge (art. 6.1.c) per i dati fiscali; consenso (art. 6.1.a) per
          le comunicazioni promozionali. Ti chiediamo di non inserire nelle note dati sanitari o
          altri dati particolari.
        </p>
        <h2>Conservazione</h2>
        <p>
          I dati degli appuntamenti sono conservati per 24 mesi; i documenti fiscali per 10 anni; i
          consensi fino alla revoca.
        </p>
        <h2>Diritti</h2>
        <p>
          Puoi chiedere accesso, rettifica, cancellazione, limitazione, portabilità e opposizione
          scrivendo a {s.email}. Puoi proporre reclamo al Garante per la protezione dei dati
          personali.
        </p>
      </article>
    </Container>
  );
}
