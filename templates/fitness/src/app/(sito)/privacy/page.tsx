import type { Metadata } from "next";
import { Container } from "@/components/site/section";
import { DEMO_SETTINGS } from "@/lib/demo/seed";

export const metadata: Metadata = { title: "Informativa privacy" };

/**
 * Modello di informativa (artt. 13–14 GDPR) da adattare con il consulente privacy.
 * I dati del titolare provengono dalle impostazioni del club.
 */
export default function PrivacyPage() {
  const s = DEMO_SETTINGS;
  return (
    <Container className="max-w-3xl py-12 sm:py-16">
      <article className="space-y-6 text-fg [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_li]:text-fg-muted [&_p]:text-fg-muted">
        <h1 className="font-display text-4xl font-bold">Informativa privacy</h1>
        <p className="rounded-lg border border-line bg-surface-2 p-4 text-sm">
          Testo di esempio da personalizzare e far verificare: non costituisce consulenza legale.
        </p>
        <h2>Titolare del trattamento</h2>
        <p>
          {s.name}, {s.address}, {s.postalCode} {s.city} · P. IVA {s.vatNumber} · {s.email}
        </p>
        <h2>Dati trattati e finalità</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Iscrizione e abbonamento: anagrafica, contatti, piano, pagamenti e ingressi.</li>
          <li>Prenotazione delle lezioni: lezioni prenotate, presenze e lista d&apos;attesa.</li>
          <li>
            Certificato medico: solo la data di scadenza, per verificare l&apos;idoneità richiesta
            dal regolamento. Il documento non viene conservato online.
          </li>
          <li>Prova gratuita: dati di contatto per organizzare la prova.</li>
          <li>
            Comunicazioni promozionali e uso delle immagini: solo con consensi facoltativi e
            revocabili.
          </li>
        </ul>
        <h2>Base giuridica</h2>
        <p>
          Esecuzione del contratto di abbonamento (art. 6.1.b GDPR); obblighi di legge per i dati
          fiscali (art. 6.1.c); per i dati relativi all&apos;idoneità sportiva, le condizioni
          dell&apos;art. 9 GDPR; consenso (art. 6.1.a) per marketing e immagini.
        </p>
        <h2>Conservazione</h2>
        <p>
          I dati dell&apos;abbonamento sono conservati per la durata del rapporto e per 24 mesi
          successivi; i documenti fiscali per 10 anni; le richieste di prova non convertite per 6
          mesi; i consensi fino alla revoca.
        </p>
        <h2>Diritti</h2>
        <p>
          Puoi chiedere accesso, rettifica, cancellazione, limitazione, portabilità e opposizione
          dall&apos;area socio o scrivendo a {s.email}. Puoi proporre reclamo al Garante per la
          protezione dei dati personali.
        </p>
      </article>
    </Container>
  );
}
