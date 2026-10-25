"use client";

import { Download, Receipt } from "lucide-react";
import { useMemo } from "react";
import { copy } from "@/content/it";
import { useAuth } from "@/hooks/use-auth";
import { useData } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { invoiceStatus, invoiceTotals, outstanding } from "@/lib/domain/billing";
import { parseISODate, toISODate } from "@/lib/domain/dates";
import { formatCurrency, formatDate } from "@/lib/format";
import { useDataStore } from "@/store/data-store";
import { InvoiceStatusBadge } from "@/components/badges";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Page, PageHeader } from "@/components/ui/page";
import { StatCard } from "@/components/ui/stat-card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { toast } from "@/components/ui/toast";

const t = copy.invoices;

export function InvoicesView() {
  const now = useNow();
  const { user, org } = useAuth();
  const invoices = useData((state) => state.invoices);
  const log = useDataStore((state) => state.log);
  const today = now ? toISODate(now) : "";
  const own = useMemo(
    () =>
      invoices
        .filter((i) => i.orgId === org?.id)
        .sort((a, b) => b.issueDate.localeCompare(a.issueDate)),
    [invoices, org?.id],
  );
  if (!user || !org) return null;
  const money = today ? outstanding(own, today) : { due: 0, overdue: 0 };
  const date = (iso: string) => formatDate(parseISODate(iso), "short");

  return (
    <Page>
      <PageHeader title={t.title} description={t.description} />
      <section aria-label={t.title} className="grid grid-cols-2 gap-3 sm:gap-4 lg:max-w-xl">
        <StatCard label={t.due} value={formatCurrency(money.due)} />
        <StatCard label={t.overdue} value={formatCurrency(money.overdue)} />
      </section>
      <Card>
        {own.length === 0 ? (
          <EmptyState icon={Receipt} title={t.empty} />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{t.columns.number}</TH>
                <TH className="hidden sm:table-cell">{t.columns.issue}</TH>
                <TH className="hidden md:table-cell">{t.columns.due}</TH>
                <TH align="right">{t.columns.amount}</TH>
                <TH>{t.columns.status}</TH>
                <TH>
                  <span className="sr-only">{copy.common.download}</span>
                </TH>
              </TR>
            </THead>
            <TBody>
              {own.map((invoice) => {
                const status = today ? invoiceStatus(invoice, today) : "due";
                return (
                  <TR key={invoice.id}>
                    <TD>
                      <span className="font-medium text-fg">{invoice.number}</span>
                      <p className="text-[13px] text-fg-muted">{invoice.lines[0]?.description}</p>
                    </TD>
                    <TD className="hidden text-fg-muted sm:table-cell">
                      {date(invoice.issueDate)}
                    </TD>
                    <TD className="hidden text-fg-muted md:table-cell">{date(invoice.dueDate)}</TD>
                    <TD align="right" className="font-medium text-fg">
                      {formatCurrency(invoiceTotals(invoice).gross)}
                    </TD>
                    <TD>
                      <InvoiceStatusBadge value={status} />
                      {invoice.paidAt ? (
                        <p className="mt-1 text-[13px] text-fg-muted">
                          {t.paidOn(date(invoice.paidAt))}
                        </p>
                      ) : null}
                    </TD>
                    <TD align="right">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t.downloadLabel(invoice.number)}
                        onClick={() => {
                          // TODO(integrazione): PDF dal sistema di fatturazione (o XML SdI).
                          log(user.id, "invoice.download", invoice.number, invoice.orgId);
                          toast.success(t.downloaded(invoice.number));
                        }}
                      >
                        <Download aria-hidden />
                      </Button>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        )}
      </Card>
      <p className="text-[13px] text-fg-muted">{t.payInfo}</p>
    </Page>
  );
}
