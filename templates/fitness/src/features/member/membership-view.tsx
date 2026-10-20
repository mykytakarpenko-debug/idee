"use client";

import Link from "next/link";
import { useState } from "react";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useData } from "@/hooks/use-data";
import { useCurrentMember } from "@/hooks/use-member";
import { useNow } from "@/hooks/use-now";
import { parseISODate } from "@/lib/domain/dates";
import { cyclePrice, membershipStatus, nextChargeDate } from "@/lib/domain/membership";
import { formatCurrency, formatDate } from "@/lib/format";
import { useDataStore } from "@/store/data-store";
import { MembershipBadge, PaymentBadge } from "@/components/status-badges";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ToggleRow } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { Receipt } from "lucide-react";

const t = copy.member.membership;

export function MembershipView() {
  const member = useCurrentMember();
  const now = useNow();
  const { plans, payments, settings } = useData((state) => ({
    plans: state.plans,
    payments: state.payments,
    settings: state.settings,
  }));
  const updateMember = useDataStore((state) => state.updateMember);
  const [confirmOff, setConfirmOff] = useState(false);

  if (!member || !now) return null;
  const plan = plans.find((p) => p.id === member.planId);
  const own = payments
    .filter((p) => p.memberId === member.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const status = membershipStatus(member, now, settings.reminderDays);
  const charge = nextChargeDate(member);
  const day = (iso: string) => formatDate(parseISODate(iso), "short");
  const pack = member.cycle === "pack";

  return (
    <div className="mx-auto flex max-w-5xl animate-page-in flex-col gap-6 px-4 py-8 sm:px-6">
      <PageHeader title={t.title} />

      <Card>
        <CardHeader title={plan?.name ?? ""} action={<MembershipBadge status={status} />} />
        <CardContent>
          <dl className="grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-fg-muted">{t.plan}</dt>
              <dd className="mt-1 font-medium text-fg">{t.cycle[member.cycle]}</dd>
            </div>
            <div>
              <dt className="text-xs text-fg-muted">{t.period}</dt>
              <dd className="mt-1 font-medium text-fg">
                {day(member.membershipStart)} – {day(member.membershipEnd)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-fg-muted">{t.price}</dt>
              <dd className="mt-1 font-medium text-fg tabular-nums">
                {plan ? formatCurrency(cyclePrice(plan, member.cycle)) : "—"}
              </dd>
            </div>
          </dl>

          <div className="mt-6 border-t border-line pt-5">
            <ToggleRow
              label={t.autoRenew}
              description={
                pack
                  ? t.autoRenewPack
                  : charge && plan
                    ? t.autoRenewOn(day(charge), formatCurrency(cyclePrice(plan, member.cycle)))
                    : t.autoRenewOff(day(member.membershipEnd))
              }
              control={({ labelId, descriptionId }) => (
                <Switch
                  checked={member.autoRenew}
                  disabled={pack}
                  aria-labelledby={labelId}
                  aria-describedby={descriptionId}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateMember(member.id, { autoRenew: true });
                      toast.success(t.enabled);
                    } else {
                      setConfirmOff(true);
                    }
                  }}
                />
              )}
            />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-2 p-4">
            <div>
              <p className="text-sm font-medium text-fg">{t.change}</p>
              <p className="text-[13px] text-fg-muted">{t.changeHint}</p>
            </div>
            <Link
              href={routes.pricing}
              className={buttonClasses({ variant: "secondary", size: "sm" })}
            >
              {copy.site.cta.pricing}
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title={t.payments} />
        {own.length === 0 ? (
          <EmptyState compact icon={Receipt} title={t.paymentsEmpty} />
        ) : (
          <>
            {/* Smartphone: elenco senza scorrimento orizzontale */}
            <ul className="mt-3 divide-y divide-line md:hidden">
              {own.map((payment) => (
                <li key={payment.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-fg">{payment.description}</p>
                    <p className="text-xs text-fg-muted">
                      {day(payment.date)} · {copy.paymentMethods[payment.method]}
                    </p>
                  </div>
                  <span className="text-fg tabular-nums">{formatCurrency(payment.amount)}</span>
                  <PaymentBadge status={payment.status} />
                </li>
              ))}
            </ul>
            <table className="mt-3 w-full text-sm max-md:hidden">
              <thead>
                <tr className="border-b border-line text-left text-xs text-fg-muted">
                  <th scope="col" className="px-5 py-2 font-medium sm:px-6">
                    {t.date}
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    {t.description}
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    {t.method}
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    {t.amount}
                  </th>
                  <th scope="col" className="px-5 py-2 font-medium sm:px-6">
                    {t.status}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {own.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-5 py-3 text-fg tabular-nums sm:px-6">{day(payment.date)}</td>
                    <td className="px-3 py-3 text-fg">{payment.description}</td>
                    <td className="px-3 py-3 text-fg-muted">
                      {copy.paymentMethods[payment.method]}
                    </td>
                    <td className="px-3 py-3 text-right text-fg tabular-nums">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-5 py-3 sm:px-6">
                      <PaymentBadge status={payment.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Card>

      <p className="text-[13px] text-fg-muted">{t.rights}</p>

      <ConfirmDialog
        open={confirmOff}
        onOpenChange={setConfirmOff}
        title={t.disableTitle}
        description={t.disableText(day(member.membershipEnd))}
        confirmLabel={t.disableConfirm}
        tone="default"
        onConfirm={() => {
          updateMember(member.id, { autoRenew: false });
          toast.success(t.disabled);
        }}
      />
    </div>
  );
}
