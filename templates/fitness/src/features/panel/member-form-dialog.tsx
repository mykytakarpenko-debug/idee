"use client";

import { addDays, addMonths } from "date-fns";
import { copy } from "@/content/it";
import { useData } from "@/hooks/use-data";
import { parseISODate, toISODate } from "@/lib/domain/dates";
import { memberFormSchema, type MemberFormValues } from "@/lib/domain/schemas";
import type { BillingCycle, Member, Plan } from "@/lib/domain/types";
import { useDataStore } from "@/store/data-store";
import { Button } from "@/components/ui/button";
import { DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useZodForm } from "@/hooks/use-zod-form";

const f = copy.members.form;

function toValues(member: Member | undefined, plans: Plan[]): MemberFormValues {
  return {
    firstName: member?.firstName ?? "",
    lastName: member?.lastName ?? "",
    email: member?.email ?? "",
    phone: member?.phone ?? "",
    planId: member?.planId ?? plans.find((p) => p.featured)?.id ?? plans[0]?.id ?? "",
    cycle: member?.cycle ?? "monthly",
    start: member?.membershipStart ?? toISODate(new Date()),
    medicalCertExpiry: member?.medicalCertExpiry ?? "",
    autoRenew: member?.autoRenew ?? true,
    marketingConsent: member?.marketingConsent ?? false,
    imageConsent: member?.imageConsent ?? false,
    notes: member?.notes ?? "",
  };
}

/** Fine del periodo pagato a partire dalla data di inizio. */
function periodEnd(start: string, cycle: BillingCycle, plan: Plan): string {
  const from = parseISODate(start);
  const end =
    cycle === "annual"
      ? addMonths(from, 12)
      : cycle === "pack"
        ? addDays(from, plan.validityDays ?? 90)
        : addMonths(from, 1);
  return toISODate(addDays(end, -1));
}

export function MemberFormDialog({ id, onDone }: { id?: string; onDone: () => void }) {
  const { member, allPlans } = useData((state) => ({
    member: id ? state.members.find((m) => m.id === id) : undefined,
    allPlans: state.plans,
  }));
  const plans = allPlans.filter((p) => p.active || p.id === member?.planId);
  const createMember = useDataStore((state) => state.createMember);
  const updateMember = useDataStore((state) => state.updateMember);
  const form = useZodForm(memberFormSchema, toValues(member, plans));
  const { values, errors, text, setValue } = form;
  const selectedPlan = plans.find((p) => p.id === values.planId);
  const isPack = selectedPlan?.billing === "pack";

  const onSubmit = form.handleSubmit((data) => {
    const plan = plans.find((p) => p.id === data.planId);
    if (!plan) return;
    const cycle: BillingCycle =
      plan.billing === "pack" ? "pack" : data.cycle === "pack" ? "monthly" : data.cycle;
    const common = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      planId: plan.id,
      cycle,
      autoRenew: cycle === "pack" ? false : data.autoRenew,
      medicalCertExpiry: data.medicalCertExpiry || null,
      marketingConsent: data.marketingConsent,
      imageConsent: data.imageConsent,
      notes: data.notes || undefined,
    };
    if (member) {
      updateMember(member.id, common);
      toast.success(f.updated);
    } else {
      createMember({
        ...common,
        joinedAt: data.start,
        membershipStart: data.start,
        membershipEnd: periodEnd(data.start, cycle, plan),
        entriesLeft: cycle === "pack" ? (plan.entries ?? 10) : null,
        suspended: false,
      });
      toast.success(f.created, { description: `${data.firstName} ${data.lastName}` });
    }
    onDone();
  });

  return (
    <DialogContent title={member ? f.editTitle : f.createTitle} size="lg">
      <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <DialogBody className="grid gap-4 sm:grid-cols-2">
          <Field label={f.firstName} name="firstName" error={errors.firstName}>
            {(props) => <Input {...props} {...text("firstName")} autoComplete="off" />}
          </Field>
          <Field label={f.lastName} name="lastName" error={errors.lastName}>
            {(props) => <Input {...props} {...text("lastName")} autoComplete="off" />}
          </Field>
          <Field label={f.email} name="email" error={errors.email}>
            {(props) => <Input {...props} {...text("email")} type="email" autoComplete="off" />}
          </Field>
          <Field label={f.phone} name="phone" error={errors.phone}>
            {(props) => <Input {...props} {...text("phone")} type="tel" autoComplete="off" />}
          </Field>
          <Field label={f.plan} name="planId" error={errors.planId}>
            {(props) => (
              <Select {...props} {...text("planId")}>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={f.cycle} name="cycle" error={errors.cycle}>
            {(props) => (
              <Select {...props} {...text("cycle")} disabled={isPack}>
                {isPack ? (
                  <option value="pack">{copy.member.membership.cycle.pack}</option>
                ) : (
                  <>
                    <option value="monthly">{copy.member.membership.cycle.monthly}</option>
                    <option value="annual">{copy.member.membership.cycle.annual}</option>
                  </>
                )}
              </Select>
            )}
          </Field>
          {member ? null : (
            <Field label={f.start} name="start" error={errors.start}>
              {(props) => <Input {...props} {...text("start")} type="date" />}
            </Field>
          )}
          <Field
            label={f.certificate}
            name="medicalCertExpiry"
            error={errors.medicalCertExpiry}
            hint={f.certificateHint}
            optional
          >
            {(props) => <Input {...props} {...text("medicalCertExpiry")} type="date" />}
          </Field>
          <Field
            label={f.notes}
            name="notes"
            error={errors.notes}
            hint={f.notesHint}
            optional
            className="sm:col-span-2"
          >
            {(props) => <Textarea {...props} {...text("notes")} rows={2} />}
          </Field>
          <div className="flex flex-col gap-2 sm:col-span-2">
            {(
              [
                ["autoRenew", f.autoRenew],
                ["marketingConsent", f.marketing],
                ["imageConsent", f.images],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm text-fg">
                <Checkbox
                  checked={values[key]}
                  disabled={key === "autoRenew" && isPack}
                  onChange={(event) => setValue(key, event.target.checked)}
                />
                {label}
              </label>
            ))}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={onDone}>
            {copy.common.cancel}
          </Button>
          <Button type="submit">{member ? copy.common.saveChanges : copy.panel.newMember}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
