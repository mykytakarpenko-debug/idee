"use client";

import { Building2 } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { copy } from "@/content/it";
import { useAuth } from "@/hooks/use-auth";
import { useData } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { invoiceStatus, invoiceTotals, outstanding } from "@/lib/domain/billing";
import { parseISODate, toISODate } from "@/lib/domain/dates";
import { isOpenStatus } from "@/lib/domain/tickets";
import type { Organization, Plan } from "@/lib/domain/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { useDataStore } from "@/store/data-store";
import { InvoiceStatusBadge } from "@/components/badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogBody, DialogContent } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ToggleRow } from "@/components/ui/field";
import { Select } from "@/components/ui/input";
import { Page, PageHeader, Toolbar } from "@/components/ui/page";
import { SearchInput } from "@/components/ui/search-input";
import { Switch } from "@/components/ui/switch";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { toast } from "@/components/ui/toast";

const c = copy.clients;
const PLANS = Object.keys(copy.plans) as Plan[];

export function ClientsView() {
  const now = useNow();
  const { organizations, users, tickets, projects, invoices } = useData((state) => ({
    organizations: state.organizations,
    users: state.users,
    tickets: state.tickets,
    projects: state.projects,
    invoices: state.invoices,
  }));
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const today = now ? toISODate(now) : "";

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return organizations
      .filter((o) => !q || `${o.name} ${o.city} ${o.sector}`.toLowerCase().includes(q))
      .map((o) => {
        const money = today
          ? outstanding(
              invoices.filter((i) => i.orgId === o.id),
              today,
            )
          : { due: 0, overdue: 0 };
        return {
          org: o,
          users: users.filter((u) => u.orgId === o.id && u.status !== "disabled").length,
          tickets: tickets.filter((t) => t.orgId === o.id && isOpenStatus(t.status)).length,
          projects: projects.filter((p) => p.orgId === o.id && p.status !== "completed").length,
          money,
        };
      })
      .sort((a, b) => a.org.name.localeCompare(b.org.name, "it"));
  }, [organizations, users, tickets, projects, invoices, query, today]);

  const selected = organizations.find((o) => o.id === openId) ?? null;

  return (
    <Page>
      <PageHeader title={c.title} description={c.description} />
      <Toolbar>
        <SearchInput
          label={c.search}
          placeholder={c.search}
          value={query}
          onValueChange={setQuery}
          className="sm:max-w-xs"
        />
      </Toolbar>
      <Card>
        {rows.length === 0 ? (
          <EmptyState icon={Building2} title={c.empty} />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{c.columns.name}</TH>
                <TH className="hidden sm:table-cell">{c.columns.plan}</TH>
                <TH align="right" className="hidden md:table-cell">
                  {c.columns.users}
                </TH>
                <TH align="right">{c.columns.tickets}</TH>
                <TH align="right" className="hidden lg:table-cell">
                  {c.columns.projects}
                </TH>
                <TH align="right" className="hidden md:table-cell">
                  {c.columns.outstanding}
                </TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((row) => (
                <TR key={row.org.id} className="hover:bg-surface-2">
                  <TD className="min-w-56">
                    <button
                      type="button"
                      onClick={() => setOpenId(row.org.id)}
                      className="text-left font-medium text-fg hover:underline"
                    >
                      {row.org.name}
                    </button>
                    <p className="flex flex-wrap items-center gap-2 text-[13px] text-fg-muted">
                      {row.org.sector} · {row.org.city}
                      {!row.org.active ? (
                        <Badge tone="neutral">{copy.userStatus.disabled}</Badge>
                      ) : null}
                    </p>
                  </TD>
                  <TD className="hidden text-fg-muted sm:table-cell">{copy.plans[row.org.plan]}</TD>
                  <TD align="right" className="hidden md:table-cell">
                    {row.users}
                  </TD>
                  <TD align="right">{row.tickets}</TD>
                  <TD align="right" className="hidden lg:table-cell">
                    {row.projects}
                  </TD>
                  <TD align="right" className="hidden md:table-cell">
                    <span className={row.money.overdue > 0 ? "font-medium text-danger" : "text-fg"}>
                      {formatCurrency(row.money.due + row.money.overdue)}
                    </span>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
      <Dialog open={selected !== null} onOpenChange={(open) => !open && setOpenId(null)}>
        {selected ? <ClientDialog org={selected} today={today} /> : null}
      </Dialog>
    </Page>
  );
}

function ClientDialog({ org, today }: { org: Organization; today: string }) {
  const { user } = useAuth();
  const { users, invoices } = useData((state) => ({
    users: state.users,
    invoices: state.invoices,
  }));
  const update = useDataStore((state) => state.updateOrganization);
  const markPaid = useDataStore((state) => state.markInvoicePaid);
  const planId = useId();
  const managerId = useId();
  const staff = users.filter((u) => u.orgId === null);
  const orgInvoices = invoices
    .filter((i) => i.orgId === org.id)
    .sort((a, b) => b.issueDate.localeCompare(a.issueDate))
    .slice(0, 6);
  if (!user) return null;
  const save = (input: Partial<Organization>) => {
    update(user.id, org.id, input);
    toast.success(c.updated);
  };
  const date = (iso: string) => formatDate(parseISODate(iso), "short");

  return (
    <DialogContent title={org.name} description={`${org.sector} · ${org.city}`} size="lg">
      <DialogBody className="grid gap-5" tabIndex={0}>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[13px] text-fg-muted">{c.vat}</dt>
            <dd className="mt-0.5 font-mono text-fg">{org.vatNumber}</dd>
          </div>
          <div>
            <dt className="text-[13px] text-fg-muted">{c.sinceLabel}</dt>
            <dd className="mt-0.5 text-fg">{date(org.createdAt)}</dd>
          </div>
        </dl>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={planId} className="text-[13px] font-medium text-fg">
              {c.plan}
            </label>
            <Select
              id={planId}
              value={org.plan}
              onChange={(e) => save({ plan: e.target.value as Plan })}
            >
              {PLANS.map((plan) => (
                <option key={plan} value={plan}>
                  {copy.plans[plan]}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={managerId} className="text-[13px] font-medium text-fg">
              {c.manager}
            </label>
            <Select
              id={managerId}
              value={org.accountManagerId}
              onChange={(e) => save({ accountManagerId: e.target.value })}
            >
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <ToggleRow
          label={c.active}
          description={c.activeHint}
          control={({ labelId, descriptionId }) => (
            <Switch
              checked={org.active}
              aria-labelledby={labelId}
              aria-describedby={descriptionId}
              onCheckedChange={(checked) => save({ active: checked })}
            />
          )}
        />
        <section aria-labelledby={`${planId}-invoices`}>
          <h3 id={`${planId}-invoices`} className="text-sm font-semibold text-fg">
            {c.invoices}
          </h3>
          <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
            {orgInvoices.map((invoice) => {
              const status = today ? invoiceStatus(invoice, today) : "due";
              return (
                <li key={invoice.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-fg">{invoice.number}</p>
                    <p className="text-[13px] text-fg-muted">
                      {copy.invoices.columns.due}: {date(invoice.dueDate)} ·{" "}
                      {formatCurrency(invoiceTotals(invoice).gross)}
                    </p>
                  </div>
                  <InvoiceStatusBadge value={status} />
                  {status !== "paid" ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        markPaid(user.id, invoice.id);
                        toast.success(copy.invoices.markedPaid);
                      }}
                    >
                      {copy.invoices.markPaid}
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      </DialogBody>
    </DialogContent>
  );
}
