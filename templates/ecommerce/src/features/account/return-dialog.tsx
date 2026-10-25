"use client";

import { useId, useState } from "react";
import { copy } from "@/content/it";
import { refundAmount } from "@/lib/domain/orders";
import type { Order } from "@/lib/domain/types";
import { formatCurrency } from "@/lib/format";
import { useDataStore } from "@/store/data-store";
import { Button } from "@/components/ui/button";
import { DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Select, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

const t = copy.account;

/** Richiesta di reso (diritto di recesso) per un ordine consegnato. */
export function ReturnDialog({ order, onDone }: { order: Order; onDone: () => void }) {
  const id = useId();
  const settings = useDataStore((state) => state.settings);
  const requestReturn = useDataStore((state) => state.requestReturn);
  const [quantities, setQuantities] = useState<number[]>(() => order.lines.map((l) => l.quantity));
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const items = quantities
    .map((quantity, index) => ({ index, quantity }))
    .filter((item) => item.quantity > 0);
  const refund = refundAmount(order, items, settings.shipping.standard);

  return (
    <DialogContent title={t.returnTitle} description={t.returnIntro(settings.returnDays)}>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (items.length === 0) {
            setError(t.returnNone);
            return;
          }
          requestReturn(order.id, items, reason);
          toast.success(t.returnSent, { description: order.number });
          onDone();
        }}
      >
        <DialogBody className="space-y-5">
          <fieldset aria-describedby={error ? `${id}-error` : undefined}>
            <legend className="text-[13px] font-medium text-fg">{t.returnItems}</legend>
            <ul className="mt-2 divide-y divide-line">
              {order.lines.map((line, index) => (
                <li
                  key={`${line.variantId}-${index}`}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <label htmlFor={`${id}-${index}`} className="text-sm text-fg">
                    {line.name}
                    <span className="block text-[13px] text-fg-muted">{line.variantName}</span>
                  </label>
                  <Select
                    id={`${id}-${index}`}
                    value={String(quantities[index] ?? 0)}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setQuantities((prev) => prev.map((q, i) => (i === index ? value : q)));
                      setError(null);
                    }}
                    className="w-20"
                  >
                    {Array.from({ length: line.quantity + 1 }, (_, n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </Select>
                </li>
              ))}
            </ul>
            {error ? (
              <p id={`${id}-error`} className="mt-1 text-[13px] text-danger" role="alert">
                {error}
              </p>
            ) : null}
          </fieldset>
          <Field label={t.returnReason} name="reason" hint={t.returnReasonHint} optional>
            {(props) => (
              <Textarea
                {...props}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
              />
            )}
          </Field>
          <div className="rounded-lg bg-surface-2 p-3 text-sm">
            <p className="font-medium text-fg" aria-live="polite">
              {t.returnRefund(formatCurrency(refund))}
            </p>
            <p className="mt-1 text-[13px] text-fg-muted">{t.returnShippingNote}</p>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onDone}>
            {copy.common.cancel}
          </Button>
          <Button type="submit">{t.returnSubmit}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
