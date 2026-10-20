"use client";

import { Printer, X } from "lucide-react";
import { copy } from "@/content/it";
import { useData, useDataReady } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { fullName } from "@/lib/domain/clients";
import { paymentDisplayStatus } from "@/lib/domain/payments";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/layout/logo";

const t = copy.payments.receiptPage;

/** Ricevuta di cortesia stampabile (non fiscale). */
export function ReceiptView({ id }: { id: string }) {
  const ready = useDataReady();
  const now = useNow();
  const { payment, client, settings } = useData((state) => {
    const payment = state.payments.find((p) => p.id === id);
    return {
      payment,
      client: state.clients.find((c) => c.id === payment?.clientId),
      settings: state.settings,
    };
  });

  if (!ready || !now) return null;
  if (!payment) {
    return <p className="p-10 text-center text-sm text-fg-muted">{t.notFound}</p>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 print:max-w-none print:p-0">
      <div className="no-print mb-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={() => window.close()}>
          <X aria-hidden />
          {t.back}
        </Button>
        <Button onClick={() => window.print()}>
          <Printer aria-hidden />
          {t.print}
        </Button>
      </div>

      <article className="rounded-xl border border-line bg-surface p-8 shadow-sm print:rounded-none print:border-0 print:shadow-none">
        <header className="flex items-start justify-between gap-6 border-b border-line pb-6">
          <div className="flex items-center gap-3">
            <LogoMark className="size-10" />
            <div>
              <p className="text-base font-semibold text-fg">{settings.name}</p>
              <p className="text-[13px] text-fg-muted">
                {settings.address}, {settings.city}
              </p>
              {settings.vatNumber ? (
                <p className="text-[13px] text-fg-muted">
                  {t.vat} {settings.vatNumber}
                </p>
              ) : null}
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-lg font-semibold text-fg">{t.title}</h1>
            <p className="text-sm text-fg-muted tabular-nums">N. {payment.number}</p>
          </div>
        </header>

        <dl className="grid grid-cols-2 gap-6 py-6 text-sm">
          <div>
            <dt className="text-xs text-fg-muted">{t.issuedTo}</dt>
            <dd className="mt-1 font-medium text-fg">
              {client ? fullName(client) : copy.common.deletedClient}
            </dd>
            {client?.email ? <dd className="text-fg-muted">{client.email}</dd> : null}
          </div>
          <div>
            <dt className="text-xs text-fg-muted">{t.date}</dt>
            <dd className="mt-1 font-medium text-fg">{formatDate(payment.issuedAt, "short")}</dd>
          </div>
          <div>
            <dt className="text-xs text-fg-muted">{t.method}</dt>
            <dd className="mt-1 text-fg">{copy.paymentMethod[payment.method]}</dd>
          </div>
          <div>
            <dt className="text-xs text-fg-muted">{t.status}</dt>
            <dd className="mt-1 text-fg">
              {copy.status.payment[paymentDisplayStatus(payment, now)]}
            </dd>
          </div>
        </dl>

        <table className="w-full border-y border-line text-sm">
          <tbody>
            <tr>
              <td className="py-4 text-fg">{payment.description}</td>
              <td className="py-4 text-right text-fg tabular-nums">
                {formatCurrency(payment.amount)}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="border-t border-line">
              <th scope="row" className="py-4 text-left font-semibold text-fg">
                {t.total}
              </th>
              <td className="py-4 text-right text-lg font-semibold text-fg tabular-nums">
                {formatCurrency(payment.amount)}
              </td>
            </tr>
          </tfoot>
        </table>

        <footer className="pt-6 text-[13px] text-fg-muted">
          <p>{t.thanks}</p>
          <p className="mt-2 text-xs">{t.notFiscal}</p>
        </footer>
      </article>
    </div>
  );
}
