import type { Metadata } from "next";
import { Container } from "@/components/site/section";
import { DEMO_SETTINGS } from "@/lib/demo/seed";

export const metadata: Metadata = { title: "Informativa privacy" };

/**
 * Modello di informativa (artt. 13–14 GDPR) da adattare con il consulente privacy.
 * I dati del titolare provengono dalle impostazioni del locale.
 */
export default function PrivacyPage() {
  const s = DEMO_SETTINGS;
  return (
    <Container className="max-w-3xl py-12 sm:py-16">
      <article className="prose-sm space-y-6 text-fg [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_li]:text-fg-muted [&_p]:text-fg-muted">
        <h1 className="font-display text-4xl font-semibold">Informativa privacy</h1>
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
            Prenotazioni: nome, telefono, email, numero di persone e note (es. allergie) per gestire
            il tavolo.
          </li>
          <li>
            Ordini online: dati di contatto e indirizzo per preparare e consegnare l&apos;ordine.
          </li>
          <li>Comunicazioni promozionali: solo con consenso facoltativo e revocabile.</li>
        </ul>
        <h2>Base giuridica</h2>
        <p>
          Esecuzione del contratto o di misure precontrattuali (art. 6.1.b GDPR) per prenotazioni e
          ordini; consenso (art. 6.1.a) per le comunicazioni promozionali; obblighi di legge (art.
          6.1.c) per i dati fiscali. Le informazioni su allergie e intolleranze sono trattate solo
          per preparare i piatti in sicurezza.
        </p>
        <h2>Conservazione</h2>
        <p>
          I dati delle prenotazioni sono conservati per 12 mesi; i documenti fiscali per 10 anni
          come previsto dalla legge; i consensi promozionali fino alla revoca.
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
