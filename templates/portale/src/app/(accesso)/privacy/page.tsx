import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { routes } from "@/config/navigation";
import { DEMO_SETTINGS } from "@/lib/demo/seed";

export const metadata: Metadata = { title: "Privacy" };

const s = DEMO_SETTINGS;

/**
 * Informativa di esempio per gli utenti del portale (art. 13 GDPR).
 * Testo segnaposto: va adattato e verificato da un consulente privacy.
 */
export default function PrivacyPage() {
  return (
    <main id="main" className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      <Link
        href={routes.login}
        className="inline-flex min-h-6 items-center gap-1.5 text-[13px] font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Torna all&apos;accesso
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-fg">
        Informativa privacy del portale
      </h1>
      <p className="mt-2 text-sm text-fg-muted">
        Ultimo aggiornamento: 1 ottobre 2026 · testo di esempio
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-fg [&_h2]:text-base [&_h2]:font-semibold [&_li]:mt-1 [&_ul]:list-disc [&_ul]:pl-5">
        <section className="space-y-2">
          <h2>Titolare del trattamento</h2>
          <p>
            {s.providerName}, contatto privacy: {s.supportEmail}. Per i dati che i clienti caricano
            nel portale (documenti, contenuti dei ticket) {s.providerName} agisce come responsabile
            del trattamento ai sensi dell&apos;art. 28 GDPR, secondo il contratto di servizio.
          </p>
        </section>
        <section className="space-y-2">
          <h2>Quali dati trattiamo</h2>
          <ul>
            <li>Dati dell&apos;account: nome, email di lavoro, ruolo in azienda, permessi.</li>
            <li>
              Dati di sicurezza: stato della verifica in due passaggi, accessi e azioni rilevanti
              con IP anonimizzato.
            </li>
            <li>
              Contenuti: messaggi dei ticket e documenti condivisi nell&apos;ambito dei progetti.
            </li>
          </ul>
        </section>
        <section className="space-y-2">
          <h2>Finalità e basi giuridiche</h2>
          <ul>
            <li>Erogare i servizi previsti dal contratto con la tua azienda (art. 6.1.b GDPR).</li>
            <li>
              Proteggere il portale e ricostruire eventuali incidenti tramite il registro attività:
              legittimo interesse (art. 6.1.f) e misure di sicurezza (art. 32).
            </li>
            <li>Adempiere a obblighi fiscali e contabili per le fatture (art. 6.1.c).</li>
          </ul>
        </section>
        <section className="space-y-2">
          <h2>Conservazione</h2>
          <p>
            L&apos;account resta attivo finché la tua azienda ha accesso al portale. Il registro
            attività è conservato per {s.auditRetentionDays} giorni; le fatture per 10 anni come
            previsto dalla legge.
          </p>
        </section>
        <section className="space-y-2">
          <h2>Cookie e archiviazione locale</h2>
          <p>
            Il portale usa solo strumenti tecnici necessari (sessione, preferenza del tema): non
            servono consensi. Non usiamo cookie di profilazione né strumenti di analisi di terze
            parti.
          </p>
        </section>
        <section className="space-y-2">
          <h2>I tuoi diritti</h2>
          <p>
            Puoi chiedere accesso, rettifica, cancellazione, limitazione e portabilità dei dati, o
            opporti al trattamento, scrivendo a {s.supportEmail}. Puoi anche presentare reclamo al
            Garante per la protezione dei dati personali (garanteprivacy.it).
          </p>
        </section>
      </div>
    </main>
  );
}
