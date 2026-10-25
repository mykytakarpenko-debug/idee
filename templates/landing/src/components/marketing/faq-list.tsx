import { ChevronDown } from "lucide-react";
import { faq } from "@/content/site";

/** Domande frequenti con <details>: accessibili e funzionanti anche senza JavaScript. */
export function FaqList() {
  return (
    <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
      {faq.map((item) => (
        <details key={item.q} className="group px-5 sm:px-6">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-medium text-fg [&::-webkit-details-marker]:hidden">
            {item.q}
            <ChevronDown
              aria-hidden
              className="size-4 shrink-0 text-fg-muted transition-transform group-open:rotate-180"
            />
          </summary>
          <p className="pb-5 text-sm text-fg-muted">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
