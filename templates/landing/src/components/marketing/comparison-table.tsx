import { Check, Minus } from "lucide-react";
import { copy } from "@/content/it";
import { comparison, plans } from "@/content/site";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

/** Tabella di confronto tra i piani (contenuto statico). */
export function ComparisonTable() {
  return (
    <div className="rounded-2xl border border-line bg-surface">
      <Table scrollLabel={copy.pricing.compare}>
        <caption className="sr-only">{copy.pricing.compare}</caption>
        <THead>
          <TR>
            <TH>{copy.pricing.feature}</TH>
            {plans.map((p) => (
              <TH key={p.id} className="text-center">
                {p.name}
              </TH>
            ))}
          </TR>
        </THead>
        <TBody>
          {comparison.map((row) => (
            <TR key={row.label}>
              <TH
                scope="row"
                className="h-12 min-w-44 text-sm font-normal whitespace-normal text-fg"
              >
                {row.label}
              </TH>
              {plans.map((p) => {
                const value = row.values[p.id];
                return (
                  <TD key={p.id} className="h-12 text-center text-fg">
                    {typeof value === "string" ? (
                      value
                    ) : value ? (
                      <>
                        <Check aria-hidden className="mx-auto size-4 text-accent-text" />
                        <span className="sr-only">{copy.a11y.included}</span>
                      </>
                    ) : (
                      <>
                        <Minus aria-hidden className="mx-auto size-4 text-fg-subtle" />
                        <span className="sr-only">{copy.a11y.notIncluded}</span>
                      </>
                    )}
                  </TD>
                );
              })}
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
