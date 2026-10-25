import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { copy } from "@/content/it";
import { Container } from "./section";

/** Struttura comune delle pagine legali: titolo, avviso sul testo di esempio, contenuto. */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Container className="max-w-3xl animate-page-in py-12 sm:py-16">
      <h1 className="font-display text-4xl font-semibold tracking-tight text-fg">{title}</h1>
      <p className="mt-4 flex gap-2 rounded-lg bg-info-soft p-3 text-[13px] text-fg">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-info" />
        {copy.legal.templateNote}
      </p>
      <div className="legal mt-8 space-y-4 text-[15px] leading-relaxed text-fg [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_table]:w-full [&_table]:table-fixed [&_table]:text-[13px] sm:[&_table]:text-sm [&_td]:border-t [&_td]:border-line [&_td]:py-2 [&_td]:pr-4 [&_td]:align-top [&_td]:[overflow-wrap:anywhere] [&_th]:py-2 [&_th]:pr-4 [&_th]:text-left [&_th]:text-[13px] [&_th]:font-medium [&_th]:[overflow-wrap:anywhere] [&_th]:text-fg-muted">
        {children}
      </div>
    </Container>
  );
}
